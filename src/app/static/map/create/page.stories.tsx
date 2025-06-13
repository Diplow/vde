import type { Meta, StoryObj } from "@storybook/react";
import { ChevronDown } from "lucide-react";
import { StaticBaseTileLayout } from "../Tile/Base/base";
import {
  HIERARCHY_TILE_BASE_SIZE,
  HIERARCHY_TILE_SCALE,
} from "~/app/map/constants";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import { getColor } from "~/app/map/types/tile-data";
import type { TileColor } from "~/app/static/map/Tile/Base/base";

// Mock hierarchy tile component for stories
const MockHierarchyTile = ({
  name,
  coordId,
}: {
  name: string;
  coordId: string;
}) => {
  const coords = CoordSystem.parseId(coordId);
  const colorString = getColor(coords);
  const [colorName, tint] = colorString.split("-");
  const color: TileColor = {
    color: colorName as "zinc" | "amber" | "lime" | "fuchsia" | "rose" | "indigo" | "cyan",
    tint: (tint ?? "400") as "50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | "950",
  };

  return (
    <div className="flex-shrink-0 cursor-pointer rounded-lg transition-transform hover:scale-105">
      <StaticBaseTileLayout
        coordId={coordId}
        scale={HIERARCHY_TILE_SCALE}
        color={color}
        baseHexSize={HIERARCHY_TILE_BASE_SIZE}
        isFocusable={false}
      >
        <div className="flex h-full w-full items-center justify-center p-2">
          <span
            className="text-center text-xs font-medium leading-tight text-slate-800"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {name}
          </span>
        </div>
      </StaticBaseTileLayout>
    </div>
  );
};

// Create page wrapper component for different scenarios
interface CreatePageWrapperProps {
  position?: string;
  parentName?: string;
  hierarchy?: Array<{ name: string; coordId: string }>;
  showErrors?: boolean;
}

const CreatePageWrapper = ({
  position = "1,0:1,3",
  parentName = "Example Parent Item",
  hierarchy = [],
  showErrors = false,
}: CreatePageWrapperProps) => {
  const hasParent = parentName !== null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto max-w-5xl p-6">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-gray-300"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Map
            </a>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-white">Create New Item</h1>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Position: {position}</span>
            </div>
          </div>

          {/* Main content area with two columns */}
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Left Column */}
            <div className="flex-1 space-y-6">
              {/* Parent Info */}
              {hasParent && (
                <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                  <p className="text-sm font-medium text-gray-300">
                    Creating child of:{" "}
                    <span className="font-normal text-white">{parentName}</span>
                  </p>
                </div>
              )}

              {/* Form */}
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
                {showErrors && (
                  <div className="mb-4 rounded-md bg-rose-50 p-3">
                    <p className="text-sm text-rose-600">
                      Failed to create item. Please try again.
                    </p>
                  </div>
                )}

                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Title *
                    </label>
                    <input
                      type="text"
                      className={`mt-1 block w-full rounded-md border bg-gray-700 px-3 py-2 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        showErrors ? "border-rose-500" : "border-gray-600"
                      }`}
                      placeholder="Enter item title"
                    />
                    {showErrors && (
                      <p className="mt-1 text-sm text-rose-400">
                        Title is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter item description (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      URL
                    </label>
                    <input
                      type="url"
                      className={`mt-1 block w-full rounded-md border bg-gray-700 px-3 py-2 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        showErrors ? "border-rose-500" : "border-gray-600"
                      }`}
                      placeholder="https://example.com (optional)"
                    />
                    {showErrors && (
                      <p className="mt-1 text-sm text-rose-400">
                        Please enter a valid URL
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Create Item
                    </button>
                    <a
                      href="#"
                      className="flex-1 rounded-md border border-gray-600 px-4 py-2 text-center text-gray-300 transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </a>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column - Hierarchy Panel */}
            <div className="lg:w-96">
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">
                  Hierarchy
                </h2>
                <div className="flex flex-col items-center gap-2">
                  {hierarchy.length > 0 ? (
                    <>
                      {hierarchy.map((item, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-center gap-1"
                        >
                          <MockHierarchyTile
                            name={item.name}
                            coordId={item.coordId}
                          />
                          {index < hierarchy.length - 1 && (
                            <ChevronDown
                              size={16}
                              className="flex-shrink-0 text-zinc-400"
                            />
                          )}
                        </div>
                      ))}
                      {hierarchy.length > 0 && (
                        <ChevronDown
                          size={16}
                          className="flex-shrink-0 text-zinc-400"
                        />
                      )}
                      {/* New item being created */}
                      <div className="pointer-events-none opacity-60">
                        <MockHierarchyTile name="New Item" coordId={position} />
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-400">
                      No parent hierarchy
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta = {
  title: "Static/Map/Create/Page",
  component: CreatePageWrapper,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The complete create item page layout with form and hierarchy display.",
      },
    },
  },
} satisfies Meta<typeof CreatePageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    position: "1,0:1",
    parentName: "Project Overview",
    hierarchy: [{ name: "My Workspace", coordId: "1,0" }],
  },
};

export const CreatingAtRoot: Story = {
  args: {
    position: "1,0",
    parentName: undefined,
    hierarchy: [],
  },
};

export const DeepHierarchy: Story = {
  args: {
    position: "1,0:1,3,2,5,6",
    parentName: "Implementation Details",
    hierarchy: [
      { name: "My Workspace", coordId: "1,0" },
      { name: "Development", coordId: "1,0:1" },
      { name: "Frontend", coordId: "1,0:1,3" },
      { name: "Components", coordId: "1,0:1,3,2" },
    ],
  },
};

export const LongParentNames: Story = {
  args: {
    position: "1,0:2,4",
    parentName:
      "This is a very long parent item name that should wrap properly in the user interface",
    hierarchy: [
      {
        name: "Strategic Planning and Resource Management Dashboard",
        coordId: "1,0",
      },
      {
        name: "Q4 2024 Objectives and Key Results Tracking System",
        coordId: "1,0:2",
      },
    ],
  },
};

export const WithErrors: Story = {
  args: {
    position: "1,0:1,3",
    parentName: "Tasks",
    hierarchy: [
      { name: "Project Alpha", coordId: "1,0" },
      { name: "Development", coordId: "1,0:1" },
    ],
    showErrors: true,
  },
};

export const Mobile: Story = {
  args: {
    position: "1,0:1,3",
    parentName: "Mobile View Test",
    hierarchy: [
      { name: "Root", coordId: "1,0" },
      { name: "Parent", coordId: "1,0:1" },
    ],
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const Tablet: Story = {
  args: {
    position: "1,0:1,3",
    parentName: "Tablet View Test",
    hierarchy: [
      { name: "Root", coordId: "1,0" },
      { name: "Parent", coordId: "1,0:1" },
    ],
  },
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
  },
};

export const VeryDeepHierarchy: Story = {
  args: {
    position: "1,0:1,2,3,4,5,6,1,2",
    parentName: "Leaf Node",
    hierarchy: [
      { name: "Root System", coordId: "1,0" },
      { name: "Infrastructure", coordId: "1,0:1" },
      { name: "Services", coordId: "1,0:1,2" },
      { name: "Authentication", coordId: "1,0:1,2,3" },
      { name: "OAuth2", coordId: "1,0:1,2,3,4" },
      { name: "Providers", coordId: "1,0:1,2,3,4,5" },
      { name: "Google", coordId: "1,0:1,2,3,4,5,6" },
      { name: "Leaf Node", coordId: "1,0:1,2,3,4,5,6,1" },
    ],
  },
};
