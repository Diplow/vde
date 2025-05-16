# Project VDE

Project VDE is a knowledge platform that enables users to create, organize, and share ideas through interactive hexagonal maps. Think of it as a Wikipedia where each person maintains their own perspective, and trust emerges through references rather than centralized collaboration.

## Core Concept

VDE represents ideas as hexagonal tiles (HexTiles) in a spatial map:

- Each **HexTile** represents a single idea
- Ideas can be **expanded** into a region (one central tile + six surrounding tiles)
- **Collapsing** a region reduces it back to its central tile
- Each surrounding tile in a HexRegion can itself be expanded further, enabling recursive exploration of ideas with increasing depth and detail
- This structure enforces organizing thoughts into logical groups (maximum 6 directions)
- The hierarchy creates parent-child relationships between ideas

## Key Features

- **Personal Knowledge Spaces**: Each user has their own finite map to develop ideas
- **Idea Importing**: Reference or import tiles/regions from other users' maps
- **Trust Networks**: Trust is built through who references whose ideas, rather than collaborative editing
- **Hierarchical Context**: Quickly understand an idea by viewing its parent hierarchy
- **Perspective Representation**: The hexagonal structure reveals thinking patterns, strengths, and blind spots
- **Idea Metrics**: Track popularity, foundational value, expert adoption, and trends
- **Tagging System**: Each idea can have up to 6 tags plus author/date metadata
- **Multiple Navigation Views**: Browse by trending, foundational impact, or discussion activity

## Purpose

VDE aims to create a network of interconnected personal knowledge spaces where:

- Everyone can express their unique perspective
- Quality and trust emerge through references rather than centralized authority
- Ideas are structured in ways that reveal thinking patterns and relationships
- Users can follow thinkers they respect while building their own perspective
- The spatial organization provides context and reveals conceptual tensions

Each map serves as both a personal thinking tool and a public contribution to a broader knowledge ecosystem.

## Technologies

- [Next15](https://nextjs.org/) using [app router](https://nextjs.org/docs#app-router-and-pages-router)
- Typescript
- Tailwind
- Shadcn, radix-ui, storybook
- Drizzle
- Postgresql
