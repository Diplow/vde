import type { Meta, StoryObj } from "@storybook/react";
import { StaticItemTile } from "./item";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { TileData } from "~/app/map/types/tile-data";
import { getColor } from "~/app/map/types/tile-data";
import type { URLInfo } from "~/app/map/types/url-info";
import "~/styles/globals.css";

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

// Mock URL info helper
const createMockUrlInfo = (
  scale?: string,
  expandedItems?: string,
  focus?: string,
): URLInfo => ({
  pathname: "/map/mock-item",
  searchParamsString: new URLSearchParams({
    ...(scale && { scale }),
    ...(expandedItems && { expandedItems }),
    ...(focus && { focus }),
  }).toString(),
  rootItemId: "mock-item",
  scale,
  expandedItems,
  focus,
});

// Mock TileData - Using getColor helper for automatic color assignment
const mockItem1: TileData = {
  metadata: {
    dbId: "db-item-1",
    coordId: "1,1",
    parentId: "0,0", // Example parent
    coordinates: CoordSystem.parseId("1,1"),
    depth: 1,
  },
  data: {
    name: "Item Tile 1",
    description: "Description for item 1.",
    url: "https://example.com/item1",
    color: getColor(CoordSystem.parseId("1,1")),
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

const mockItem2: TileData = {
  metadata: {
    dbId: "db-item-2",
    coordId: "2,2",
    parentId: "0,0", // Example parent
    coordinates: CoordSystem.parseId("2,2"),
    depth: 1,
  },
  data: {
    name: "Rester sur X pour débattre avec tout le monde ? Le Libre marché des idées",
    description: generateLoremIpsum(1500),
    url: "https://example.com/item2-details",
    color: getColor(CoordSystem.parseId("2,2")),
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

const mockItem3: TileData = {
  metadata: {
    dbId: "db-item-3",
    coordId: "3,3",
    parentId: "0,0",
    coordinates: CoordSystem.parseId("3,3"),
    depth: 1,
  },
  data: {
    name: longTitle,
    description: longDescription, // Updated to 1500 chars
    url: "https://example.com/item3-very-long-url-that-should-be-truncated-to-fifty-characters",
    color: getColor(CoordSystem.parseId("3,3")),
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
    docs: {
      description: {
        component: `StaticItemTile renders individual hexagonal map items with content and navigation buttons. Colors are automatically assigned based on coordinate structure using the getColor helper function. It supports different scales and interaction modes.`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    item: { control: "object" }, // Keep control as object for simplicity
    scale: { control: { type: "range", min: 1, max: 6, step: 1 } },
    baseHexSize: { control: { type: "range", min: 30, max: 100, step: 5 } },
    allExpandedItemIds: { control: "object" },
    hasChildren: { control: "boolean" },
    isCenter: { control: "boolean" },
    urlInfo: { control: "object" },
    interactive: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof StaticItemTile>;

// Default story with mock item 1 at scale 1
export const DefaultScale1: Story = {
  args: {
    item: mockItem1,
    scale: 1,
    baseHexSize: 50,
    allExpandedItemIds: [],
    hasChildren: false,
    isCenter: false,
    urlInfo: createMockUrlInfo("1"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Basic item tile at scale 1 with automatic color assignment.",
      },
    },
  },
};

// Default story with mock item 1 at scale 2
export const DefaultScale2: Story = {
  args: {
    item: mockItem1,
    scale: 2,
    baseHexSize: 50,
    allExpandedItemIds: [],
    hasChildren: false,
    isCenter: false,
    urlInfo: createMockUrlInfo("2"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Item tile at scale 2 showing more content space.",
      },
    },
  },
};

// Default story with mock item 1 at scale 3
export const DefaultScale3: Story = {
  args: {
    item: mockItem1,
    scale: 3,
    baseHexSize: 50,
    allExpandedItemIds: [],
    hasChildren: false,
    isCenter: false,
    urlInfo: createMockUrlInfo("3"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Item tile at scale 3 with full content visibility.",
      },
    },
  },
};

// Story with mock item 2 (different color, more content) at scale 3
export const Item2Scale3: Story = {
  args: {
    item: mockItem2,
    scale: 3,
    baseHexSize: 50,
    allExpandedItemIds: [],
    hasChildren: false,
    isCenter: false,
    urlInfo: createMockUrlInfo("3"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Item with longer title and content at scale 3, showing text wrapping.",
      },
    },
  },
};

// Story with mock item 2 at scale 1
export const Item2Scale1: Story = {
  args: {
    item: mockItem2,
    scale: 1,
    baseHexSize: 50,
    allExpandedItemIds: [],
    hasChildren: false,
    isCenter: false,
    urlInfo: createMockUrlInfo("1"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Long content item at scale 1 showing truncation behavior.",
      },
    },
  },
};

// Story with mock item 3 (exact length limits) at scale 3
export const Item3Scale3: Story = {
  args: {
    item: mockItem3,
    scale: 3,
    baseHexSize: 50,
    allExpandedItemIds: [],
    hasChildren: false,
    isCenter: false,
    urlInfo: createMockUrlInfo("3"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Item with exactly 150 character title testing length limits.",
      },
    },
  },
};

// Story with mock item 3 (long title) at scale 2
export const Item3Scale2: Story = {
  args: {
    item: mockItem3, // mockItem3 has a 150 char title
    scale: 2,
    baseHexSize: 50,
    allExpandedItemIds: [],
    hasChildren: false,
    isCenter: false,
    urlInfo: createMockUrlInfo("2"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Long title at scale 2 showing intermediate content visibility.",
      },
    },
  },
};

// Story showing center tile behavior (no navigation button)
export const CenterTile: Story = {
  args: {
    item: mockItem1,
    scale: 3,
    baseHexSize: 50,
    allExpandedItemIds: [],
    hasChildren: true,
    isCenter: true,
    urlInfo: createMockUrlInfo("3"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Center tile with children showing expand/collapse button instead of navigation.",
      },
    },
  },
};
