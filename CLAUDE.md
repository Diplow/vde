# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hexframe is a visual framework for building and sharing AI-powered systems through hierarchical hexagonal maps. It transforms complex AI interactions from "prompt engineering" into "context architecture" - allowing users to visually build, compose, and share structured AI workflows.

Core philosophy: Where human intent meets AI capability through strategic mapping.

## Development Commands

### Core Development
```bash
pnpm dev          # Start development server (port 3000)
pnpm build        # Build production bundle
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript type checking
```

### Testing
```bash
./scripts/run-tests.sh    # Run all tests (uses Vitest, not Jest)
./scripts/run-tests.sh -w # Watch mode
./scripts/run-tests.sh --ui # UI mode
pnpm test:unit    # Unit tests only
pnpm test:integration # Integration tests only
pnpm test         # Always use pnpm test to run tests
pnpm storybook    # Component development with Storybook
```

## Code Quality

After completing any task, refactor for clarity following the workflow in `prompts/claude/REFACTOR_CLARITY.md`:

1. **Pre-Refactoring Analysis**: Identify concepts and get user validation BEFORE refactoring
2. **Apply Core Principles**:
   - The Fundamental Rule: Function names explain WHAT, arguments explain WHAT'S NEEDED, body explains HOW
   - Rule of 6: Max 6 files/folders per directory, max 6 functions per file, max 50 lines per function (flexible for low-level code)
   - Single Level of Abstraction: Each level (folder/file/function) maintains consistent abstraction
3. **Execute Independently**: Complete the entire refactoring after validation

### E2E Testing (Offline UI Tests)

E2E tests run in offline mode using localStorage-based caching. They verify UI behavior without server dependencies.

#### Running E2E Tests

```bash
# Prerequisites: Dev server must be running
pnpm dev                      # Start dev server on port 3000

# Run tests
pnpm test:e2e:ui             # Opens Playwright UI for interactive test debugging
pnpm test:e2e                # Runs all E2E tests in terminal (offline mode)
pnpm test:e2e:debug          # Debug mode with Playwright inspector
pnpm test:e2e:headed         # Run tests with visible browser window
```

**Note**: Tests use offline mode with localStorage persistence. No server/database required beyond the dev server.

[Rest of the file remains unchanged]