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
      process.env.TEST_DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/test_db";
    console.log("🔍 USING TEST DATABASE:", testUrl);
    return testUrl;
  }

  // Use regular database URL for non-test environments
  return env.DATABASE_URL;
};

// Create a PostgreSQL client
const connectionString = getDatabaseUrl();
if (!connectionString) {
  throw new Error("Database connection string is not set");
}

// Configuration optimized for Neon in serverless environments
const isProduction = process.env.NODE_ENV === "production";
const client = postgres(connectionString, {
  // Neon-recommended settings for serverless
  max: isProduction ? 1 : 10, // Single connection in production
  idle_timeout: isProduction ? 20 : undefined, // Close idle connections quickly
  connect_timeout: 10, // Fast timeout for serverless
  
  // Disable prepared statements for serverless environments
  // This is recommended by Neon for better connection pooling
  prepare: !isProduction,
  
  // SSL is required for Neon in production
  ssl: isProduction ? 'require' : false,
});

// Create a Drizzle ORM instance with the schema
export const db = drizzle(client, { schema });

// Export the schema for type references
export { schema };
