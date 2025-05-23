import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@storybook/experimental-nextjs-vite",
      "@mdx-js/react",
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    environmentMatchGlobs: [
      // Run integration tests with node environment
      ["**/*.integration.test.ts", "node"],
    ],
    env: {
      // Load .env.test file for tests
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "./src"),
    },
  },
});
