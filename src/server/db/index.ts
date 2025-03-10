import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env";
import * as schema from "./schema";

// Function to get database connection string based on environment
const getDatabaseUrl = () => {
  // Check if we're in a test environment
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    // Use test database URL
    const testUrl =
      process.env.TEST_DATABASE_URL ||
      "postgres://postgres:postgres@localhost:5432/test_db";
    console.log("🔍 USING TEST DATABASE:", testUrl);
    return testUrl;
  }

  // Use regular database URL for non-test environments
  // console.log("🔍 USING PRODUCTION DATABASE");
  return env.DATABASE_URL;
};

// Create a PostgreSQL client
const connectionString = getDatabaseUrl();
if (!connectionString) {
  throw new Error("Database connection string is not set");
}
const client = postgres(connectionString);

// Create a Drizzle ORM instance with the schema
export const db = drizzle(client, { schema });

// Export the schema for type references
export { schema };
