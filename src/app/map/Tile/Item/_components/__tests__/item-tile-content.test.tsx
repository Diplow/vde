import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ItemTileContent } from "../item-tile-content";
import type { TileData } from "~/app/map/types/tile-data";
import { TileActionsProvider } from "~/app/map/Canvas/TileActionsContext";

// Mock the hooks
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("~/app/map/Cache/map-cache", () => ({
  useMapCache: () => ({
    navigateToItem: vi.fn(),
    toggleItemExpansionWithURL: vi.fn(),
  }),
}));

// Mock the useTileInteraction hook to check the tileData passed to it
let capturedTileData: any = null;
vi.mock("~/app/map/hooks/useTileInteraction", () => ({
  useTileInteraction: (props: any) => {
    capturedTileData = props.tileData;
    return {
      handleClick: vi.fn(),
      cursor: props.tileData?.state?.canExpand === false ? "cursor-not-allowed" : "cursor-zoom-in",
      activeTool: "expand",
      shouldShowHoverEffects: true,
    };
  },
}));

describe("ItemTileContent - Scale 1 Expansion", () => {
  const createTestTile = (coordId: string, dbId: string): TileData => ({
    metadata: {
      coordId,
      dbId,
      ownerId: "user1",
      coordinates: {
        userId: 1,
        groupId: 0,
        path: [1],
      },
      depth: 1,
      parentId: null,
    },
    data: {
      name: "Test Tile",
      description: "Test Description",
      url: "",
      color: "zinc-50",
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

  beforeEach(() => {
    capturedTileData = null;
  });

  it("should set canExpand to false for scale 1 tiles that are not expanded", () => {
    const testTile = createTestTile("1,0:1", "1");

    render(
      <TileActionsProvider>
        <ItemTileContent
          item={testTile}
          scale={1}
          baseHexSize={50}
          tileColor="zinc-50"
          testId="test-tile"
          interactive={true}
          isBeingDragged={false}
          urlInfo={{ hasURL: false }}
          allExpandedItemIds={[]} // Not expanded
          hasChildren={true} // Even with children, scale 1 shouldn't be expandable
          isCenter={false}
          canEdit={true} // Even if user can edit, scale 1 shouldn't be expandable
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      </TileActionsProvider>
    );

    // Check that canExpand was set to false
    expect(capturedTileData).toBeDefined();
    expect(capturedTileData.state.canExpand).toBe(false);
  });

  it("should set canExpand to true for scale 1 tiles that are already expanded (can collapse)", () => {
    const testTile = createTestTile("1,0:1", "1");

    render(
      <TileActionsProvider>
        <ItemTileContent
          item={testTile}
          scale={1}
          baseHexSize={50}
          tileColor="zinc-50"
          testId="test-tile"
          interactive={true}
          isBeingDragged={false}
          urlInfo={{ hasURL: false }}
          allExpandedItemIds={["1"]} // This tile is expanded
          hasChildren={true}
          isCenter={false}
          canEdit={false}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      </TileActionsProvider>
    );

    // Check that canExpand was set to true (because it can collapse)
    expect(capturedTileData).toBeDefined();
    expect(capturedTileData.state.canExpand).toBe(true);
    expect(capturedTileData.state.isExpanded).toBe(true);
  });

  it("should set canExpand to true for scale 2 tiles with children", () => {
    const testTile = createTestTile("1,0:1", "1");

    render(
      <TileActionsProvider>
        <ItemTileContent
          item={testTile}
          scale={2}
          baseHexSize={50}
          tileColor="zinc-50"
          testId="test-tile"
          interactive={true}
          isBeingDragged={false}
          urlInfo={{ hasURL: false }}
          allExpandedItemIds={[]}
          hasChildren={true}
          isCenter={false}
          canEdit={false} // Even if user can't edit, should be expandable with children
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      </TileActionsProvider>
    );

    // Check that canExpand was set to true
    expect(capturedTileData).toBeDefined();
    expect(capturedTileData.state.canExpand).toBe(true);
  });

  it("should set canExpand to false for scale 2 tiles without children and no edit permission", () => {
    const testTile = createTestTile("1,0:1", "1");

    render(
      <TileActionsProvider>
        <ItemTileContent
          item={testTile}
          scale={2}
          baseHexSize={50}
          tileColor="zinc-50"
          testId="test-tile"
          interactive={true}
          isBeingDragged={false}
          urlInfo={{ hasURL: false }}
          allExpandedItemIds={[]}
          hasChildren={false}
          isCenter={false}
          canEdit={false}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      </TileActionsProvider>
    );

    // Check that canExpand was set to false
    expect(capturedTileData).toBeDefined();
    expect(capturedTileData.state.canExpand).toBe(false);
  });

  it("should set canExpand to true for scale 3 tiles with edit permission", () => {
    const testTile = createTestTile("1,0:1", "1");

    render(
      <TileActionsProvider>
        <ItemTileContent
          item={testTile}
          scale={3}
          baseHexSize={50}
          tileColor="zinc-50"
          testId="test-tile"
          interactive={true}
          isBeingDragged={false}
          urlInfo={{ hasURL: false }}
          allExpandedItemIds={[]}
          hasChildren={false}
          isCenter={true}
          canEdit={true}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      </TileActionsProvider>
    );

    // Check that canExpand was set to true
    expect(capturedTileData).toBeDefined();
    expect(capturedTileData.state.canExpand).toBe(true);
  });
});