#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Skill information
SKILL_NAME="ai-multi-provider"
SKILL_VERSION="1.0.0"

echo -e "${GREEN}📦 Installing skill: ${SKILL_NAME} v${SKILL_VERSION}${NC}"
echo ""

# Detect project root (where package.json is)
PROJECT_ROOT=$(pwd)
while [[ ! -f "$PROJECT_ROOT/package.json" ]] && [[ "$PROJECT_ROOT" != "/" ]]; do
  PROJECT_ROOT=$(dirname "$PROJECT_ROOT")
done

if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
  echo -e "${RED}❌ Error: Could not find package.json. Please run this script from within your project.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Project root:${NC} $PROJECT_ROOT"
echo ""

# Check if it's a TypeScript project
if [[ ! -f "$PROJECT_ROOT/tsconfig.json" ]]; then
  echo -e "${YELLOW}⚠️  Warning: No tsconfig.json found. This skill requires TypeScript.${NC}"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Get the skill directory (where this script is)
SKILL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Step 1: Copy files
echo -e "${GREEN}📂 Copying AI files to project...${NC}"

# Create target directory
TARGET_DIR="$PROJECT_ROOT/src/lib/ai"
mkdir -p "$TARGET_DIR"

# Copy all files
cp -r "$SKILL_DIR/files/lib/ai/"* "$TARGET_DIR/"

echo -e "${GREEN}✓ Files copied to:${NC} src/lib/ai/"
echo ""

# Step 2: Install npm dependencies
echo -e "${GREEN}📦 Installing npm dependencies...${NC}"

cd "$PROJECT_ROOT"

# Check package manager
if [[ -f "pnpm-lock.yaml" ]]; then
  PKG_MANAGER="pnpm"
elif [[ -f "yarn.lock" ]]; then
  PKG_MANAGER="yarn"
elif [[ -f "bun.lockb" ]]; then
  PKG_MANAGER="bun"
else
  PKG_MANAGER="npm"
fi

echo -e "${GREEN}✓ Using package manager:${NC} $PKG_MANAGER"
echo ""

# Required dependencies
echo "Installing required dependencies..."
$PKG_MANAGER add @anthropic-ai/sdk openai zod

echo ""
echo -e "${YELLOW}Optional dependencies (install if needed):${NC}"
echo "  $PKG_MANAGER add @mistralai/mistralai  # For Mistral AI provider"
echo "  $PKG_MANAGER add @supabase/supabase-js # For trace persistence"
echo ""

# Step 3: Environment variables
echo -e "${GREEN}🔑 Setting up environment variables...${NC}"

ENV_FILE="$PROJECT_ROOT/.env.local"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

# Check if .env.local exists
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Creating .env.local..."
  touch "$ENV_FILE"
fi

# Add environment variables if not already present
add_env_var() {
  local var_name=$1
  local var_value=$2
  local description=$3

  if ! grep -q "^${var_name}=" "$ENV_FILE"; then
    echo "" >> "$ENV_FILE"
    echo "# $description" >> "$ENV_FILE"
    echo "${var_name}=${var_value}" >> "$ENV_FILE"
    echo -e "${GREEN}✓ Added${NC} $var_name"
  else
    echo -e "${YELLOW}⚠ Skipped${NC} $var_name (already exists)"
  fi
}

echo ""
echo "Adding environment variables to .env.local..."
echo ""

add_env_var "ANTHROPIC_API_KEY" "sk-ant-xxx" "Anthropic Claude API key (required)"
add_env_var "OPENAI_API_KEY" "sk-xxx" "OpenAI GPT API key (optional)"
add_env_var "MISTRAL_API_KEY" "xxx" "Mistral AI API key (optional)"
add_env_var "LLM_PROVIDER" "anthropic" "Default LLM provider"
add_env_var "LLM_FAST_PROVIDER" "anthropic/claude-haiku-4-5" "Provider for fast/cheap tasks"
add_env_var "LLM_QUALITY_PROVIDER" "anthropic/claude-sonnet-4-5" "Provider for quality tasks"
add_env_var "LLM_EXTRACTION_PROVIDER" "anthropic/claude-haiku-4-5" "Provider for extraction tasks"
add_env_var "LLM_GENERATION_PROVIDER" "anthropic/claude-sonnet-4-5" "Provider for generation tasks"

echo ""

# Step 4: Optional Supabase setup
echo -e "${GREEN}🗄️  Optional: Supabase trace persistence${NC}"
echo ""
echo "If you want automatic cost/latency tracking, set up Supabase:"
echo ""
echo "1. Add to .env.local:"
echo "   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co"
echo "   SUPABASE_SERVICE_ROLE_KEY=xxx"
echo ""
echo "2. Run migration in your Supabase project:"
echo "   See: $SKILL_DIR/docs/supabase-migration.sql"
echo ""

# Create migration file
mkdir -p "$SKILL_DIR/docs"
cat > "$SKILL_DIR/docs/supabase-migration.sql" << 'EOF'
-- LLM Traces Table
-- Stores cost, latency, and observability data for all LLM operations

CREATE TABLE IF NOT EXISTS llm_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_input INTEGER NOT NULL,
  tokens_output INTEGER NOT NULL,
  cost DECIMAL(10, 6) NOT NULL,
  latency_ms INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_type TEXT,
  error_message TEXT,
  agent_id TEXT,
  entity_id TEXT,
  entity_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_llm_traces_created_at ON llm_traces(created_at);
CREATE INDEX IF NOT EXISTS idx_llm_traces_operation ON llm_traces(operation);
CREATE INDEX IF NOT EXISTS idx_llm_traces_agent_id ON llm_traces(agent_id);
CREATE INDEX IF NOT EXISTS idx_llm_traces_status ON llm_traces(status);
CREATE INDEX IF NOT EXISTS idx_llm_traces_provider ON llm_traces(provider);

-- RLS (Row Level Security) - adjust based on your needs
ALTER TABLE llm_traces ENABLE ROW LEVEL SECURITY;

-- Example policy: Allow authenticated users to read their own traces
-- CREATE POLICY "Users can read their own traces" ON llm_traces
--   FOR SELECT USING (auth.uid()::text = agent_id);
EOF

echo -e "${GREEN}✓ Created Supabase migration:${NC} $SKILL_DIR/docs/supabase-migration.sql"
echo ""

# Step 5: Update tsconfig paths (if needed)
echo -e "${GREEN}⚙️  Checking TypeScript configuration...${NC}"

if [[ -f "$PROJECT_ROOT/tsconfig.json" ]]; then
  if grep -q '"@/\*"' "$PROJECT_ROOT/tsconfig.json"; then
    echo -e "${GREEN}✓ Path alias '@/*' already configured${NC}"
  else
    echo -e "${YELLOW}⚠️  Path alias '@/*' not found in tsconfig.json${NC}"
    echo "   Add this to your tsconfig.json:"
    echo '   "paths": {'
    echo '     "@/*": ["./src/*"]'
    echo '   }'
  fi
fi

echo ""

# Step 6: Usage example
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo -e "${GREEN}📖 Quick Start:${NC}"
echo ""
echo "1. Set your API key in .env.local:"
echo "   ANTHROPIC_API_KEY=sk-ant-your-key-here"
echo ""
echo "2. Use in your code:"
echo ""
cat << 'EOF'
   import { llmClient } from '@/lib/ai/client'

   const result = await llmClient.generate({
     model: 'claude-sonnet-4-5',
     prompt: 'Explain quantum computing',
     systemPrompt: 'You are a helpful teacher',
   })

   console.log(result.content)
   console.log(`Cost: $${result.cost.toFixed(4)}`)
EOF
echo ""
echo -e "${GREEN}📚 Full documentation:${NC} $SKILL_DIR/SKILL.md"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "  1. Update ANTHROPIC_API_KEY in .env.local"
echo "  2. Review configuration in src/lib/ai/config.ts"
echo "  3. Customize TaskName enum if needed (src/lib/ai/providers/base.ts)"
echo "  4. Run tests: npm test"
echo ""
echo -e "${GREEN}🎉 Happy coding!${NC}"
