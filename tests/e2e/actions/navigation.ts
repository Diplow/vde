import type { Page } from "@playwright/test";
import type { TileCoordinates } from "../fixtures/base";

export class NavigationActions {
  constructor(private page: Page) {}

  async navigateToMap(mapId: string | number, options?: { isDynamic?: boolean }) {
    // Navigate to map - offline mode is automatically handled by base fixture
    const url = `/map?center=${mapId}`;
    
    await this.page.goto(url);
    // In offline mode, use domcontentloaded instead of networkidle
    await this.page.waitForLoadState("domcontentloaded");
  }

  async navigateToTile(coordinates: TileCoordinates) {
    const pathParam = coordinates.path.join(",");
    const currentUrl = new URL(this.page.url());
    currentUrl.searchParams.set("path", pathParam);
    await this.page.goto(currentUrl.toString());
    await this.page.waitForLoadState("domcontentloaded");
  }

  async clickNavigationButton(coordinates: TileCoordinates | string) {
    // Click the navigation button to navigate to a tile
    const coordId = typeof coordinates === 'string' ? coordinates : 
      `${coordinates.userId},${coordinates.groupId}${coordinates.path.length > 0 ? ':' + coordinates.path.join(',') : ':'}`;
    const tile = this.page.locator(`[data-testid="tile-${coordId}"]`);
    
    // First hover over the tile to reveal the navigation button
    await tile.hover();
    await this.page.waitForTimeout(500); // Give more time for hover effect
    
    // Wait for the navigation button to be visible
    const navButton = this.page.locator(`[data-testid="navigate-button-${coordId}"]`);
    await navButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // Force click in case there are hover issues
    await navButton.click({ force: true });
    
    // Wait for navigation to complete
    await this.page.waitForTimeout(1000);
  }

  async clickHierarchyTile(level: number) {
    // Click on a tile in the hierarchy breadcrumb
    // Level 0 = root, 1 = parent, etc.
    const hierarchyTile = this.page
      .locator('[data-testid="hierarchy-tile"]')
      .nth(level);
    await hierarchyTile.click();
  }

  async getFocusedPath(): Promise<number[]> {
    const url = new URL(this.page.url());
    const pathParam = url.searchParams.get("path");
    if (!pathParam) return [];
    return pathParam.split(",").map(Number);
  }

  async getExpandedPaths(): Promise<number[][]> {
    const url = new URL(this.page.url());
    const expandedParam = url.searchParams.get("expanded");
    if (!expandedParam) return [];
    
    // Parse the expanded parameter format (e.g., "128,134,112")
    // This will need to be adjusted based on actual URL encoding
    // const expandedIds = expandedParam.split(",").map(Number);
    // TODO: Convert IDs back to paths based on actual implementation
    return [];
  }
}