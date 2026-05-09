# AI Multi-Provider Skill

Multi-provider LLM orchestration with intelligent routing, fallback chains, and cost optimization.

## Quick Install

```bash
cd skills/core/ai-multi-provider
bash install.sh
```

## What You Get

- ✅ Multi-provider support (Anthropic, OpenAI, Mistral)
- ✅ Task-based routing for cost optimization
- ✅ Automatic fallback chains
- ✅ Built-in observability and cost tracking
- ✅ TypeScript + Zod validation
- ✅ Production-tested (internal SaaS 67K lines)

## Quick Start

```typescript
import { llmClient } from '@/lib/ai/client'
import { TaskName } from '@/lib/ai/providers/base'

// Fast task (uses Haiku - cheap)
const result = await llmClient.generate({
  prompt: 'Classify this email',
  task: TaskName.FastTask // $1/M input
})

// Quality task (uses Sonnet - better)
const content = await llmClient.generate({
  prompt: 'Write a blog post',
  task: TaskName.QualityTask // $3/M input
})
```

## Cost Optimization

- **FastTask**: Haiku ($1/M) with caching → ~$0.24/M effective
- **QualityTask**: Sonnet ($3/M) with caching → ~$0.72/M effective
- **Savings**: ~76% with prompt caching

## Documentation

See [SKILL.md](./SKILL.md) for complete documentation.

## Files Installed

```
src/lib/ai/
├── client.ts              # Main LLMClient
├── config.ts              # Configuration
├── tracer.ts              # Observability
├── fallback.ts            # Fallback handler
├── providers/
│   ├── base.ts            # Interfaces
│   ├── anthropic.ts       # Claude provider
│   ├── openai.ts          # GPT provider
│   ├── mistral.ts         # Mistral provider
│   ├── factory.ts         # Provider factory
│   └── index.ts           # Exports
└── helpers/
    └── parse-claude-json.ts
```

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-xxx

# Optional
OPENAI_API_KEY=sk-xxx
MISTRAL_API_KEY=xxx
LLM_PROVIDER=anthropic
LLM_FAST_PROVIDER=anthropic/claude-haiku-4-5
LLM_QUALITY_PROVIDER=anthropic/claude-sonnet-4-5
```

## Tests

```bash
npm test
```

---

**Version:** 1.0.0
**Extracted from:** internal production SaaS
**License:** MIT
