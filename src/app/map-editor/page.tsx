"use client";

import { useState } from "react";
import { HexGrid } from "~/components/HexGrid";
import { HexCoordinate, HexDirection } from "~/lib/hex-coordinates";

// Define the types for different item kinds
type ContentItem = {
  title: string;
  viewCount: number;
  youtubeVideoId: string;
};

type ResourceItem = {
  title: string;
  url: string;
};

type EventItem = {
  title: string;
  startDate: Date;
  endDate: Date;
};

type AuthorItem = {
  name: string;
  imageUrl: string | null;
};

// Define the union type for map items
type MapItem =
  | { coordinates: HexCoordinate; itemType: "content"; item: ContentItem }
  | { coordinates: HexCoordinate; itemType: "resource"; item: ResourceItem }
  | { coordinates: HexCoordinate; itemType: "event"; item: EventItem }
  | { coordinates: HexCoordinate; itemType: "author"; item: AuthorItem };

export default function MapEditorPage() {
  // Example map items (in a real app, these would come from API)
  const [items, setItems] = useState<MapItem[]>([
    {
      coordinates: { row: 3, col: 4, path: [] as HexDirection[] },
      itemType: "content",
      item: {
        title: "Building a Hexagonal Grid",
        viewCount: 1245,
        youtubeVideoId: "dQw4w9WgXcQ",
      },
    },
    {
      coordinates: { row: 5, col: 7, path: [] as HexDirection[] },
      itemType: "resource",
      item: {
        title: "Hexagon Grid Tutorial",
        url: "https://example.com/hex-grid",
      },
    },
    {
      coordinates: { row: 2, col: 6, path: [] as HexDirection[] },
      itemType: "event",
      item: {
        title: "Hex Grid Conference",
        startDate: new Date("2023-12-01"),
        endDate: new Date("2023-12-03"),
      },
    },
    {
      coordinates: { row: 6, col: 3, path: [] as HexDirection[] },
      itemType: "author",
      item: {
        name: "Jane Hexagon",
        imageUrl: null,
      },
    },
  ]);

  const [selectedCoordinate, setSelectedCoordinate] =
    useState<HexCoordinate | null>(null);
  const [placementMode, setPlacementMode] = useState<
    "none" | "content" | "resource" | "event" | "author"
  >("none");

  const handleTileClick = (coordinate: HexCoordinate) => {
    if (placementMode !== "none") {
      // In placement mode, add a new item
      const itemToAdd = getNewItem(placementMode, {
        ...coordinate,
        path: [...coordinate.path],
      });
      if (itemToAdd) {
        setItems([...items, itemToAdd]);
      }
      setPlacementMode("none");
    } else {
      // Otherwise, select the tile
      setSelectedCoordinate(coordinate);
    }
  };

  // Helper to create a new item based on type
  const getNewItem = (
    type: "content" | "resource" | "event" | "author",
    coordinates: HexCoordinate,
  ): MapItem | null => {
    switch (type) {
      case "content":
        return {
          coordinates,
          itemType: "content",
          item: {
            title: "New Video",
            viewCount: 0,
            youtubeVideoId: "dQw4w9WgXcQ",
          },
        };
      case "resource":
        return {
          coordinates,
          itemType: "resource",
          item: {
            title: "New Resource",
            url: "https://example.com",
          },
        };
      case "event":
        return {
          coordinates,
          itemType: "event",
          item: {
            title: "New Event",
            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000), // tomorrow
          },
        };
      case "author":
        return {
          coordinates,
          itemType: "author",
          item: {
            name: "New Author",
            imageUrl: null,
          },
        };
      default:
        return null;
    }
  };

  return (
    <main className="relative min-h-screen bg-slate-200">
      <div className="fixed left-4 top-4 z-10 flex gap-2 rounded-lg bg-white p-4 shadow-lg">
        <h1 className="mr-4 text-xl font-bold">Map Editor</h1>
        <button
          className={`rounded px-3 py-1 ${
            placementMode === "content"
              ? "bg-red-500 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => setPlacementMode("content")}
        >
          Add Content
        </button>
        <button
          className={`rounded px-3 py-1 ${
            placementMode === "resource"
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => setPlacementMode("resource")}
        >
          Add Resource
        </button>
        <button
          className={`rounded px-3 py-1 ${
            placementMode === "event"
              ? "bg-green-500 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => setPlacementMode("event")}
        >
          Add Event
        </button>
        <button
          className={`rounded px-3 py-1 ${
            placementMode === "author"
              ? "bg-purple-500 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => setPlacementMode("author")}
        >
          Add Author
        </button>
      </div>

      <div className="absolute inset-0">
        <HexGrid
          dimensions={{
            rows: 10,
            cols: 10,
            baseSize: 64,
          }}
          items={items}
          onTileClick={handleTileClick}
          selectedCoordinate={selectedCoordinate}
        />
      </div>

      {selectedCoordinate && (
        <div className="fixed bottom-4 right-4 z-10 rounded-lg bg-white p-4 shadow-lg">
          <h3 className="mb-2 text-lg font-semibold">Selected Tile</h3>
          <p>
            Row: {selectedCoordinate.row}, Col: {selectedCoordinate.col}
          </p>
          <button
            className="mt-2 rounded bg-red-500 px-3 py-1 text-white"
            onClick={() => setSelectedCoordinate(null)}
          >
            Close
          </button>
        </div>
      )}
    </main>
  );
}
