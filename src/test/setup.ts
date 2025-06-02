import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

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

// Set up DOM environment for React testing
// This ensures that document and window are properly available
if (typeof window !== "undefined") {
  // Add any missing DOM APIs that tests might need
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    });
  }

  // Mock IntersectionObserver if not available
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
      get root() {
        return null;
      }
      get rootMargin() {
        return "0px";
      }
      get thresholds() {
        return [];
      }
      takeRecords() {
        return [];
      }
    } as any;
  }

  // Mock ResizeObserver if not available
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  }
}

// Clean up after each test
afterEach(() => {
  cleanup();
});
