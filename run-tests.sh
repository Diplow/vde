#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default mode
MODE="run"

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
    --help|-h)
      echo -e "${BLUE}Test Runner Script${NC}"
      echo "Usage: ./run-tests.sh [options]"
      echo ""
      echo "Options:"
      echo "  --watch, -w     Run tests in watch mode"
      echo "  --ui, -u        Run tests with UI"
      echo "  --coverage, -c  Run tests with coverage"
      echo "  --help, -h      Show this help message"
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

# Run tests based on mode
case $MODE in
  "run")
    echo -e "${GREEN}Running all tests...${NC}"
    pnpm test:run
    ;;
  "watch")
    echo -e "${YELLOW}Running tests in watch mode...${NC}"
    pnpm test:watch
    ;;
  "ui")
    echo -e "${BLUE}Running tests with UI...${NC}"
    pnpm test:ui
    ;;
  "coverage")
    echo -e "${GREEN}Running tests with coverage...${NC}"
    pnpm test:coverage
    ;;
esac 