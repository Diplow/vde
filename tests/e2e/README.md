** WIP Implementation **

# E2E Tests (Offline UI Tests)

This directory contains offline UI tests for Hexframe using Playwright. These tests verify UI behavior using localStorage-based caching without requiring a running server or database (beyond the Next.js dev server).

## Offline Mode Architecture

The tests run in offline mode which:
- Uses localStorage as the data source instead of server APIs
- Populates test data directly into browser storage
- Verifies UI behavior and cache operations
- Ensures the app works without network connectivity

## Running Tests

### Prerequisites
```bash
pnpm dev   # Start dev server on port 3000
```

### Test Commands
```bash
pnpm test:e2e:ui      # Open Playwright UI for interactive debugging
pnpm test:e2e         # Run all tests in terminal
pnpm test:e2e:debug   # Debug mode with Playwright inspector
pnpm test:e2e:headed  # Run with visible browser window
```

## Test Structure

```
tests/e2e/
├── fixtures/         # Test data and setup
├── actions/          # Reusable test actions
└── scenarios/        # Test scenarios
```

## Environment Variables

Tests use `.env.test` for configuration:
- `USER_TEST_PORT=3001` - Port for interactive E2E testing
- `CI_TEST_PORT=3002` - Port for CI/automated testing
- `TEST_DATABASE_URL` - Test database connection

## Setup

Before running tests:
1. Install Playwright browsers: `pnpm test:e2e:install`
2. Setup test database: `pnpm test:e2e:setup`

## Debugging

See [LOGGING.md](./LOGGING.md) for information about the E2E test logging system that helps debug test failures.