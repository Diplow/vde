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
  row: number;
  col: number;
  // Array of directions taken from root hex to reach this hex
  // Empty for base grid hexes
  path: HexDirection[];
}

export class HexCoordSystem {
  static getCenterCoord(): HexCoord {
    return {
      row: 0,
      col: 0,
      path: [],
    };
  }

  static getScaleFromDepth(coordId: string, depth: number): number {
    const coord = HexCoordSystem.parseId(coordId);
    return depth - coord.path.length + 1;
  }

  static isCenter(coord: HexCoord): boolean {
    return coord.path.length === 0;
  }

  static isCenterId(id: string): boolean {
    return id.indexOf(":") === -1;
  }

  static getDepthFromId(id: string): number {
    const coord = HexCoordSystem.parseId(id);
    return coord.path.length;
  }

  static getSiblingsFromId(coord: string): string[] {
    const parent = HexCoordSystem.getParentCoordFromId(coord);
    if (!parent) return [];
    return HexCoordSystem.getChildCoordsFromId(parent).filter(
      (c) => c !== coord,
    );
  }

  static areCoordsEqual(coord1: HexCoord, coord2: HexCoord): boolean {
    return HexCoordSystem.createId(coord1) === HexCoordSystem.createId(coord2);
  }

  static getDirection(coord: HexCoord): HexDirection {
    return coord.path[coord.path.length - 1] ?? HexDirection.Center;
  }

  static createId(coord: HexCoord): string {
    const basePath = `${coord.row},${coord.col}`;
    if (coord.path.length === 0) return basePath;
    return `${basePath}:${coord.path.join(",")}`;
  }

  static parseId(id: string): HexCoord {
    const [base, path] = id.split(":");
    if (!base) throw new Error(MAPPING_ERRORS.INVALID_HEX_ID);

    const [row, col] = base.split(",").map(Number);
    if (row === undefined || col === undefined)
      throw new Error(MAPPING_ERRORS.INVALID_HEX_ID);

    return {
      row,
      col,
      path: path ? (path.split(",").map(Number) as HexDirection[]) : [],
    };
  }

  static getChildCoordsFromId(parent: string) {
    const parentCoord = HexCoordSystem.parseId(parent);
    return HexCoordSystem.getChildCoords(parentCoord).map((coord) =>
      HexCoordSystem.createId(coord),
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
    const coord = HexCoordSystem.parseId(id);
    const parent = HexCoordSystem.getParentCoord(coord);
    if (!parent) return undefined;
    return HexCoordSystem.createId(parent);
  }

  static getParentCoord(coord: HexCoord): HexCoord | null {
    if (coord.path.length === 0) return null;
    return {
      row: coord.row,
      col: coord.col,
      path: coord.path.slice(0, -1),
    };
  }

  static getZoomLevel(coord: HexCoord): number {
    return coord.path.length;
  }

  static getNeighborCoord(coord: HexCoord, direction: HexDirection): HexCoord {
    return {
      row: coord.row,
      col: coord.col,
      path: [...coord.path, direction],
    }; // Return neighbor on the same path level
  }

  // Calculate actual position relative to parent hex
  static getRelativePosition(
    coord: HexCoord,
    baseSize?: number,
  ): { x: number; y: number } {
    const hexSize = HexCoordSystem.getHexSize(baseSize);

    // Get base grid position
    let x = coord.col * 0.75 * hexSize;
    let y = coord.row * 0.65 * hexSize;

    // Offset odd rows
    if (coord.row % 2) {
      x += 24;
    }

    // Track parent positions to center the view
    let parentX = x;
    let parentY = y;

    // For child hexes, translate to nearest grid positions
    if (coord.path.length > 0) {
      const lastDirection = coord.path[coord.path.length - 1];
      switch (lastDirection) {
        case HexDirection.Center:
          break;
        case HexDirection.NorthWest:
          y -= 0.65 * hexSize;
          x -= 0.375 * hexSize;
          break;
        case HexDirection.NorthEast:
          y -= 0.65 * hexSize;
          x += 0.375 * hexSize;
          break;
        case HexDirection.East:
          x += 0.75 * hexSize;
          break;
        case HexDirection.SouthEast:
          y += 0.65 * hexSize;
          x += 0.375 * hexSize;
          break;
        case HexDirection.SouthWest:
          y += 0.65 * hexSize;
          x -= 0.375 * hexSize;
          break;
        case HexDirection.West:
          x -= 0.75 * hexSize;
          break;
      }

      x = x + parentX;
      y = y + parentY;
    }

    return { x, y };
  }

  static getHexSize(baseSize?: number): number {
    return baseSize ?? 120; // Use provided size or default to 120
  }

  static isAdjacent(coord1: HexCoord, coord2: HexCoord): boolean {
    // Check if two hexes share an edge
    if (coord1.path.length !== coord2.path.length) return false;

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
