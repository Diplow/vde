import type { Meta, StoryObj } from "@storybook/react";
import { StaticItemTile } from "./item.static";
import type { HexTileData } from "../State/types"; // Assuming this path is correct
import {
  HexCoordSystem,
  type HexCoord,
} from "~/lib/domains/mapping/utils/hex-coordinates";
import "src/styles/globals.css";

// Helper function to generate placeholder text
const generateLoremIpsum = (length: number): string => {
  const baseText =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas consequat purus porta risus venenatis, in iaculis felis rutrum. Aliquam quis varius urna, in sodales sapien. ";
  let result = "";
  while (result.length < length) {
    result += baseText;
  }
  return result.substring(0, length);
};

// Mock HexTileData - Adjusted to match the actual type definition
const mockItem1: HexTileData = {
  metadata: {
    dbId: "db-item-1",
    coordId: "1,1",
    parentId: "0,0", // Example parent
    coordinates: HexCoordSystem.parseId("1,1"),
    depth: 1,
  },
  data: {
    name: "Item Tile 1",
    description: "Description for item 1.",
    url: "https://example.com/item1",
    color: "amber-500", // Example color string
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

const mockItem2: HexTileData = {
  metadata: {
    dbId: "db-item-2",
    coordId: "2,2",
    parentId: "0,0", // Example parent
    coordinates: HexCoordSystem.parseId("2,2"),
    depth: 1,
  },
  data: {
    name: "Rester sur X pour débattre avec tout le monde ? Le Libre marché des idées",
    description: generateLoremIpsum(1500),
    url: "https://example.com/item2-details",
    color: "emerald-400",
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

// Added mockItem3 to test exact length constraints
const longTitle =
  "This is a very long title designed specifically to test the 150 character limit for titles displayed within the static item tile component at scale three. Yes, exactly 150!"; // 150 chars
// Use helper to generate 1500 chars description
const longDescription = generateLoremIpsum(1500);

const mockItem3: HexTileData = {
  metadata: {
    dbId: "db-item-3",
    coordId: "3,3",
    parentId: "0,0",
    coordinates: HexCoordSystem.parseId("3,3"),
    depth: 1,
  },
  data: {
    name: longTitle,
    description: longDescription, // Updated to 1500 chars
    url: "https://example.com/item3-very-long-url-that-should-be-truncated-to-fifty-characters",
    color: "fuchsia-600",
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

const meta: Meta<typeof StaticItemTile> = {
  title: "Map/Tile/StaticItemTile",
  component: StaticItemTile,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    item: { control: "object" }, // Keep control as object for simplicity
    scale: { control: { type: "range", min: 1, max: 3, step: 1 } },
  },
};

export default meta;
type Story = StoryObj<typeof StaticItemTile>;

// Default story with mock item 1 at scale 1
export const DefaultScale1: Story = {
  args: {
    item: mockItem1,
    scale: 1,
    allExpandedItemIds: [],
    hasChildren: false,
  },
};

// Default story with mock item 1 at scale 2
export const DefaultScale2: Story = {
  args: {
    item: mockItem1,
    scale: 2,
    allExpandedItemIds: [],
    hasChildren: false,
  },
};

// Default story with mock item 1 at scale 3
export const DefaultScale3: Story = {
  args: {
    item: mockItem1,
    scale: 3,
    allExpandedItemIds: [],
    hasChildren: false,
  },
};

// Story with mock item 2 (different color, more content) at scale 3
export const Item2Scale3: Story = {
  args: {
    item: mockItem2,
    scale: 3,
    allExpandedItemIds: [],
    hasChildren: false,
  },
};

// Story with mock item 2 at scale 1
export const Item2Scale1: Story = {
  args: {
    item: mockItem2,
    scale: 1,
    allExpandedItemIds: [],
    hasChildren: false,
  },
};

// Story with mock item 3 (exact length limits) at scale 3
export const Item3Scale3: Story = {
  args: {
    item: mockItem3,
    scale: 3,
    allExpandedItemIds: [],
    hasChildren: false,
  },
};

// Story with mock item 3 (long title) at scale 2
export const Item3Scale2: Story = {
  args: {
    item: mockItem3, // mockItem3 has a 150 char title
    scale: 2,
    allExpandedItemIds: [],
    hasChildren: false,
  },
};
