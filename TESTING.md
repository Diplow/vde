# Testing Guide

This project uses Vitest for testing and includes both unit tests and integration tests.

## Test Types

- **Unit Tests**: Tests that mock dependencies and focus on testing a single unit of code in isolation.
- **Integration Tests**: Tests that use real dependencies (like databases) and test how components work together.

## Test Database Setup

Integration tests require a test database. Follow these steps to set up your test database:

1. Create a `.env.test` file in the project root (if not already present) with your test database connection:

```
TEST_DATABASE_URL=postgres://username:password@localhost:5432/test_db
```

2. Run the test database setup script:

```bash
./setup-test-db.sh
```

This script will:

- Create the test database if it doesn't exist
- Run migrations to set up the schema
- Prepare the database for testing

> **Note**: Never use your production database for testing!

## Running Tests

We provide a convenient script `run-tests.sh` to run tests with various options.

### Basic Usage

```bash
# Run all tests
./run-tests.sh

# Run tests in watch mode
./run-tests.sh -w

# Run tests with UI
./run-tests.sh -u

# Run tests with coverage
./run-tests.sh -c
```

### Integration Test Options

```bash
# Run only integration tests
./run-tests.sh -i

# Skip integration tests
./run-tests.sh -s

# Run only integration tests with coverage
./run-tests.sh -i -c

# Run only integration tests in watch mode
./run-tests.sh -i -w
```

## Writing Tests

### Unit Tests

Unit tests should be placed in the same directory as the file they're testing, with a `.test.ts` extension:

```typescript
// Example: src/lib/example.test.ts
import { describe, it, expect, vi } from "vitest";
import { myFunction } from "./example";

describe("myFunction", () => {
  it("should return expected result", () => {
    expect(myFunction()).toBe("expected result");
  });
});
```

### Integration Tests

Integration tests should be placed in the same directory as the file they're testing, with a `.integration.test.ts` extension:

```typescript
// Example: src/lib/example.integration.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { myFunction } from "./example";
import { db } from "~/server/db";

describe("myFunction integration", () => {
  // Mark as integration test
  beforeAll(() => {
    // @ts-ignore - Adding custom metadata for test filtering
    describe.meta = { ...(describe.meta || {}), integration: true };
  });

  it("should interact with the database correctly", async () => {
    // Test with real database
    const result = await myFunction();
    expect(result).toBeDefined();
  });
});
```

## Best Practices

1. **Keep tests isolated**: Each test should be independent and not rely on the state from other tests.
2. **Clean up after tests**: Use `beforeEach` and `afterEach` to set up and clean up test data.
3. **Use descriptive test names**: Test names should describe what is being tested and the expected outcome.
4. **Test edge cases**: Include tests for error conditions and edge cases.
5. **Avoid testing implementation details**: Focus on testing behavior, not implementation details.
