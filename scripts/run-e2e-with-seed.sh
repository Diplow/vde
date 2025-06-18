#!/bin/bash

# Script to run E2E tests with database seeding
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting E2E tests...${NC}"

# Check if dev server is running on port 3000 or 3001
PORT=3000
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        PORT=3001
    else
        echo -e "${RED}Error: Dev server is not running on port 3000 or 3001${NC}"
        echo -e "${YELLOW}Please run 'pnpm dev' in another terminal${NC}"
        exit 1
    fi
fi

export NEXT_PUBLIC_URL="http://localhost:$PORT"

echo -e "${GREEN}✓ Dev server is running${NC}"

# Run playwright tests with passed arguments
echo -e "${YELLOW}Running Playwright tests...${NC}"
npx playwright test "$@"

echo -e "${GREEN}✓ E2E tests completed${NC}"