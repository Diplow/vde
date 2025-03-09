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
export interface HexCoordinate {
  // Base grid position
  row: number;
  col: number;
  // Array of directions taken from root hex to reach this hex
  // Empty for base grid hexes
  path: HexDirection[];
}

export class HexCoordinateSystem {
  static createId(coord: HexCoordinate): string {
    const basePath = `${coord.row},${coord.col}`;
    if (coord.path.length === 0) return basePath;
    return `${basePath}:${coord.path.join(",")}`;
  }

  static parseId(id: string): HexCoordinate {
    const [base, path] = id.split(":");
    if (!base) throw new Error("Invalid hex ID");

    const [row, col] = base.split(",").map(Number);
    if (row === undefined || col === undefined)
      throw new Error("Invalid hex ID");

    return {
      row,
      col,
      path: path ? (path.split(",").map(Number) as HexDirection[]) : [],
    };
  }

  static getChildCoordinates(parent: HexCoordinate): HexCoordinate[] {
    return [
      // Center hex keeps same base coordinates, adds Center to path
      { ...parent, path: [...parent.path, HexDirection.Center] },
      // Surrounding hexes
      { ...parent, path: [...parent.path, HexDirection.NorthWest] },
      { ...parent, path: [...parent.path, HexDirection.NorthEast] },
      { ...parent, path: [...parent.path, HexDirection.SouthEast] },
      { ...parent, path: [...parent.path, HexDirection.SouthWest] },
      { ...parent, path: [...parent.path, HexDirection.West] },
      { ...parent, path: [...parent.path, HexDirection.East] },
    ];
  }

  static getParentCoordinate(coord: HexCoordinate): HexCoordinate | null {
    if (coord.path.length === 0) return null;
    return {
      row: coord.row,
      col: coord.col,
      path: coord.path.slice(0, -1),
    };
  }

  static getZoomLevel(coord: HexCoordinate): number {
    return coord.path.length;
  }

  // Calculate actual position relative to parent hex
  static getRelativePosition(coord: HexCoordinate): { x: number; y: number } {
    const baseSize = 64;

    // Get base grid position
    let x = coord.col * 0.75 * baseSize;
    let y = coord.row * 0.65 * baseSize;

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
          y -= 0.65 * baseSize;
          x -= 0.375 * baseSize;
          break;
        case HexDirection.NorthEast:
          y -= 0.65 * baseSize;
          x += 0.375 * baseSize;
          break;
        case HexDirection.East:
          x += 0.75 * baseSize;
          break;
        case HexDirection.SouthEast:
          y += 0.65 * baseSize;
          x += 0.375 * baseSize;
          break;
        case HexDirection.SouthWest:
          y += 0.65 * baseSize;
          x -= 0.375 * baseSize;
          break;
        case HexDirection.West:
          x -= 0.75 * baseSize;
          break;
      }

      x = x + parentX;
      y = y + parentY;
    }

    return { x, y };
  }

  static getHexSize(): number {
    return 64; // Always return constant size
  }

  static isAdjacent(coord1: HexCoordinate, coord2: HexCoordinate): boolean {
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
