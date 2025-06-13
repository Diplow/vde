import type { Page } from "@playwright/test";
import { STORAGE_KEYS } from "~/app/map/Cache/Services/storage-service";
import type { TileData } from "~/app/map/types/tile-data";
import { TEST_USER_ID, getTestRootMapId } from "./seed-test-data";

// Get the actual root map ID from the test data file dynamically
function getRootMapIdDynamic(): number {
  try {
    // Try to read from the file system (won't work in browser context)
    return getTestRootMapId();
  } catch (error) {
    // This will run in the browser context during tests
    // The test will need to pass the correct ID
    return 1072; // Updated fallback
  }
}

// Define test items with proper structure for offline testing
// This function will be called with the actual root map ID
function getTestItems(rootMapId: number) {
  return [
  { 
    id: rootMapId, // Use the actual root map ID
    coordId: `${TEST_USER_ID},0:`, 
    name: "E2E Test User", 
    description: "Root tile for E2E testing",
    path: []
  },
  { 
    id: rootMapId + 1, 
    coordId: `${TEST_USER_ID},0:1`, 
    name: "Navigation Test 1", 
    description: "Test child tile at position 1",
    path: [1]
  },
  { 
    id: rootMapId + 2, 
    coordId: `${TEST_USER_ID},0:2`, 
    name: "Navigation Test 2", 
    description: "Test child tile at position 2",
    path: [2]
  },
  { 
    id: rootMapId + 3, 
    coordId: `${TEST_USER_ID},0:3`, 
    name: "Navigation Test 3", 
    description: "Test child tile at position 3",
    path: [3]
  },
  { 
    id: rootMapId + 4, 
    coordId: `${TEST_USER_ID},0:4`, 
    name: "Empty Tile 4", 
    description: "Test child tile at position 4",
    path: [4]
  },
  { 
    id: rootMapId + 5, 
    coordId: `${TEST_USER_ID},0:5`, 
    name: "Empty Tile 5", 
    description: "Test child tile at position 5",
    path: [5]
  },
  { 
    id: rootMapId + 6, 
    coordId: `${TEST_USER_ID},0:6`, 
    name: "Empty Tile 6", 
    description: "Test child tile at position 6",
    path: [6]
  },
  // Grandchildren under child1
  { 
    id: rootMapId + 7, 
    coordId: `${TEST_USER_ID},0:1,1`, 
    name: "Grandchild 1-1", 
    description: "Second level test tile",
    path: [1, 1]
  },
  { 
    id: rootMapId + 8, 
    coordId: `${TEST_USER_ID},0:1,2`, 
    name: "Grandchild 1-2", 
    description: "Second level test tile",
    path: [1, 2]
  },
  { 
    id: rootMapId + 9, 
    coordId: `${TEST_USER_ID},0:1,3`, 
    name: "Grandchild 1-3", 
    description: "Second level test tile",
    path: [1, 3]
  },
  // Great grandchildren under grandchild1_1
  { 
    id: rootMapId + 10, 
    coordId: `${TEST_USER_ID},0:1,1,1`, 
    name: "Great-Grandchild 1-1-1", 
    description: "Third level test tile",
    path: [1, 1, 1]
  },
  { 
    id: rootMapId + 11, 
    coordId: `${TEST_USER_ID},0:1,1,2`, 
    name: "Great-Grandchild 1-1-2", 
    description: "Third level test tile",
    path: [1, 1, 2]
  },
];
}

/**
 * Helper to populate localStorage with test data for offline mode testing
 */
export async function populateOfflineStorage(page: Page) {
  // Get the root map ID
  const rootMapId = getRootMapIdDynamic();
  const testItems = getTestItems(rootMapId);
  
  // Convert test items to cache format
  const cacheData = {
    items: testItems.reduce((acc, item) => {
      const tileData: TileData = {
        metadata: {
          dbId: String(item.id),
          coordId: item.coordId,
          parentId: item.path.length > 0 ? 
            `${TEST_USER_ID},0:${item.path.slice(0, -1).join(",")}` : 
            undefined,
          coordinates: {
            userId: TEST_USER_ID,
            groupId: 0,
            path: item.path,
          },
          depth: item.path.length,
          ownerId: String(TEST_USER_ID),
        },
        data: {
          name: item.name,
          description: item.description,
          url: "",
          color: "zinc-50",
        },
        state: {
          isDragged: false,
          isHovered: false,
          isSelected: false,
          isExpanded: false,
          isDragOver: false,
          isHovering: false,
        },
      };
      acc[item.coordId] = tileData;
      return acc;
    }, {} as Record<string, TileData>),
    center: `${TEST_USER_ID},0:`,
    maxDepth: 3,
    timestamp: Date.now(),
  };

  // Set localStorage data
  await page.evaluate(({ storageKeys, testData }) => {
    // Save cache data
    window.localStorage.setItem(
      storageKeys.CACHE_DATA,
      JSON.stringify({
        data: testData,
        metadata: { version: 1, timestamp: Date.now() }
      })
    );

    // Save empty expanded items
    window.localStorage.setItem(
      storageKeys.EXPANDED_ITEMS,
      JSON.stringify({
        data: [],
        metadata: { version: 1, timestamp: Date.now() }
      })
    );

    // Save test user preferences
    window.localStorage.setItem(
      storageKeys.USER_PREFERENCES,
      JSON.stringify({
        data: { theme: "light", autoExpand: false },
        metadata: { version: 1, timestamp: Date.now() }
      })
    );
  }, { storageKeys: STORAGE_KEYS, testData: cacheData });

  console.log("[OfflineTest] Populated localStorage with test data");
}

/**
 * Helper to clear all cache-related localStorage data
 */
export async function clearOfflineStorage(page: Page) {
  try {
    await page.evaluate((storageKeys) => {
      Object.values(storageKeys).forEach(key => {
        window.localStorage.removeItem(key);
      });
    }, STORAGE_KEYS);

    console.log("[OfflineTest] Cleared localStorage");
  } catch (error) {
    // Ignore errors if we can't access localStorage (e.g., no page loaded)
    console.log("[OfflineTest] Could not clear localStorage:", error);
  }
}

/**
 * Helper to set offline auth context
 */
export async function setupOfflineAuth(page: Page, userId: number = TEST_USER_ID) {
  await page.evaluate((userId) => {
    // Store auth data in localStorage
    window.localStorage.setItem("offline_auth", JSON.stringify({
      user: {
        id: String(userId),
        email: `user${userId}@example.com`,
        name: `Test User ${userId}`,
      },
      session: {
        userId: String(userId),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }
    }));
  }, userId);

  console.log("[OfflineTest] Set up offline auth for user", userId);
}

/**
 * Helper to initialize app in offline mode
 */
export async function initializeOfflineMode(page: Page) {
  // Don't set browser offline mode - we'll use URL param and localStorage instead
  console.log("[OfflineTest] Initialized offline mode setup");
}

/**
 * Helper to populate offline data after navigation
 */
export async function setupOfflineData(page: Page) {
  // Populate test data
  await populateOfflineStorage(page);
  await setupOfflineAuth(page);
  
  // Set offline mode flag in localStorage
  await page.evaluate(() => {
    window.localStorage.setItem("offline_mode", "true");
  });
  
  console.log("[OfflineTest] Set up offline data in localStorage");
}
