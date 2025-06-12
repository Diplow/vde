#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  mapItemsListHandler,
  mapItemHandler,
  getUserMapItemsHandler,
} from "./services/map-items";

// Create MCP server instance
const server = new Server(
  {
    name: "hexframe-mcp-server",
    version: "1.0.0",
    description: "Hexframe MCP Server - Access hierarchical knowledge maps",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

// List resources handler
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "map://items/{rootId}",
        name: "Map Items Hierarchy",
        description: "Get hierarchical structure of map items from a root. Replace {rootId} with a coordinate ID like '1,0' or '1,0:1,2,3'",
        mimeType: "application/json",
      },
      {
        uri: "map://item/{itemId}",
        name: "Single Map Item",
        description: "Get a single map item with context. Replace {itemId} with a coordinate ID",
        mimeType: "application/json",
      },
    ],
  };
});

// Read resource handler
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uriString = request.params.uri;
  const uri = new URL(uriString);

  if (uri.protocol === "map:") {
    // For map://items/1,0 - hostname is "items", pathname is "/1,0"
    if (uri.hostname === "items") {
      const rootId = uri.pathname.slice(1); // Remove leading "/"
      return mapItemsListHandler(uri, rootId);
    } else if (uri.hostname === "item") {
      const itemId = uri.pathname.slice(1); // Remove leading "/"
      return mapItemHandler(uri, itemId);
    }
  }

  throw new Error(`Unknown resource: ${uriString}`);
});

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "getUserMapItems",
        description: "Get all map items for a specific user, starting from their root map",
        inputSchema: {
          type: "object",
          properties: {
            userId: {
              type: "number",
              description: "The user ID to fetch map items for",
            },
            groupId: {
              type: "number",
              description: "The group ID (default: 0)",
              default: 0,
            },
            depth: {
              type: "number",
              description: "How many levels deep to fetch (default: 3, max: 10)",
              default: 3,
              minimum: 1,
              maximum: 10,
            },
          },
          required: ["userId"],
        },
      },
    ],
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "getUserMapItems") {
    const userId = args.userId as number;
    const groupId = (args.groupId as number) ?? 0;
    const depth = (args.depth as number) ?? 3;

    try {
      const result = await getUserMapItemsHandler(userId, groupId, depth);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start the server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log to stderr so it doesn't interfere with protocol messages
  console.error("Hexframe MCP Server running on stdio transport");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});