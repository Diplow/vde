import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "~/server/db/schema";
import { db } from "~/server/db";

export type DbConnection = PostgresJsDatabase<typeof schema>;

/**
 * Manages database transactions for mapping domain operations
 */
export class TransactionManager {
  /**
   * Execute a function within a database transaction
   * All database operations within the function will be atomic
   */
  static async runInTransaction<T>(
    fn: (tx: DbConnection) => Promise<T>
  ): Promise<T> {
    return await db.transaction(async (tx) => {
      return await fn(tx);
    });
  }

  /**
   * Get the appropriate database connection (transaction or main db)
   * This allows repository methods to work with or without transactions
   */
  static getConnection(tx?: DbConnection): DbConnection {
    return tx ?? db;
  }
}