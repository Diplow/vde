import type { Meta, StoryObj } from "@storybook/react";
import { StaticHexRegion } from "./hex-region.static";
import type { HexTileData } from "../State/types";
import { HexCoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import "src/styles/globals.css";

// Helper function to generate placeholder text (can be moved to a shared util if used elsewhere)
const generateLoremIpsum = (length: number): string => {
  const baseText =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas consequat purus porta risus venenatis, in iaculis felis rutrum. Aliquam quis varius urna, in sodales sapien. ";
  let result = "";
  while (result.length < length) {
    result += baseText;
  }
  return result.substring(0, length);
};

const createMockItem = (
  coordId: string,
  name: string,
  color: string,
  depth = 0,
  parentId?: string,
): HexTileData => ({
  metadata: {
    dbId: `db-item-${coordId.replace(",", "-")}`,
    coordId,
    parentId,
    coordinates: HexCoordSystem.parseId(coordId),
    depth,
  },
  data: {
    name,
    description: generateLoremIpsum(200),
    url: `https://example.com/${name.toLowerCase().replace(/\s+/g, "-")}`,
    color,
  },
  state: {
    isDragged: false,
    isHovered: false,
    isSelected: false,
    isExpanded: false,
    isDragOver: false,
    isHovering: false,
  },
});

// --- Mock Data ---
const centerCoord = "0,0";
const nwCoord = HexCoordSystem.getChildCoordsFromId(centerCoord)[0]; // "0,0:NW"
const neCoord = HexCoordSystem.getChildCoordsFromId(centerCoord)[1]; // "0,0:NE"
const eCoord = HexCoordSystem.getChildCoordsFromId(centerCoord)[2]; // "0,0:E"

const nw_nwCoord = HexCoordSystem.getChildCoordsFromId(nwCoord)[0]; // "0,0:NW,NW"

const mockMapItemsSimple: Record<string, HexTileData> = {
  [centerCoord]: createMockItem(centerCoord, "Center Item", "amber-500", 0),
};

const mockMapItemsOneLevel: Record<string, HexTileData> = {
  [centerCoord]: createMockItem(centerCoord, "Center", "cyan-500", 0),
  [nwCoord]: createMockItem(
    nwCoord,
    "North West Child",
    "emerald-500",
    1,
    centerCoord,
  ),
  [neCoord]: createMockItem(
    neCoord,
    "North East Child",
    "rose-500",
    1,
    centerCoord,
  ),
  [eCoord]: createMockItem(eCoord, "East Child", "fuchsia-500", 1, centerCoord),
  // SE, SW, W are missing to test partial children
};

const mockMapItemsTwoLevels: Record<string, HexTileData> = {
  ...mockMapItemsOneLevel,
  [nw_nwCoord]: createMockItem(
    nw_nwCoord,
    "NW's NW Child",
    "rose-500",
    2,
    nwCoord,
  ),
  [HexCoordSystem.getChildCoordsFromId(nwCoord)[1]]: createMockItem(
    HexCoordSystem.getChildCoordsFromId(nwCoord)[1],
    "NW's NE Child",
    "amber-500",
    2,
    nwCoord,
  ),
};

// --- Storybook Meta ---
const meta: Meta<typeof StaticHexRegion> = {
  title: "Map/Canvas/StaticHexRegion",
  component: StaticHexRegion,
  parameters: {
    layout: "centered", // Or 'fullscreen' if it makes more sense
  },
  tags: ["autodocs"],
  argTypes: {
    center: { control: "text" },
    mapItems: { control: "object" },
    baseHexSize: { control: { type: "number", min: 20, max: 100, step: 5 } },
    expandedItemIds: { control: "object" }, // Array of strings
  },
};

export default meta;
type Story = StoryObj<typeof StaticHexRegion>;

// --- Stories ---

export const SingleTileNoExpansion: Story = {
  args: {
    center: centerCoord,
    mapItems: mockMapItemsSimple,
    baseHexSize: 50,
    expandedItemIds: [],
  },
};

export const CenterTileMissing: Story = {
  args: {
    center: "10,10", // A coordinate not in mapItems
    mapItems: mockMapItemsSimple,
    baseHexSize: 50,
    expandedItemIds: [],
  },
};

export const OneLevelExpanded: Story = {
  args: {
    center: centerCoord,
    mapItems: mockMapItemsOneLevel,
    baseHexSize: 50,
    expandedItemIds: [centerCoord],
  },
};

export const OneLevelExpandedWithMissingChildren: Story = {
  args: {
    center: centerCoord,
    mapItems: {
      // Only center and one child
      [centerCoord]: createMockItem(centerCoord, "Center", "cyan-500", 0),
      [nwCoord]: createMockItem(
        nwCoord,
        "North West Child",
        "emerald-500",
        1,
        centerCoord,
      ),
    },
    baseHexSize: 50,
    expandedItemIds: [centerCoord],
  },
};

export const TwoLevelsExpanded: Story = {
  args: {
    center: centerCoord,
    mapItems: mockMapItemsTwoLevels,
    baseHexSize: 50,
    expandedItemIds: [centerCoord, nwCoord], // Expand center and its NW child
  },
};

export const DifferentBaseSize: Story = {
  args: {
    center: centerCoord,
    mapItems: mockMapItemsOneLevel,
    baseHexSize: 50,
    expandedItemIds: [centerCoord],
  },
};

export const NoItemsAtAll: Story = {
  args: {
    center: centerCoord,
    mapItems: {},
    baseHexSize: 50,
    expandedItemIds: [],
  },
};
