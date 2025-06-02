import type { Meta, StoryObj } from "@storybook/react";
import { StaticMapCanvas, type CenterInfo } from "./index.static";
import type { HexTileData } from "../State/types";
import { getColor } from "../State/types";
import type { URLInfo } from "../types/url-info";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
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

// Helper function to create mock items
const createMockItem = (
  coordId: string,
  name: string,
  depth = 0,
  parentId?: string,
): HexTileData => {
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
      description: generateLoremIpsum(Math.floor(Math.random() * 300) + 100),
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

// Mock center info
const createMockCenterInfo = (coordId: string): CenterInfo => {
  const coords = CoordSystem.parseId(coordId);
  return {
    center: coordId,
    rootItemId: Math.floor(Math.random() * 1000) + 1,
    userId: coords.userId,
    groupId: coords.groupId,
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

// --- Mock Data Scenarios ---

// Single center item only
const mockDataSingleItem = (() => {
  const centerCoord = "1,2";
  const centerInfo = createMockCenterInfo(centerCoord);
  const items: Record<string, HexTileData> = {
    [centerCoord]: createMockItem(centerCoord, "Central Hub", 0),
  };
  return { centerInfo, items };
})();

// Center with children (one level)
const mockDataOneLevel = (() => {
  const centerCoord = "1,2";
  const centerInfo = createMockCenterInfo(centerCoord);
  const childCoords = CoordSystem.getChildCoordsFromId(centerCoord);

  const items: Record<string, HexTileData> = {
    [centerCoord]: createMockItem(centerCoord, "Project Management", 0),
  };

  // Add some children
  const childNames = [
    "Planning Phase",
    "Development",
    "Testing",
    "Deployment",
    "Maintenance",
    "Documentation",
  ];

  childCoords.forEach((coordId, index) => {
    if (index < childNames.length) {
      items[coordId] = createMockItem(
        coordId,
        childNames[index]!,
        1,
        centerCoord,
      );
    }
  });

  return { centerInfo, items };
})();

// Deep hierarchy (multiple levels)
const mockDataDeepHierarchy = (() => {
  const centerCoord = "1,2";
  const centerInfo = createMockCenterInfo(centerCoord);
  const items: Record<string, HexTileData> = {
    [centerCoord]: createMockItem(centerCoord, "Company Overview", 0),
  };

  // Level 1 children
  const level1Coords = CoordSystem.getChildCoordsFromId(centerCoord);
  const departments = [
    "Engineering",
    "Marketing",
    "Sales",
    "HR",
    "Finance",
    "Operations",
  ];

  level1Coords.forEach((coordId, index) => {
    if (index < departments.length) {
      items[coordId] = createMockItem(
        coordId,
        departments[index]!,
        1,
        centerCoord,
      );

      // Level 2 children for first few departments
      if (index < 3) {
        const level2Coords = CoordSystem.getChildCoordsFromId(coordId);
        const subteams =
          index === 0
            ? ["Frontend", "Backend", "Mobile", "DevOps", "QA", "Architecture"]
            : index === 1
              ? [
                  "Content",
                  "Design",
                  "Social Media",
                  "SEO",
                  "Analytics",
                  "Campaigns",
                ]
              : [
                  "B2B Sales",
                  "B2C Sales",
                  "Partnerships",
                  "Customer Success",
                  "Sales Ops",
                  "Lead Gen",
                ];

        level2Coords.forEach((level2CoordId, level2Index) => {
          if (level2Index < subteams.length) {
            items[level2CoordId] = createMockItem(
              level2CoordId,
              subteams[level2Index]!,
              2,
              coordId,
            );
          }
        });
      }
    }
  });

  return { centerInfo, items };
})();

// Large dataset scenario
const mockDataLarge = (() => {
  const centerCoord = "1,2";
  const centerInfo = createMockCenterInfo(centerCoord);
  const items: Record<string, HexTileData> = {
    [centerCoord]: createMockItem(centerCoord, "Knowledge Base", 0),
  };

  // Generate multiple levels with many items
  const level1Coords = CoordSystem.getChildCoordsFromId(centerCoord);

  level1Coords.forEach((coordId, index) => {
    items[coordId] = createMockItem(
      coordId,
      `Category ${index + 1}`,
      1,
      centerCoord,
    );

    const level2Coords = CoordSystem.getChildCoordsFromId(coordId);
    level2Coords.forEach((level2CoordId, level2Index) => {
      items[level2CoordId] = createMockItem(
        level2CoordId,
        `Topic ${index + 1}.${level2Index + 1}`,
        2,
        coordId,
      );

      // Some level 3 items too
      if (level2Index < 2) {
        const level3Coords = CoordSystem.getChildCoordsFromId(level2CoordId);
        level3Coords.forEach((level3CoordId, level3Index) => {
          if (level3Index < 3) {
            items[level3CoordId] = createMockItem(
              level3CoordId,
              `Subtopic ${index + 1}.${level2Index + 1}.${level3Index + 1}`,
              3,
              level2CoordId,
            );
          }
        });
      }
    });
  });

  return { centerInfo, items };
})();

// Empty/minimal scenario
const mockDataEmpty = (() => {
  const centerCoord = "1,2";
  const centerInfo = createMockCenterInfo(centerCoord);
  const items: Record<string, HexTileData> = {};
  return { centerInfo, items };
})();

// --- Storybook Meta ---
const meta: Meta<typeof StaticMapCanvas> = {
  title: "Map/Canvas/StaticMapCanvas",
  component: StaticMapCanvas,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `StaticMapCanvas is the main orchestrator for rendering hexagonal maps. It displays a hierarchical structure of hexagonal tiles that can be expanded and navigated. The component is fully static and works with URL-based state management. Colors are automatically assigned based on coordinate structure using the getColor helper function.`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    centerInfo: {
      control: "object",
      description:
        "Information about the map center including coordinates and IDs",
    },
    items: {
      control: "object",
      description: "Record of all map items keyed by their coordinate IDs",
    },
    scale: {
      control: { type: "range", min: 1, max: 6, step: 1 },
      description: "Overall scale/zoom level of the map",
    },
    expandedItemIds: {
      control: "object",
      description: "Array of database IDs for items that should be expanded",
    },
    baseHexSize: {
      control: { type: "range", min: 20, max: 100, step: 5 },
      description: "Base size in pixels for hexagonal tiles",
    },
    urlInfo: {
      control: "object",
      description: "URL information for navigation and state management",
    },
  },
};

export default meta;
type Story = StoryObj<typeof StaticMapCanvas>;

// --- Stories ---

export const Empty: Story = {
  args: {
    centerInfo: mockDataEmpty.centerInfo,
    items: mockDataEmpty.items,
    scale: 3,
    expandedItemIds: [],
    baseHexSize: 50,
    urlInfo: createMockUrlInfo("3"),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Empty map canvas with no items, showing how the component handles missing data gracefully.",
      },
    },
  },
};

export const SingleItem: Story = {
  args: {
    centerInfo: mockDataSingleItem.centerInfo,
    items: mockDataSingleItem.items,
    scale: 3,
    expandedItemIds: [],
    baseHexSize: 50,
    urlInfo: createMockUrlInfo("3"),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Map with a single center item, demonstrating the basic tile rendering with automatic color assignment.",
      },
    },
  },
};

export const OneLevelExpanded: Story = {
  args: {
    centerInfo: mockDataOneLevel.centerInfo,
    items: mockDataOneLevel.items,
    scale: 3,
    expandedItemIds: [
      mockDataOneLevel.centerInfo.center.replace(/[,:]/g, "-"),
    ].map((id) => `db-item-${id}`),
    baseHexSize: 50,
    urlInfo: createMockUrlInfo(
      "3",
      mockDataOneLevel.centerInfo.center.replace(/[,:]/g, "-"),
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Map showing a center item expanded to reveal its immediate children in hexagonal layout. Colors are automatically assigned based on coordinate paths.",
      },
    },
  },
};

export const DeepHierarchy: Story = {
  args: {
    centerInfo: mockDataDeepHierarchy.centerInfo,
    items: mockDataDeepHierarchy.items,
    scale: 3,
    expandedItemIds: [
      mockDataDeepHierarchy.centerInfo.center.replace(/[,:]/g, "-"),
      ...CoordSystem.getChildCoordsFromId(
        mockDataDeepHierarchy.centerInfo.center,
      )
        .slice(0, 3)
        .map((coord) => coord.replace(/[,:]/g, "-")),
    ].map((id) => `db-item-${id}`),
    baseHexSize: 50,
    urlInfo: createMockUrlInfo("3"),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Complex hierarchy with multiple levels expanded, showing nested hexagonal regions and recursive rendering. Notice how colors automatically become deeper as hierarchy depth increases.",
      },
    },
  },
};

export const LargeDataset: Story = {
  args: {
    centerInfo: mockDataLarge.centerInfo,
    items: mockDataLarge.items,
    scale: 3,
    expandedItemIds: [
      mockDataLarge.centerInfo.center.replace(/[,:]/g, "-"),
    ].map((id) => `db-item-${id}`),
    baseHexSize: 40,
    urlInfo: createMockUrlInfo("3"),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Large dataset with many items across multiple hierarchy levels, demonstrating performance with extensive data and systematic color assignment.",
      },
    },
  },
};

export const SmallScale: Story = {
  args: {
    centerInfo: mockDataOneLevel.centerInfo,
    items: mockDataOneLevel.items,
    scale: 1,
    expandedItemIds: [
      mockDataOneLevel.centerInfo.center.replace(/[,:]/g, "-"),
    ].map((id) => `db-item-${id}`),
    baseHexSize: 30,
    urlInfo: createMockUrlInfo("1"),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Map rendered at small scale, showing how content adapts to limited space while maintaining color consistency.",
      },
    },
  },
};

export const LargeScale: Story = {
  args: {
    centerInfo: mockDataOneLevel.centerInfo,
    items: mockDataOneLevel.items,
    scale: 5,
    expandedItemIds: [
      mockDataOneLevel.centerInfo.center.replace(/[,:]/g, "-"),
    ].map((id) => `db-item-${id}`),
    baseHexSize: 60,
    urlInfo: createMockUrlInfo("5"),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Map rendered at large scale, showing detailed content and larger hexagonal tiles with clear color distinctions.",
      },
    },
  },
};

export const WithCustomChildren: Story = {
  args: {
    centerInfo: mockDataSingleItem.centerInfo,
    items: mockDataSingleItem.items,
    scale: 3,
    expandedItemIds: [],
    baseHexSize: 50,
    urlInfo: createMockUrlInfo("3"),
    children: (
      <div className="absolute bottom-4 right-4 rounded bg-white p-2 shadow-lg">
        <p className="text-sm text-gray-600">Custom overlay content</p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Map with custom children content overlaid on top, demonstrating the children prop functionality.",
      },
    },
  },
};

export const NonInteractiveMode: Story = {
  args: {
    centerInfo: mockDataOneLevel.centerInfo,
    items: mockDataOneLevel.items,
    scale: 3,
    expandedItemIds: [
      mockDataOneLevel.centerInfo.center.replace(/[,:]/g, "-"),
    ].map((id) => `db-item-${id}`),
    baseHexSize: 50,
    urlInfo: createMockUrlInfo("3"),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Map in non-interactive mode, useful for loading states or read-only displays where buttons are hidden.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ pointerEvents: "none" }}>
        <Story />
      </div>
    ),
  ],
};
