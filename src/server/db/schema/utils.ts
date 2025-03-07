import { pgTableCreator, pgEnum } from "drizzle-orm/pg-core";

/**
 * This creates a table with a prefix to avoid naming conflicts in the database
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `deliberategg_${name}`);

/**
 * Common enums used across multiple tables
 */
export const mapOwnersEnum = pgEnum("map_owner", ["user"]);
