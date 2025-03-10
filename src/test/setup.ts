import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Set up environment variables for tests
// Use process.env.VITEST to detect if we're running in Vitest
if (process.env.VITEST) {
  // Set test database URL if not already set
  process.env.TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/test_db";

  // Log database connection for debugging
  console.log(`Using test database: ${process.env.TEST_DATABASE_URL}`);
}

// Clean up after each test
afterEach(() => {
  cleanup();
});
