#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default mode
MODE="run"
INTEGRATION="all"

# Load test environment variables if running integration tests
if [ -f .env.test ]; then
  echo -e "${BLUE}Loading environment variables from .env.test${NC}"
  export $(grep -v '^#' .env.test | xargs)
  echo -e "TEST_DATABASE_URL: ${GREEN}$TEST_DATABASE_URL${NC}"
else
  echo -e "${YELLOW}Warning: .env.test file not found${NC}"
fi

# Set test environment variables
export NODE_ENV=test
export VITEST=true
export SKIP_ENV_VALIDATION=true

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --watch|-w)
      MODE="watch"
      shift
      ;;
    --ui|-u)
      MODE="ui"
      shift
      ;;
    --coverage|-c)
      MODE="coverage"
      shift
      ;;
    --integration-only|-i)
      INTEGRATION="only"
      shift
      ;;
    --skip-integration|-s)
      INTEGRATION="skip"
      shift
      ;;
    --help|-h)
      echo -e "${BLUE}Test Runner Script${NC}"
      echo "Usage: ./run-tests.sh [options]"
      echo ""
      echo "Options:"
      echo "  --watch, -w              Run tests in watch mode"
      echo "  --ui, -u                 Run tests with UI"
      echo "  --coverage, -c           Run tests with coverage"
      echo "  --integration-only, -i   Run only integration tests"
      echo "  --skip-integration, -s   Skip integration tests"
      echo "  --help, -h               Show this help message"
      exit 0
      ;;
    *)
      # Unknown option
      echo "Unknown option: $1"
      echo "Use --help to see available options"
      exit 1
      ;;
  esac
done

# Build the test command based on integration flag
TEST_COMMAND=""
case $INTEGRATION in
  "only")
    echo -e "${CYAN}Running only integration tests...${NC}"
    TEST_COMMAND="NODE_ENV=test VITEST=true SKIP_ENV_VALIDATION=true TEST_DATABASE_URL=\"$TEST_DATABASE_URL\" pnpm test:$MODE -- -t 'integration'"
    ;;
  "skip")
    echo -e "${YELLOW}Skipping integration tests...${NC}"
    TEST_COMMAND="pnpm test:$MODE -- --testPathIgnorePatterns '.*\.integration\.test\..*'"
    ;;
  "all")
    echo -e "${GREEN}Running all tests...${NC}"
    TEST_COMMAND="NODE_ENV=test VITEST=true SKIP_ENV_VALIDATION=true TEST_DATABASE_URL=\"$TEST_DATABASE_URL\" pnpm test:$MODE"
    ;;
esac

# Run tests based on mode and integration flag
echo -e "Executing: ${BLUE}$TEST_COMMAND${NC}"
eval $TEST_COMMAND 