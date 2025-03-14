import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  mapServiceMiddleware,
} from "~/server/api/trpc";

// Create a schema for HexCoordinate
const hexCoordinateSchema = z.object({
  row: z.number(),
  col: z.number(),
  path: z.array(z.number()),
});

// Create a schema for item types
const itemTypeSchema = z.enum(["resource", "event", "content", "author"]);

export const mapItemsRouter = createTRPCRouter({
  /**
   * Get all items for a map
   */
  getMapItems: privateProcedure
    .use(mapServiceMiddleware)
    .input(z.object({ mapId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.mapService.getMapItems(input.mapId);
    }),

  /**
   * Get detailed item information for a map
   */
  getMapItemsWithDetails: privateProcedure
    .use(mapServiceMiddleware)
    .input(z.object({ mapId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.mapService.getMapItemsWithDetails(input.mapId);
    }),

  /**
   * Add an item to a map
   */
  addItemToMap: privateProcedure
    .use(mapServiceMiddleware)
    .input(
      z.object({
        mapId: z.string(),
        itemId: z.number(),
        itemType: itemTypeSchema,
        coordinates: hexCoordinateSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new Error("You must be logged in to add items to a map");
      }

      // Get the map to check ownership
      const map = await ctx.mapService.getOne(input.mapId);

      // Check if the user is the owner of the map
      if (map.owner.id !== ctx.auth.userId) {
        throw new Error("You don't have permission to modify this map");
      }

      return await ctx.mapService.addItemToMap(
        input.mapId,
        input.itemId,
        input.itemType,
        input.coordinates,
      );
    }),

  /**
   * Remove an item from a map
   */
  removeItemFromMap: privateProcedure
    .use(mapServiceMiddleware)
    .input(
      z.object({
        mapId: z.string(),
        itemId: z.number(),
        itemType: itemTypeSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new Error("You must be logged in to remove items from a map");
      }

      // Get the map to check ownership
      const map = await ctx.mapService.getOne(input.mapId);

      // Check if the user is the owner of the map
      if (map.owner.id !== ctx.auth.userId) {
        throw new Error("You don't have permission to modify this map");
      }

      await ctx.mapService.removeItemFromMap(
        input.mapId,
        input.itemId,
        input.itemType,
      );
      return { success: true };
    }),
});
