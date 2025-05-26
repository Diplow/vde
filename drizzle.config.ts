import { type Config } from "drizzle-kit";

import { env } from "~/env";
export default {
  schema: "./src/server/db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url:
      (process.env.NODE_ENV === "test" || process.env.VITEST
        ? env.TEST_DATABASE_URL
        : env.DATABASE_URL) ||
      "postgres://postgres:postgres@localhost:5432/test_db",
  },
  tablesFilter: ["vde*"],
  out: "./drizzle/migrations",
} satisfies Config;
