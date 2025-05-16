# Hex Map Generator Script

This script generates a hexagonal map structure with a specified depth. It demonstrates the use of hexagonal coordinate systems and recursive map generation.

## Requirements

### Environment Variables

This script requires proper environment variables for database connection and other settings. Make sure your `.env` and `.env.local` files are correctly set up before running the script.

### Dependencies

Before running the script, install the dependencies:

```bash
# Using npm
npm install

# Using pnpm
pnpm install

# Using yarn
yarn
```

## TypeScript Version

The TypeScript version provides type safety and better IDE support:

```bash
# From project root
npm run map:build -- [depth] [mapName] [description]
```

## JavaScript Version

The JavaScript version can be run directly with Node:

```bash
# From project root
npm run map:build:js -- [depth] [mapName] [description]
```

## Parameters

The script now has enhanced argument handling:

- `depth`: A number indicating the depth of hex neighbors to generate (default: 1)
  - 0: Only the center hex
  - 1: Center hex + immediate neighbors
  - 2: Center hex + neighbors + neighbors of neighbors
  - etc.
- `mapName`: Name of the generated map (must be at least 3 characters long)
  - Default: "Hex Map (Depth X)", where X is the depth
- `description`: Description of the map
  - Default: "Auto-generated hex map with X levels of depth"

## Important Note on Argument Order

The script will search for the first numeric argument to use as depth. If you provide arguments:

```bash
npm run map:build -- 3 "My Map" "My Description"
```

It will use:

- 3 as depth
- "My Map" as name
- "My Description" as description

## Examples

```bash
# Generate a simple map with center and immediate neighbors
npm run map:build -- 1

# Generate a map with 3 levels of depth
npm run map:build -- 3 "Complex Hex Grid" "A demonstration of recursive hex mapping"

# Generate just a center hex
npm run map:build -- 0 "Single Hex"

# Providing a name without depth (uses default depth of 1)
npm run map:build -- "My Test Map" "Test description"
```

## Troubleshooting

If you encounter errors:

1. Make sure your database is properly initialized with `npm run init-db`
2. Verify your environment variables are correctly set in `.env` and `.env.local`
3. Check database connection parameters
4. Ensure map names are at least 3 characters long

## Warning

Be careful with high depth values! The number of hexes grows exponentially:

- Depth 0: 1 hex
- Depth 1: 7 hexes (1 center + 6 neighbors)
- Depth 2: 19 hexes (7 from depth 1 + 12 new neighbors)
- Depth 3: 37 hexes
- etc.

A depth of 4 or higher may generate a very large number of hexes and take a long time to complete.
