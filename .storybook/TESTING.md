# Storybook Testing Configuration

## Overview

This project uses both regular Vitest tests and Storybook component tests. To avoid conflicts, these are configured separately.

## Running Tests

### Regular Tests (Unit & Integration)
```bash
pnpm test              # Run all tests using scripts/run-tests.sh
pnpm test:run          # Run tests once
pnpm test:watch        # Run tests in watch mode
pnpm test:ui           # Run tests with UI
```

These commands explicitly use `vitest.config.ts` to avoid loading the Storybook test plugin.

### Storybook Tests
```bash
pnpm test:storybook    # Run Storybook component tests
```

This command uses `vitest.workspace.ts` which includes the Storybook test plugin.

## Configuration Files

- **`vitest.config.ts`**: Main test configuration for unit and integration tests
- **`vitest.workspace.ts`**: Workspace configuration that includes Storybook test setup
- **`.storybook/vitest.setup.ts`**: Setup file for Storybook tests

## Common Issues

### "Vitest failed to find the current suite" Error

This error occurs when the Storybook test plugin is loaded during regular test runs. The solution is to explicitly use `--config vitest.config.ts` when running regular tests, which is now handled automatically by the npm scripts.

### Test Isolation

Some React component tests require isolation to run properly. Use `pnpm test:all` to run tests with proper isolation.