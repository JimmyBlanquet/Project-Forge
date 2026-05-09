---
name: ai-multi-provider
description: Multi-provider LLM orchestration system with intelligent routing, fallback chains, cost optimization, and automatic observability.
effort: medium
---

# AI Multi-Provider Skill

**Version:** 1.0.0
**Category:** Core
**Extracted from:** Production-tested in a real-world SaaS
**Production-ready:** ✅ Yes

## Description

Multi-provider LLM orchestration system with intelligent routing, fallback chains, cost optimization, and automatic observability.

**Key Features:**
- 🔄 **Multi-Provider Support**: Anthropic Claude, OpenAI GPT, Mistral AI
- 💰 **Cost Optimization**: Task-based routing (Haiku for cheap tasks, Sonnet for quality)
- 🛡️ **Resilience**: Automatic fallback chain with circuit breaker
- 📊 **Observability**: Built-in cost tracking, latency monitoring, trace persistence
- ⚙️ **Configurable**: Environment variable overrides for all settings
- 🎯 **Type-Safe**: Full TypeScript support with Zod schema validation

## What This Skill Provides

### Core Components

1. **LLMClient** (`lib/ai/client.ts`)
   - Unified interface for all LLM providers
   - Task-based routing for cost optimization
   - Automatic fallback chain
   - Circuit breaker to prevent infinite retries
   - Timeout handling (30s default)

2. **Multi-Provider Support** (`lib/ai/providers/`)
   - **Anthropic**: Claude Opus/Sonnet/Haiku with prompt caching (90% cost savings)
   - **OpenAI**: GPT-4o/mini with native structured outputs
   - **Mistral**: Mistral Large/Small models
   - Extensible factory pattern for adding new providers

3. **Configuration System** (`lib/ai/config.ts`)
   - Task-to-provider mapping
   - Environment variable overrides
   - Fallback chain configuration
   - Retry and timeout settings

4. **Observability** (`lib/ai/tracer.ts`)
   - Automatic cost calculation (tokens × pricing)
   - Latency tracking
   - Trace persistence to Supabase (optional)
   - Error type detection

5. **Utilities**
   - JSON parsing with Claude-specific handling
   - Zod schema validation for structured outputs
   - Type-safe interfaces

## Installation

### 1. Run Installation Script

```bash
cd skills/core/ai-multi-provider
bash install.sh
```

This will:
- Copy all AI files to your project
- Install npm dependencies
- Create environment variable template
- Set up optional Supabase integration

### 2. Install Dependencies

```bash
npm install @anthropic-ai/sdk openai zod
# Optional providers
npm install @mistralai/mistralai
# Optional observability
npm install @supabase/supabase-js
```

### 3. Configure Environment Variables

Create or update your `.env.local`:

```bash
# Required: At least one provider
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx  # Optional
MISTRAL_API_KEY=xxx    # Optional

# Optional: Override default provider
LLM_PROVIDER=anthropic

# Optional: Override per-task providers
LLM_FAST_PROVIDER=anthropic/claude-haiku-4-5
LLM_QUALITY_PROVIDER=anthropic/claude-sonnet-4-5
LLM_EXTRACTION_PROVIDER=anthropic/claude-haiku-4-5
LLM_GENERATION_PROVIDER=anthropic/claude-sonnet-4-5

# Optional: Supabase for trace persistence
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### 4. Optional: Set Up Supabase Tracing

If you want automatic cost/latency tracking:

```sql
-- Run this migration in your Supabase project
CREATE TABLE llm_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_input INTEGER NOT NULL,
  tokens_output INTEGER NOT NULL,
  cost DECIMAL(10, 6) NOT NULL,
  latency_ms INTEGER NOT NULL,
  status TEXT NOT NULL,
  error_type TEXT,
  error_message TEXT,
  agent_id TEXT,
  entity_id TEXT,
  entity_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_llm_traces_created_at ON llm_traces(created_at);
CREATE INDEX idx_llm_traces_operation ON llm_traces(operation);
CREATE INDEX idx_llm_traces_agent_id ON llm_traces(agent_id);
```

## Usage

### Basic Usage

```typescript
import { llmClient } from '@/lib/ai/client'

// Simple generation
const result = await llmClient.generate({
  model: 'claude-sonnet-4-5',
  prompt: 'Explain quantum computing in simple terms',
  systemPrompt: 'You are a helpful teacher',
  temperature: 0.7,
  maxTokens: 500
})

console.log(result.content)
console.log(`Cost: $${result.cost.toFixed(4)}`)
console.log(`Latency: ${result.latencyMs}ms`)
```

### Task-Based Routing

```typescript
import { llmClient } from '@/lib/ai/client'
import { TaskName } from '@/lib/ai/providers/base'

// Fast, cheap task (automatically routed to Haiku)
const classification = await llmClient.generate({
  prompt: 'Classify this email: "Meeting tomorrow at 3pm"',
  task: TaskName.FastTask // Uses Haiku ($1/M input)
})

// Quality task (automatically routed to Sonnet)
const content = await llmClient.generate({
  prompt: 'Write a blog post about AI ethics',
  task: TaskName.QualityTask // Uses Sonnet ($3/M input)
})
```

### Structured Output with Zod

```typescript
import { llmClient } from '@/lib/ai/client'
import { z } from 'zod'

const EmailSchema = z.object({
  subject: z.string(),
  category: z.enum(['urgent', 'normal', 'spam']),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  action_required: z.boolean()
})

const result = await llmClient.generate({
  model: 'claude-haiku-4-5',
  prompt: 'Analyze this email: "URGENT: Server down!"',
  schema: EmailSchema
})

const parsed = EmailSchema.parse(JSON.parse(result.content))
console.log(parsed.category) // 'urgent'
console.log(parsed.action_required) // true
```

### Fallback Chain

```typescript
// If Anthropic fails, automatically tries OpenAI, then Mistral
const result = await llmClient.generate({
  prompt: 'Generate a summary',
  // Fallback chain: anthropic → openai → mistral
})
```

### Direct Provider Access

```typescript
import { getLLMClient } from '@/lib/ai/client'

const client = getLLMClient()
const providers = client.getAvailableProviders()
console.log(providers) // ['anthropic', 'openai']

// Generate with specific provider
const result = await client.generateWithProvider('openai', {
  model: 'gpt-4o-mini',
  prompt: 'Hello, world!'
})
```

## Configuration

### Task Definitions

Customize task types in `lib/ai/providers/base.ts`:

```typescript
export enum TaskName {
  // Default tasks
  FastTask = 'fast_task',
  QualityTask = 'quality_task',

  // Add your custom tasks
  EmailClassification = 'email_classification',
  LeadExtraction = 'lead_extraction',
  ContentGeneration = 'content_generation',
}
```

### Provider Routing

Customize routing in `lib/ai/config.ts`:

```typescript
providerForTask: {
  [TaskName.FastTask]: {
    provider: 'anthropic',
    model: 'claude-haiku-4-5'
  },
  [TaskName.EmailClassification]: {
    provider: 'openai',
    model: 'gpt-4o-mini' // Cheaper alternative
  },
}
```

### Cost Optimization

**Default Configuration:**
- **FastTask** → Haiku: $1/M input, $5/M output (with caching: ~$0.24/M effective)
- **QualityTask** → Sonnet: $3/M input, $15/M output (with caching: ~$0.72/M effective)

**Cost Savings with Prompt Caching:**
- Cache write: +25% cost
- Cache read: -90% cost
- With 80% hit rate: **~76% total savings**

## Testing

```bash
cd skills/core/ai-multi-provider
npm test
```

## Dependencies

### Required
- `@anthropic-ai/sdk` - Anthropic Claude API
- `openai` - OpenAI GPT API (optional provider)
- `zod` - Schema validation

### Optional
- `@mistralai/mistralai` - Mistral AI provider
- `@supabase/supabase-js` - Trace persistence

## Architecture

```
lib/ai/
├── client.ts                    # Main LLMClient (entry point)
├── config.ts                    # Configuration & routing
├── tracer.ts                    # Observability & cost tracking
├── fallback.ts                  # Fallback handler
├── providers/
│   ├── base.ts                  # Interfaces & types
│   ├── anthropic.ts             # Anthropic provider
│   ├── openai.ts                # OpenAI provider
│   ├── mistral.ts               # Mistral provider
│   ├── factory.ts               # Provider factory
│   └── index.ts                 # Exports
└── helpers/
    └── parse-claude-json.ts     # JSON parsing utilities
```

## Customization

### Adding a New Provider

1. Create `lib/ai/providers/your-provider.ts`:

```typescript
import { LLMProvider, GenerateParams, GenerateResult } from './base'

export class YourProvider implements LLMProvider {
  readonly name = 'your-provider'

  async generate(params: GenerateParams): Promise<GenerateResult> {
    // Implementation
  }

  getAvailableModels(): string[] {
    return ['model-1', 'model-2']
  }

  getPricing(model: string): ModelPricing {
    return { input: 1.0 / 1_000_000, output: 5.0 / 1_000_000 }
  }
}
```

2. Add to factory in `lib/ai/providers/factory.ts`:

```typescript
import { YourProvider } from './your-provider'

if (process.env.YOUR_PROVIDER_API_KEY) {
  providers.set('your-provider', new YourProvider())
}
```

3. Update fallback chain in `lib/ai/config.ts`:

```typescript
fallbackChain: ['anthropic', 'openai', 'your-provider']
```

## Troubleshooting

### "No LLM providers available"

Ensure at least one API key is set:
```bash
ANTHROPIC_API_KEY=sk-ant-xxx
```

### Tracer errors

If you don't use Supabase, comment out tracer calls in `client.ts` or provide a no-op tracer.

### High costs

1. Use task-based routing (FastTask for cheap operations)
2. Enable prompt caching (Anthropic only)
3. Monitor costs with `llmTracer` traces

## Performance

**Benchmarks** (from internal SaaS production):
- Average latency: 800-1200ms
- Cost per 1K emails: ~$0.50 (with caching)
- Fallback rate: <1% (Anthropic reliability)

## License

MIT

## Support

For issues or questions, see Project-Forge documentation.

---

**Extracted from:** a previous internal SaaS (production-grade, 67K lines)
**Last updated:** 2026-01-17
