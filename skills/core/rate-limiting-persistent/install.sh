#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SKILL_NAME="rate-limiting-persistent"
SKILL_VERSION="1.0.0"

echo -e "${GREEN}📦 Installing skill: ${SKILL_NAME} v${SKILL_VERSION}${NC}"
echo ""

# Detect project root
PROJECT_ROOT=$(pwd)
while [[ ! -f "$PROJECT_ROOT/package.json" ]] && [[ "$PROJECT_ROOT" != "/" ]]; do
  PROJECT_ROOT=$(dirname "$PROJECT_ROOT")
done

if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
  echo -e "${RED}❌ Error: Could not find package.json${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Project root:${NC} $PROJECT_ROOT"
echo ""

SKILL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Step 1: Copy files
echo -e "${GREEN}📂 Copying rate limiting files...${NC}"

TARGET_DIR="$PROJECT_ROOT/src/lib/rate-limit"
mkdir -p "$TARGET_DIR"

cp -r "$SKILL_DIR/files/lib/rate-limit/"* "$TARGET_DIR/"

echo -e "${GREEN}✓ Files copied to:${NC} src/lib/rate-limit/"
echo ""

# Step 2: Copy Supabase migration
echo -e "${GREEN}🗄️  Copying Supabase migration...${NC}"

MIGRATION_DIR="$PROJECT_ROOT/supabase/migrations"

if [[ -d "$MIGRATION_DIR" ]]; then
  cp "$SKILL_DIR/supabase/migrations/"*.sql "$MIGRATION_DIR/"
  echo -e "${GREEN}✓ Migration copied to:${NC} supabase/migrations/"
else
  echo -e "${YELLOW}⚠️  No supabase/migrations directory found${NC}"
  echo "   Migration file is at: $SKILL_DIR/supabase/migrations/"
  echo "   Apply it manually in your Supabase dashboard"
fi

echo ""

# Step 3: Check dependencies
echo -e "${GREEN}📦 Checking dependencies...${NC}"

if grep -q "@supabase/supabase-js" "$PROJECT_ROOT/package.json"; then
  echo -e "${GREEN}✓ @supabase/supabase-js already installed${NC}"
else
  echo -e "${YELLOW}⚠️  @supabase/supabase-js not found${NC}"
  echo "   Install with: npm install @supabase/supabase-js"
fi

echo ""

# Step 4: Instructions
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo -e "${GREEN}📖 Next Steps:${NC}"
echo ""
echo "1. Apply Supabase migration:"
echo "   supabase db push"
echo "   OR manually run the SQL from:"
echo "   $SKILL_DIR/supabase/migrations/20251223100001_create_rate_limits.sql"
echo ""
echo "2. Test the rate limiter:"
cat << 'EOF'
   import { checkRateLimit } from '@/lib/rate-limit/persistent-limiter'

   const result = await checkRateLimit(userId, {
     action: 'api',
     maxRequests: 60,
     windowSeconds: 60
   })

   if (!result.allowed) {
     return new Response('Rate limited', { status: 429 })
   }
EOF
echo ""
echo -e "${GREEN}📚 Full documentation:${NC} $SKILL_DIR/SKILL.md"
echo ""
echo -e "${GREEN}🎉 Happy coding!${NC}"
