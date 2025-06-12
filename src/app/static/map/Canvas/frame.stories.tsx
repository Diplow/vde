import type { Meta, StoryObj } from "@storybook/react";
import { StaticFrame } from "./frame";
import type { TileData } from "~/app/map/types/tile-data";
import { getColor } from "~/app/map/types/tile-data";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { URLInfo } from "~/app/map/types/url-info";
import "~/styles/globals.css";

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
  depth = 0,
  parentId?: string,
): TileData => {
  const coordinates = CoordSystem.parseId(coordId);
  return {
    metadata: {
      dbId: `db-item-${coordId.replace(/[,:]/g, "-")}`,
      coordId,
      parentId,
      coordinates,
      depth,
    },
    data: {
      name,
      description: generateLoremIpsum(200),
      url: `https://example.com/${name.toLowerCase().replace(/\s+/g, "-")}`,
      color: getColor(coordinates),
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
};

// Mock URL info
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

// --- Mock Data ---
const centerCoord = "0,0";
const nwCoord = CoordSystem.getChildCoordsFromId(centerCoord)[0]; // "0,0:NW"
const neCoord = CoordSystem.getChildCoordsFromId(centerCoord)[1]; // "0,0:NE"
const eCoord = CoordSystem.getChildCoordsFromId(centerCoord)[2]; // "0,0:E"

const nw_nwCoord = CoordSystem.getChildCoordsFromId(nwCoord)[0]; // "0,0:NW,NW"

const mockMapItemsSimple: Record<string, TileData> = {
  [centerCoord]: createMockItem(centerCoord, "Center Item", 0),
};

const mockMapItemsOneLevel: Record<string, TileData> = {
  [centerCoord]: createMockItem(centerCoord, "Center", 0),
  [nwCoord]: createMockItem(nwCoord, "North West Child", 1, centerCoord),
  [neCoord]: createMockItem(neCoord, "North East Child", 1, centerCoord),
  [eCoord]: createMockItem(eCoord, "East Child", 1, centerCoord),
  // SE, SW, W are missing to test partial children
};

const mockMapItemsTwoLevels: Record<string, TileData> = {
  ...mockMapItemsOneLevel,
  [nw_nwCoord]: createMockItem(nw_nwCoord, "NW's NW Child", 2, nwCoord),
  [CoordSystem.getChildCoordsFromId(nwCoord)[1]]: createMockItem(
    CoordSystem.getChildCoordsFromId(nwCoord)[1],
    "NW's NE Child",
    2,
    nwCoord,
  ),
};

// --- Storybook Meta ---
const meta: Meta<typeof StaticFrame> = {
  title: "Map/Canvas/StaticFrame",
  component: StaticFrame,
  parameters: {
    layout: "centered", // Or 'fullscreen' if it makes more sense
    docs: {
      description: {
        component: `StaticFrame renders a hexagonal frame of map tiles. It can recursively render child frames when items are expanded. Colors are automatically assigned based on coordinate structure using the getColor helper function.`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    center: { control: "text" },
    mapItems: { control: "object" },
    baseHexSize: { control: { type: "number", min: 20, max: 100, step: 5 } },
    expandedItemIds: { control: "object" }, // Array of strings
    scale: { control: { type: "range", min: 1, max: 6, step: 1 } },
    urlInfo: { control: "object" },
    interactive: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof StaticFrame>;

// --- Stories ---

export const SingleTileNoExpansion: Story = {
  args: {
    center: centerCoord,
    mapItems: mockMapItemsSimple,
    baseHexSize: 50,
    expandedItemIds: [],
    scale: 3,
    urlInfo: createMockUrlInfo("3"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Single center tile with no expansion, showing basic tile rendering with automatic colors.",
      },
    },
  },
};

export const CenterTileMissing: Story = {
  args: {
    center: "10,10", // A coordinate not in mapItems
    mapItems: mockMapItemsSimple,
    baseHexSize: 50,
    expandedItemIds: [],
    scale: 3,
    urlInfo: createMockUrlInfo("3"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates graceful handling when the center tile is missing from the data.",
      },
    },
  },
};

export const OneLevelExpanded: Story = {
  args: {
    center: centerCoord,
    mapItems: mockMapItemsOneLevel,
    baseHexSize: 50,
    expandedItemIds: [`db-item-${centerCoord.replace(/[,:]/g, "-")}`],
    scale: 3,
    urlInfo: createMockUrlInfo("3"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Center tile expanded to show first level children with automatic color assignments.",
      },
    },
  },
};

export const OneLevelExpandedWithMissingChildren: Story = {
  args: {
    center: centerCoord,
    mapItems: {
      // Only center and one child
      [centerCoord]: createMockItem(centerCoord, "Center", 0),
      [nwCoord]: createMockItem(nwCoord, "North West Child", 1, centerCoord),
    },
    baseHexSize: 50,
    expandedItemIds: [`db-item-${centerCoord.replace(/[,:]/g, "-")}`],
    scale: 3,
    urlInfo: createMockUrlInfo("3"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Expanded center with only some children present, showing partial child rendering.",
      },
    },
  },
};

export const TwoLevelsExpanded: Story = {
  args: {
    center: centerCoord,
    mapItems: mockMapItemsTwoLevels,
    baseHexSize: 50,
    expandedItemIds: [
      `db-item-${centerCoord.replace(/[,:]/g, "-")}`,
      `db-item-${nwCoord.replace(/[,:]/g, "-")}`,
    ], // Expand center and its NW child
    scale: 3,
    urlInfo: createMockUrlInfo("3"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Two levels of expansion showing recursive hexagonal frames with color depth progression.",
      },
    },
  },
};

export const DifferentBaseSize: Story = {
  args: {
    center: centerCoord,
    mapItems: mockMapItemsOneLevel,
    baseHexSize: 80,
    expandedItemIds: [`db-item-${centerCoord.replace(/[,:]/g, "-")}`],
    scale: 3,
    urlInfo: createMockUrlInfo("3"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Larger base hex size demonstration showing how tiles scale proportionally.",
      },
    },
  },
};

export const NoItemsAtAll: Story = {
  args: {
    center: centerCoord,
    mapItems: {},
    baseHexSize: 50,
    expandedItemIds: [],
    scale: 3,
    urlInfo: createMockUrlInfo("3"),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Empty map items showing how the component handles completely missing data.",
      },
    },
  },
};

export const NonInteractiveMode: Story = {
  args: {
    center: centerCoord,
    mapItems: mockMapItemsOneLevel,
    baseHexSize: 50,
    expandedItemIds: [`db-item-${centerCoord.replace(/[,:]/g, "-")}`],
    scale: 3,
    urlInfo: createMockUrlInfo("3"),
    interactive: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive mode disabled (interactive={false}) hides all tile buttons, useful for loading states or read-only displays.",
      },
    },
  },
};
