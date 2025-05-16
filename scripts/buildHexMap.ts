// Import environment configuration first
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env files
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local") });

import { createCaller } from "../src/server/api/root";
import { createInnerTRPCContext } from "../src/server/api/trpc";
import {
  HexCoord,
  HexCoordSystem,
} from "../src/lib/domains/mapping/utils/hex-coordinates";
import type { AppRouter } from "../src/server/api/root";

async function buildHexMap(
  depth = 1,
  mapName = `Hex Map (Depth ${depth})`,
  description: string | null = "Auto-generated hex map",
) {
  // Ensure the map name is at least 3 characters long
  if (mapName && mapName.length < 3) {
    mapName = `Hex Map (Depth ${depth})`;
  }

  // Create TRPC context and caller
  const ctx = createInnerTRPCContext({ session: null });
  const caller = createCaller(ctx);

  console.log(`Creating map "${mapName}" with depth ${depth}...`);

  // Step 1: Create the map
  const map = await caller.map.create({
    name: mapName,
    description: description,
  });

  console.log(`Map created with ID: ${map.id}`);

  // Step 2: Get center coordinates
  const centerCoord = HexCoordSystem.getCenterCoord();

  // Add center item first
  // await addCenterItem(caller, map.id, centerCoord);

  // If depth > 0, add child items
  if (depth > 0) {
    await addNeighborsRecursively(caller, map.id, centerCoord, 1, depth);
  }

  console.log("Map structure completed successfully!");
  return map;
}

// Add the center item separately
async function addCenterItem(
  caller: ReturnType<typeof createCaller>,
  mapId: string,
  coord: HexCoord,
): Promise<void> {
  try {
    await caller.map.addItem({
      centerId: mapId,
      coords: coord,
      title: "Center",
      descr: `Center hex at ${HexCoordSystem.createId(coord)}`,
    });

    console.log(`Added center item at ${HexCoordSystem.createId(coord)}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Error adding center item at ${HexCoordSystem.createId(coord)}:`,
      errorMessage,
    );
    throw error; // Re-throw to stop execution if center can't be added
  }
}

// Recursively add neighbors with proper parent-child relationship
async function addNeighborsRecursively(
  caller: ReturnType<typeof createCaller>,
  mapId: string,
  parentCoord: HexCoord,
  currentDepth: number,
  maxDepth: number,
): Promise<void> {
  if (currentDepth > maxDepth) {
    return;
  }

  // Get child coordinates for this parent
  const childCoords = HexCoordSystem.getChildCoords(parentCoord);

  // Add each child with reference to parent
  for (const childCoord of childCoords) {
    try {
      const parentId = HexCoordSystem.createId(parentCoord);

      await caller.map.addItem({
        centerId: mapId,
        coords: childCoord,
        title: `Node at depth ${currentDepth}`,
        descr: `Hex item at ${HexCoordSystem.createId(childCoord)}`,
        // Add parent reference here if needed by your API
        //parentId: parentId
      });

      console.log(
        `Added item at ${HexCoordSystem.createId(childCoord)} (parent: ${parentId})`,
      );

      // Recursively add children for this node if we haven't reached max depth
      if (currentDepth < maxDepth) {
        await addNeighborsRecursively(
          caller,
          mapId,
          childCoord,
          currentDepth + 1,
          maxDepth,
        );
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Error adding item at ${HexCoordSystem.createId(childCoord)}:`,
        errorMessage,
      );
      // Continue with other children even if one fails
    }
  }
}

// Execute with command line arguments
async function main(): Promise<void> {
  // Parse arguments, skipping any "--" arguments that might be passed by npm scripts
  const args = process.argv.slice(2).filter((arg) => arg !== "--");

  // Parse depth - first argument that can be converted to a number
  let depth = 1;
  let mapName;
  let description;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg) {
      // Make sure arg is defined
      const parsed = parseInt(arg);
      if (!isNaN(parsed)) {
        depth = parsed;

        // If we found depth at position i, the rest are name and description
        if (i + 1 < args.length) mapName = args[i + 1];
        if (i + 2 < args.length) description = args[i + 2];

        break;
      }
    }
  }

  // If no valid depth found, check if the first argument could be a name
  if (depth === 1 && args.length > 0 && args[0] && isNaN(parseInt(args[0]))) {
    mapName = args[0];
    if (args.length > 1) description = args[1];
  }

  // Generate default name and description if not provided
  if (!mapName) mapName = `Hex Map (Depth ${depth})`;
  if (!description)
    description = `Auto-generated hex map with ${depth} levels of depth`;

  console.log(
    `Parameters: depth=${depth}, name="${mapName}", description="${description}"`,
  );

  try {
    const map = await buildHexMap(depth, mapName, description);
    console.log(`Map generation complete. Map ID: ${map.id}`);
  } catch (error: unknown) {
    console.error(
      "Error generating map:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
