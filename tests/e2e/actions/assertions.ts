import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { TileCoordinates } from "../fixtures/base";

export class MapAssertions {
  constructor(private page: Page) {}

  async assertFocusedTile(expectedPath: number[]) {
    const url = new URL(this.page.url());
    const pathParam = url.searchParams.get("path") ?? "";
    const actualPath = pathParam ? pathParam.split(",").map(Number) : [];
    expect(actualPath).toEqual(expectedPath);
  }

  async assertExpandedTiles(expectedPaths: number[][]) {
    const url = new URL(this.page.url());
    const expandedParam = url.searchParams.get("expanded") ?? "";
    
    // TODO: Implement proper parsing based on actual URL encoding
    // For now, just check if expanded parameter exists
    if (expectedPaths.length > 0) {
      expect(expandedParam).not.toBe("");
    } else {
      expect(expandedParam).toBe("");
    }
  }

  async assertTileVisible(coordinates: TileCoordinates | string) {
    // Convert to hyphen-separated format for data-testid
    let testId: string;
    if (typeof coordinates === 'string') {
      // Convert coordId format (999999,0:1,2) to hyphen format (999999-0-1-2)
      const parts = coordinates.replace(':', '-').replace(/,/g, '-').split('-');
      testId = parts.filter(p => p !== '').join('-');
    } else {
      // Build from TileCoordinates
      const pathPart = coordinates.path.length > 0 ? `-${coordinates.path.join('-')}` : '';
      testId = `${coordinates.userId}-${coordinates.groupId}${pathPart}`;
    }
    const tileSelector = `[data-testid="tile-${testId}"]`;
    await expect(this.page.locator(tileSelector)).toBeVisible({ timeout: 10000 });
  }

  async assertTileContent(coordinates: TileCoordinates | string, expectedText: string) {
    // Convert to hyphen-separated format for data-testid
    let testId: string;
    if (typeof coordinates === 'string') {
      // Convert coordId format (999999,0:1,2) to hyphen format (999999-0-1-2)
      const parts = coordinates.replace(':', '-').replace(/,/g, '-').split('-');
      testId = parts.filter(p => p !== '').join('-');
    } else {
      // Build from TileCoordinates
      const pathPart = coordinates.path.length > 0 ? `-${coordinates.path.join('-')}` : '';
      testId = `${coordinates.userId}-${coordinates.groupId}${pathPart}`;
    }
    // Look for the text content within the tile
    const tile = this.page.locator(`[data-testid="tile-${testId}"]`);
    await expect(tile).toContainText(expectedText);
  }

  async assertHierarchyPath(expectedTitles: string[]) {
    const hierarchyTiles = this.page.locator('[data-testid="hierarchy-tile"]');
    const count = await hierarchyTiles.count();
    expect(count).toBe(expectedTitles.length);
    
    for (let i = 0; i < expectedTitles.length; i++) {
      await expect(hierarchyTiles.nth(i)).toHaveText(expectedTitles[i]);
    }
  }

  async assertUrlPath(expectedPath: string) {
    await expect(this.page).toHaveURL(new RegExp(`path=${expectedPath}`));
  }

  async assertPageTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(expectedTitle);
  }
}