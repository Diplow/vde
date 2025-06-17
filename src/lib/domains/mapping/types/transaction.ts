import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "~/server/db/schema";

/**
 * Transaction type for database operations
 * This allows repository methods to participate in transactions
 */
export type DatabaseTransaction = PostgresJsDatabase<typeof schema>;

/**
 * Options that can be passed to repository methods
 * Includes optional transaction for atomic operations
 */
export interface RepositoryOptions {
  tx?: DatabaseTransaction;
}