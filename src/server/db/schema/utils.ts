import { pgTableCreator } from "drizzle-orm/pg-core";

/**
 * This creates a table with a prefix to avoid naming conflicts in the database
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `deliberategg_${name}`);
