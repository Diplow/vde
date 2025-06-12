// Use test database URL if available
if (process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

import { db } from "~/server/db";
import { users, userMapping, mapItems, baseItems } from "~/server/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { MappingService } from "~/lib/domains/mapping/services";
import { DbMapItemRepository } from "~/lib/domains/mapping/infrastructure/map-item/db";
import { DbBaseItemRepository } from "~/lib/domains/mapping/infrastructure/base-item/db";
import type { MapItemContract } from "~/lib/domains/mapping/types/contracts";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

// Test user constants
export const TEST_USER_ID = 999999; // High ID to avoid conflicts
export const TEST_AUTH_USER_ID = "test-user-e2e";
export const TEST_USER_EMAIL = "e2e-test@hexframe.test";
export const TEST_USER_NAME = "E2E Test User";

// Path to store test data
const TEST_DATA_FILE = join(
  process.cwd(),
  "tests/e2e/fixtures/.test-data.json",
);

// Helper to get the test root map ID
export function getTestRootMapId(): number {
  try {
    const data = JSON.parse(readFileSync(TEST_DATA_FILE, "utf-8"));
    return data.rootMapId;
  } catch (error) {
    throw new Error("Test data not found. Did you run pnpm test:e2e:setup?");
  }
}

// Test map structure
export const TEST_MAP_ITEMS = {
  root: { userId: TEST_USER_ID, groupId: 0, path: [] },
  // First level children
  child1: { userId: TEST_USER_ID, groupId: 0, path: [1] },
  child2: { userId: TEST_USER_ID, groupId: 0, path: [2] },
  child3: { userId: TEST_USER_ID, groupId: 0, path: [3] },
  child4: { userId: TEST_USER_ID, groupId: 0, path: [4] },
  child5: { userId: TEST_USER_ID, groupId: 0, path: [5] },
  child6: { userId: TEST_USER_ID, groupId: 0, path: [6] },
  // Second level children (under child1)
  grandchild1_1: { userId: TEST_USER_ID, groupId: 0, path: [1, 1] },
  grandchild1_2: { userId: TEST_USER_ID, groupId: 0, path: [1, 2] },
  grandchild1_3: { userId: TEST_USER_ID, groupId: 0, path: [1, 3] },
  // Third level children (under grandchild1_1)
  greatGrandchild1_1_1: { userId: TEST_USER_ID, groupId: 0, path: [1, 1, 1] },
  greatGrandchild1_1_2: { userId: TEST_USER_ID, groupId: 0, path: [1, 1, 2] },
};

export async function seedE2ETestData() {
  console.log("🔍 USING TEST DATABASE:", process.env.DATABASE_URL);
  console.log("🌱 Seeding E2E test data...");

  try {
    // Clean up existing test data
    await cleanupTestData();

    // Create test user in auth system
    await db.insert(users).values({
      id: TEST_AUTH_USER_ID,
      email: TEST_USER_EMAIL,
      name: TEST_USER_NAME,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log("✅ Created test auth user");

    // Create user mapping
    await db.insert(userMapping).values({
      authUserId: TEST_AUTH_USER_ID,
      mappingUserId: TEST_USER_ID,
    });
    console.log("✅ Created user mapping");

    // Initialize services
    const mapItemRepo = new DbMapItemRepository(db);
    const baseItemRepo = new DbBaseItemRepository(db);
    const mappingService = new MappingService({
      mapItem: mapItemRepo,
      baseItem: baseItemRepo,
    });

    // Create root/user map item
    const rootMap = await mappingService.maps.createMap({
      userId: TEST_USER_ID,
      groupId: 0,
      title: TEST_USER_NAME,
      descr: "Root tile for E2E testing",
    });
    console.log("✅ Created root map item");

    // Create first level children
    const childTitles = [
      "Navigation Test 1",
      "Navigation Test 2",
      "Navigation Test 3",
      "Empty Tile 4",
      "Empty Tile 5",
      "Empty Tile 6",
    ];

    const createdChildren: Record<string, MapItemContract> = {};
    for (let i = 1; i <= 6; i++) {
      const child = await mappingService.items.crud.addItemToMap({
        parentId: rootMap.id,
        coords: TEST_MAP_ITEMS[`child${i}` as keyof typeof TEST_MAP_ITEMS],
        title: childTitles[i - 1],
        descr: `Test child tile at position ${i}`,
      });
      createdChildren[`child${i}`] = child;
    }
    console.log("✅ Created first level children");

    // Create second level children under child1
    const grandchildTitles = [
      "Grandchild 1-1",
      "Grandchild 1-2",
      "Grandchild 1-3",
    ];

    const createdGrandchildren: Record<string, MapItemContract> = {};
    for (let i = 1; i <= 3; i++) {
      const grandchild = await mappingService.items.crud.addItemToMap({
        parentId: Number(createdChildren.child1?.id),
        coords:
          TEST_MAP_ITEMS[`grandchild1_${i}` as keyof typeof TEST_MAP_ITEMS],
        title: grandchildTitles[i - 1],
        descr: `Second level test tile`,
      });
      createdGrandchildren[`grandchild1_${i}`] = grandchild;
    }
    console.log("✅ Created second level children");

    // Create third level children under grandchild1_1
    const greatGrandchildTitles = [
      "Great-Grandchild 1-1-1",
      "Great-Grandchild 1-1-2",
    ];

    for (let i = 1; i <= 2; i++) {
      await mappingService.items.crud.addItemToMap({
        parentId: Number(createdGrandchildren.grandchild1_1?.id),
        coords:
          TEST_MAP_ITEMS[
            `greatGrandchild1_1_${i}` as keyof typeof TEST_MAP_ITEMS
          ],
        title: greatGrandchildTitles[i - 1],
        descr: `Third level test tile`,
      });
    }
    console.log("✅ Created third level children");

    console.log("🎉 E2E test data seeded successfully!");
    console.log(`📍 Root map ID: ${rootMap.id}`);
    console.log(`📍 Test map URL: /map/${rootMap.id}`);

    // Save test data for tests to use
    const testData = {
      rootMapId: Number(rootMap.id),
      userId: TEST_USER_ID,
      authUserId: TEST_AUTH_USER_ID,
    };
    writeFileSync(TEST_DATA_FILE, JSON.stringify(testData, null, 2));
    console.log(`💾 Test data saved to ${TEST_DATA_FILE}`);

    // Return the actual root map ID that should be used in URLs
    return Number(rootMap.id);
  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    throw error;
  }
}

export async function cleanupTestData() {
  console.log("🧹 Cleaning up existing test data...");

  try {
    // Delete in correct order to respect foreign key constraints
    console.log("  - Getting map items to delete...");
    const itemsToDelete = await db
      .select({ refItemId: mapItems.refItemId })
      .from(mapItems)
      .where(eq(mapItems.coord_user_id, TEST_USER_ID));

    console.log("  - Deleting map items...");
    await db.delete(mapItems).where(eq(mapItems.coord_user_id, TEST_USER_ID));

    if (itemsToDelete.length > 0) {
      console.log("  - Deleting base items...");
      const refItemIds = itemsToDelete.map((item) => item.refItemId);
      await db.delete(baseItems).where(inArray(baseItems.id, refItemIds));
    }

    console.log("  - Deleting user mapping...");
    await db
      .delete(userMapping)
      .where(eq(userMapping.authUserId, TEST_AUTH_USER_ID));

    console.log("  - Deleting user...");
    await db.delete(users).where(eq(users.id, TEST_AUTH_USER_ID));

    console.log("✅ Test data cleaned up");
  } catch (error) {
    console.error("Error during cleanup:", error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedE2ETestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
