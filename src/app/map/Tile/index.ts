// Base components
export { StaticBaseTileLayout } from "~/app/static/map/Tile/Base/base";
export type {
  StaticBaseTileLayoutProps,
  TileScale,
  TileColor,
  TileStroke,
  TileCursor,
} from "~/app/static/map/Tile/Base/base";
export { StaticTileContent } from "~/app/static/map/Tile/Item/content";
export type { StaticTileContentProps } from "~/app/static/map/Tile/Item/content";

// Item components
export { StaticItemTile } from "~/app/static/map/Tile/Item/item";
export type { StaticItemTileProps } from "~/app/static/map/Tile/Item/item";
export { DynamicItemTile } from "./Item/item";
export type { DynamicItemTileProps } from "./Item/item";
export { DynamicTileButtons as TileButtons } from "./Item/item.buttons";
export type { TileButtonsProps } from "~/app/static/map/Tile/Item/item.buttons";
export { HierarchyTile } from "~/app/static/map/Tile/Hierarchy/hierarchy-tile";
export type { HierarchyTileProps } from "~/app/static/map/Tile/Hierarchy/hierarchy-tile";

// Auth components
export { AuthTile } from "~/app/static/map/Tile/Auth/auth";
export type { AuthTileProps } from "~/app/static/map/Tile/Auth/auth";
export { default as DynamicAuthTile } from "./Auth/auth";
export type { AuthTileProps as DynamicAuthTileProps } from "./Auth/auth";
