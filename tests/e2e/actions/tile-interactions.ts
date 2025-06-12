import type { Page } from "@playwright/test";
import type { TileCoordinates } from "../fixtures/base";

export class TileInteractions {
  constructor(private page: Page) {}

  private getTileSelector(coordinates: TileCoordinates | string): string {
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
    return `[data-testid="tile-${testId}"]`;
  }

  private getButtonTestId(coordinates: TileCoordinates | string): string {
    // Convert to hyphen-separated format for button data-testid
    if (typeof coordinates === 'string') {
      // Convert coordId format (999999,0:1,2) to hyphen format (999999-0-1-2)
      const parts = coordinates.replace(':', '-').replace(/,/g, '-').split('-');
      return parts.filter(p => p !== '').join('-');
    } else {
      // Build from TileCoordinates
      const pathPart = coordinates.path.length > 0 ? `-${coordinates.path.join('-')}` : '';
      return `${coordinates.userId}-${coordinates.groupId}${pathPart}`;
    }
  }

  async expandTile(coordinates: TileCoordinates | string) {
    const tileSelector = this.getTileSelector(coordinates);
    const tile = this.page.locator(tileSelector);
    
    // Wait for tile to be visible first
    await tile.waitFor({ state: "visible", timeout: 5000 });
    
    // Hover over the tile to reveal the expand button
    await tile.hover();
    await this.page.waitForTimeout(200); // Give time for hover effect
    
    // Get the button test ID
    const buttonTestId = this.getButtonTestId(coordinates);
    const expandButton = this.page.locator(`[data-testid="expand-button-${buttonTestId}"]`);
    await expandButton.click();
    
    // Wait for expansion animation/transition
    await this.page.waitForTimeout(500);
  }

  async collapseFrame(coordinates: TileCoordinates | string) {
    // Get the button test ID
    const buttonTestId = this.getButtonTestId(coordinates);
    
    // Click the collapse button
    const collapseButton = this.page.locator(`[data-testid="collapse-button-${buttonTestId}"]`);
    await collapseButton.click();
    
    // Wait for collapse animation/transition
    await this.page.waitForTimeout(300);
  }

  async clickTile(coordinates: TileCoordinates | string) {
    // First hover over the tile to reveal buttons
    const tileSelector = this.getTileSelector(coordinates);
    const tile = this.page.locator(tileSelector);
    await tile.hover();
    await this.page.waitForTimeout(200); // Give time for hover effect
    
    // Click the navigation button, not the tile itself
    const buttonTestId = this.getButtonTestId(coordinates);
    const navigateButton = this.page.locator(`[data-testid="navigate-button-${buttonTestId}"]`);
    await navigateButton.click();
    
    // Wait for navigation to complete
    await this.page.waitForTimeout(300);
  }

  async getTileText(coordinates: TileCoordinates | string): Promise<string> {
    const buttonTestId = this.getButtonTestId(coordinates);
    const titleElement = this.page.locator(`[data-testid="tile-title-${buttonTestId}"]`);
    return await titleElement.textContent() ?? "";
  }

  async isTileVisible(coordinates: TileCoordinates | string): Promise<boolean> {
    const tileSelector = this.getTileSelector(coordinates);
    const tile = this.page.locator(tileSelector);
    return await tile.isVisible();
  }

  async isFrameExpanded(coordinates: TileCoordinates | string): Promise<boolean> {
    const buttonTestId = this.getButtonTestId(coordinates);
    const frameSelector = `[data-testid="frame-${buttonTestId}"]`;
    const frame = this.page.locator(frameSelector);
    return await frame.isVisible();
  }

  async waitForTile(coordinates: TileCoordinates | string) {
    const tileSelector = this.getTileSelector(coordinates);
    await this.page.locator(tileSelector).waitFor({ state: "visible" });
  }
}