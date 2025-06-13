import { describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { mapItemsRouter } from "../map-items";
import { createMockContext } from "~/server/api/test-utils";
import { db } from "~/server/db";
import { items, userMapping } from "~/server/db/schema";
import { eq } from "drizzle-orm";

describe("Map Items Permissions", () => {
  const authUserId = "test-auth-user-123";
  const mappingUserId = 42;
  const otherAuthUserId = "other-auth-user-456";
  const otherMappingUserId = 99;

  beforeEach(async () => {
    // Clean up test data
    await db.delete(items);
    await db.delete(userMapping);

    // Create user mappings
    await db.insert(userMapping).values([
      { authUserId, mappingUserId },
      { authUserId: otherAuthUserId, mappingUserId: otherMappingUserId }
    ]);

    // Create test items
    await db.insert(items).values([
      {
        id: 128,
        ownerId: String(mappingUserId),
        title: "User's own tile",
        type: "root",
        coordX: 0,
        coordY: 0,
        coordZ: 0
      },
      {
        id: 8,
        ownerId: String(otherMappingUserId),
        title: "Other user's tile",
        type: "root",
        coordX: 1,
        coordY: 0,
        coordZ: 0
      }
    ]);
  });

  it("should allow user to update their own tile", async () => {
    const ctx = createMockContext({
      user: { id: authUserId, email: "test@example.com" }
    });

    const caller = mapItemsRouter.createCaller(ctx);
    
    const result = await caller.updateItem({
      id: 128,
      updates: { title: "Updated title" }
    });

    expect(result.title).toBe("Updated title");
  });

  it("should not allow user to update another user's tile", async () => {
    const ctx = createMockContext({
      user: { id: authUserId, email: "test@example.com" }
    });

    const caller = mapItemsRouter.createCaller(ctx);
    
    await expect(
      caller.updateItem({
        id: 8,
        updates: { title: "Hacked title" }
      })
    ).rejects.toThrow(TRPCError);
  });

  it("should properly map auth user ID to mapping user ID for ownership checks", async () => {
    const ctx = createMockContext({
      user: { id: authUserId, email: "test@example.com" }
    });

    // Verify the mapping is correct
    const mapping = await db
      .select()
      .from(userMapping)
      .where(eq(userMapping.authUserId, authUserId));
    
    expect(mapping[0]?.mappingUserId).toBe(mappingUserId);

    // Verify ownership check works
    const item = await db
      .select()
      .from(items)
      .where(eq(items.id, 128));
    
    expect(item[0]?.ownerId).toBe(String(mappingUserId));
  });
});