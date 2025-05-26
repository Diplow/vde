import { MAPPING_ERRORS } from "../types/errors";

// Represents a direction from a parent hex to its child hexes
export enum HexDirection {
  Center = 0,
  NorthWest = 1,
  NorthEast = 2,
  East = 3,
  SouthEast = 4,
  SouthWest = 5,
  West = 6,
}

// Represents a hex's position in the hierarchy
export interface HexCoord {
  // Base grid position
  userId: number;
  groupId: number;
  // Array of directions taken from root hex to reach this hex
  // Empty for base grid hexes
  path: HexDirection[];
}

export class CoordSystem {
  static getCenterCoord(userId: number, groupId = 0): HexCoord {
    return {
      userId,
      groupId,
      path: [],
    };
  }

  static getScaleFromDepth(coordId: string, depth: number): number {
    const coord = CoordSystem.parseId(coordId);
    return depth - coord.path.length + 1;
  }

  static isCenter(coord: HexCoord): boolean {
    return coord.path.length === 0;
  }

  static isCenterId(id: string): boolean {
    // Center ID will not contain ':' if path is empty,
    // and path is the only part after ':'
    return !id.includes(":") || id.endsWith(":");
  }

  static getDepthFromId(id: string): number {
    const coord = CoordSystem.parseId(id);
    return coord.path.length;
  }

  static getSiblingsFromId(coordId: string): string[] {
    const parentId = CoordSystem.getParentCoordFromId(coordId);
    if (!parentId) {
      return []; // If there's no parent, there are no siblings
    }
    // Now parentId is guaranteed to be a string
    return CoordSystem.getChildCoordsFromId(parentId).filter(
      (c) => c !== coordId,
    );
  }

  static areCoordsEqual(coord1: HexCoord, coord2: HexCoord): boolean {
    return CoordSystem.createId(coord1) === CoordSystem.createId(coord2);
  }

  static getDirection(coord: HexCoord): HexDirection {
    return coord.path[coord.path.length - 1] ?? HexDirection.Center;
  }

  static createId(coord: HexCoord): string {
    const base = `${coord.userId},${coord.groupId}`;
    if (coord.path.length === 0) return base;
    return `${base}:${coord.path.join(",")}`;
  }

  static parseId(id: string): HexCoord {
    const parts = id.split(":");
    const basePart = parts[0];
    const pathPart = parts.length > 1 ? parts[1] : "";

    if (!basePart) throw new Error(MAPPING_ERRORS.INVALID_HEX_ID);

    const [userIdStr, groupIdStr] = basePart.split(",");
    const userId = parseInt(userIdStr ?? "0", 10);
    const groupId = parseInt(groupIdStr ?? "0", 10);

    if (isNaN(userId) || isNaN(groupId)) {
      throw new Error(
        MAPPING_ERRORS.INVALID_HEX_ID + " - Malformed userId or groupId",
      );
    }

    return {
      userId,
      groupId,
      path: pathPart ? (pathPart.split(",").map(Number) as HexDirection[]) : [],
    };
  }

  static getChildCoordsFromId(parentId: string) {
    const parentCoord = CoordSystem.parseId(parentId);
    return CoordSystem.getChildCoords(parentCoord).map((coord) =>
      CoordSystem.createId(coord),
    ) as [string, string, string, string, string, string];
  }

  static getChildCoords(parent: HexCoord) {
    return [
      // Surrounding children
      { ...parent, path: [...parent.path, HexDirection.NorthWest] },
      { ...parent, path: [...parent.path, HexDirection.NorthEast] },
      { ...parent, path: [...parent.path, HexDirection.East] },
      { ...parent, path: [...parent.path, HexDirection.SouthEast] },
      { ...parent, path: [...parent.path, HexDirection.SouthWest] },
      { ...parent, path: [...parent.path, HexDirection.West] },
    ] as [HexCoord, HexCoord, HexCoord, HexCoord, HexCoord, HexCoord];
  }

  static getParentCoordFromId(id: string): string | undefined {
    const coord = CoordSystem.parseId(id);
    const parent = CoordSystem.getParentCoord(coord);
    if (!parent) return undefined;
    return CoordSystem.createId(parent);
  }

  static getParentCoord(coord: HexCoord): HexCoord | null {
    if (coord.path.length === 0) return null;
    return {
      userId: coord.userId,
      groupId: coord.groupId,
      path: coord.path.slice(0, -1),
    };
  }

  static getZoomLevel(coord: HexCoord): number {
    return coord.path.length;
  }

  static getNeighborCoord(coord: HexCoord, direction: HexDirection): HexCoord {
    return {
      userId: coord.userId,
      groupId: coord.groupId,
      path: [...coord.path, direction],
    }; // Return neighbor on the same path level
  }

  static getHexSize(baseSize?: number): number {
    return baseSize ?? 120; // Use provided size or default to 120
  }

  static isAdjacent(coord1: HexCoord, coord2: HexCoord): boolean {
    // Check if two hexes share an edge
    if (coord1.path.length !== coord2.path.length) return false;
    if (coord1.userId !== coord2.userId || coord1.groupId !== coord2.groupId)
      return false;

    // Compare paths up to the last element
    for (let i = 0; i < coord1.path.length - 1; i++) {
      if (coord1.path[i] !== coord2.path[i]) return false;
    }

    // Get the last directions
    const dir1 = coord1.path[coord1.path.length - 1] ?? -1;
    const dir2 = coord2.path[coord2.path.length - 1] ?? -1;

    // Adjacent hexes will have complementary directions
    return (
      (dir1 === HexDirection.NorthWest && dir2 === HexDirection.SouthEast) ||
      (dir1 === HexDirection.NorthEast && dir2 === HexDirection.SouthWest) ||
      (dir1 === HexDirection.SouthEast && dir2 === HexDirection.NorthWest) ||
      (dir1 === HexDirection.SouthWest && dir2 === HexDirection.NorthEast) ||
      (dir1 === HexDirection.West && dir2 === HexDirection.East) ||
      (dir1 === HexDirection.East && dir2 === HexDirection.West)
    );
  }
}
