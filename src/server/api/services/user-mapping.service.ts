import { eq, max } from "drizzle-orm";
import { db } from "~/server/db";
import { userMapping } from "~/server/db/schema";

export class UserMappingService {
  /**
   * Gets or creates a mapping user ID for an auth user ID
   */
  static async getOrCreateMappingUserId(authUserId: string): Promise<number> {
    // First, try to find existing mapping
    const existingMapping = await db
      .select()
      .from(userMapping)
      .where(eq(userMapping.authUserId, authUserId))
      .limit(1);

    if (existingMapping.length > 0) {
      return existingMapping[0]!.mappingUserId;
    }

    // If no mapping exists, create a new one
    // Use a transaction to avoid race conditions
    return await db.transaction(async (tx) => {
      // Double-check if mapping was created by another request
      const recheck = await tx
        .select()
        .from(userMapping)
        .where(eq(userMapping.authUserId, authUserId))
        .limit(1);

      if (recheck.length > 0) {
        return recheck[0]!.mappingUserId;
      }

      // Get the next available mapping user ID
      const maxResult = await tx
        .select({ maxId: max(userMapping.mappingUserId) })
        .from(userMapping);

      const nextMappingUserId = (maxResult[0]?.maxId ?? 0) + 1;

      // Create the mapping
      const newMapping = await tx
        .insert(userMapping)
        .values({
          authUserId,
          mappingUserId: nextMappingUserId,
        })
        .returning();

      return newMapping[0]!.mappingUserId;
    });
  }

  /**
   * Gets the mapping user ID for an auth user ID (if it exists)
   */
  static async getMappingUserId(authUserId: string): Promise<number | null> {
    const mapping = await db
      .select()
      .from(userMapping)
      .where(eq(userMapping.authUserId, authUserId))
      .limit(1);

    return mapping[0]?.mappingUserId ?? null;
  }

  /**
   * Gets the auth user ID for a mapping user ID (if it exists)
   */
  static async getAuthUserId(mappingUserId: number): Promise<string | null> {
    const mapping = await db
      .select()
      .from(userMapping)
      .where(eq(userMapping.mappingUserId, mappingUserId))
      .limit(1);

    return mapping[0]?.authUserId ?? null;
  }
}
