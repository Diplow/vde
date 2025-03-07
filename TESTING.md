# Testing Guide

This document provides information on how to run tests in this project.

## Running Tests

There are several ways to run tests in this project:

### Using npm/pnpm Scripts

The following scripts are available in `package.json`:

- `pnpm test` - Run tests in interactive mode
- `pnpm test:run` - Run all tests once
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Run tests with UI
- `pnpm test:coverage` - Run tests with coverage

### Using the Test Runner Script

For convenience, a test runner script is provided:

```bash
# Run all tests once
./run-tests.sh

# Run tests in watch mode
./run-tests.sh --watch
# or
./run-tests.sh -w

# Run tests with UI
./run-tests.sh --ui
# or
./run-tests.sh -u

# Run tests with coverage
./run-tests.sh --coverage
# or
./run-tests.sh -c

# Show help
./run-tests.sh --help
# or
./run-tests.sh -h
```

### Using VS Code Tasks

VS Code tasks are configured for running tests. Press `Ctrl+Shift+P` and type "Tasks: Run Task" to see the available test tasks:

- Run All Tests
- Run Tests (Watch Mode)
- Run Tests (UI Mode)
- Run Tests (Coverage)

### Using VS Code Keyboard Shortcuts

When the terminal is focused, you can use the following keyboard shortcuts:

- `Ctrl+Shift+T` - Run all tests
- `Ctrl+Shift+W` - Run tests in watch mode
- `Ctrl+Shift+U` - Run tests with UI
- `Ctrl+Shift+C` - Run tests with coverage

## Writing Tests

Tests are written using [Vitest](https://vitest.dev/) and are located in files with `.test.ts` or `.test.tsx` extensions.

### Example Test

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./myFile";

describe("myFunction", () => {
  it("should return the expected result", () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });
});
```

## Test Coverage

To view test coverage, run:

```bash
pnpm test:coverage
# or
./run-tests.sh --coverage
```

This will generate a coverage report in the `coverage` directory.
