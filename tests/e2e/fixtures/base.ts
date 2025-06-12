import { test as base } from "@playwright/test";
import type { GoToOptions } from "@playwright/test";
import { initializeOfflineMode, clearOfflineStorage, setupOfflineData } from "./offline-test-setup";

export interface TileCoordinates {
  userId: number;
  groupId: number;
  path: number[];
}

// Extended test with offline mode setup
export const test = base.extend({
  // Automatically set up offline mode for each test
  page: async ({ page }, use) => {
    // Initialize offline mode before test
    await initializeOfflineMode(page);
    
    // Override goto to add offline mode and setup data
    const originalGoto = page.goto.bind(page);
    let isFirstNavigation = true;
    let hasNavigated = false;
    
    page.goto = async (url: string, options?: GoToOptions) => {
      // Build the full URL
      let fullUrl: string;
      try {
        // If it's already a full URL, use it
        const urlObj = new URL(url);
        urlObj.searchParams.set('offline', 'true');
        fullUrl = urlObj.toString();
      } catch {
        // Otherwise, treat it as a path
        const baseUrl = 'http://localhost:3000';
        const urlObj = new URL(url, baseUrl);
        urlObj.searchParams.set('offline', 'true');
        fullUrl = urlObj.toString();
      }
      
      // For first navigation, we need to:
      // 1. Navigate to the app (to get localStorage access)
      // 2. Set up offline data
      // 3. Reload the page so the cache loads the data
      if (isFirstNavigation && !url.includes('about:blank')) {
        isFirstNavigation = false;
        // First navigate to the home page to get localStorage access
        await originalGoto('http://localhost:3000/?offline=true');
        // Set up offline data
        await setupOfflineData(page);
        // Now navigate to the actual URL which will use the offline data
        const result = await originalGoto(fullUrl, options);
        hasNavigated = true;
        return result;
      }
      
      const result = await originalGoto(fullUrl, options);
      hasNavigated = true;
      
      return result;
    };
    
    // Use the page in test
    await use(page);
    
    // Clean up after test (only if we navigated somewhere)
    if (hasNavigated) {
      await clearOfflineStorage(page);
    }
  },
});

export { expect } from "@playwright/test";