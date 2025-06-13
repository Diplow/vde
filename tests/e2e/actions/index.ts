import type { Page } from "@playwright/test";
import { NavigationActions } from "./navigation";
import { TileInteractions } from "./tile-interactions";
import { MapAssertions } from "./assertions";

export class MapActions {
  readonly navigation: NavigationActions;
  readonly tiles: TileInteractions;
  readonly assertions: MapAssertions;

  constructor(page: Page) {
    this.navigation = new NavigationActions(page);
    this.tiles = new TileInteractions(page);
    this.assertions = new MapAssertions(page);
  }
}

// Export individual action classes for direct use if needed
export { NavigationActions, TileInteractions, MapAssertions };
export type { TileCoordinates } from "../fixtures/base";