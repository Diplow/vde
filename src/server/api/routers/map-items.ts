import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  mappingServiceMiddleware,
} from "~/server/api/trpc";
import { contractToApiAdapters } from "~/server/api/types/contracts";
import { type HexCoord } from "~/lib/domains/mapping/utils/hex-coordinates";
import {
  hexCoordSchema,
  itemCreationSchema,
  itemUpdateSchema,
  itemMovementSchema,
} from "./map-schemas";
import { _createSuccessResponse } from "./_map-auth-helpers";

export const mapItemsRouter = createTRPCRouter({
  // Get root MapItem by ID
  getRootItemById: publicProcedure
    .use(mappingServiceMiddleware)
    .input(z.object({ mapItemId: z.number() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.mappingService.items.query.getItemById({
        itemId: input.mapItemId,
      });
      return contractToApiAdapters.mapItem(item);
    }),

  // Get item by coordinates
  getItemByCoords: publicProcedure
    .use(mappingServiceMiddleware)
    .input(z.object({ coords: hexCoordSchema }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.mappingService.items.crud.getItem({
        coords: input.coords as HexCoord,
      });
      return contractToApiAdapters.mapItem(item);
    }),

  // Get all items for a root item (was getItems)
  getItemsForRootItem: publicProcedure
    .use(mappingServiceMiddleware)
    .input(
      z.object({
        userId: z.number(),
        groupId: z.number().optional().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.mappingService.items.query.getItems({
        userId: input.userId,
        groupId: input.groupId,
      });
      return items.map(contractToApiAdapters.mapItem);
    }),

  // Add item to map
  addItem: publicProcedure
    .use(mappingServiceMiddleware)
    .input(itemCreationSchema)
    .mutation(async ({ ctx, input }) => {
      const mapItem = await ctx.mappingService.items.crud.addItemToMap({
        parentId: input.parentId,
        coords: input.coords as HexCoord,
        title: input.title,
        descr: input.descr,
        url: input.url,
      });
      return contractToApiAdapters.mapItem(mapItem);
    }),

  // Remove item
  removeItem: publicProcedure
    .use(mappingServiceMiddleware)
    .input(z.object({ coords: hexCoordSchema }))
    .mutation(async ({ ctx, input }) => {
      await ctx.mappingService.items.crud.removeItem({
        coords: input.coords as HexCoord,
      });
      return _createSuccessResponse() as { success: true };
    }),

  // Update item
  updateItem: publicProcedure
    .use(mappingServiceMiddleware)
    .input(itemUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.mappingService.items.crud.updateItem({
        coords: input.coords as HexCoord,
        title: input.data.title,
        descr: input.data.descr,
        url: input.data.url,
      });
      return contractToApiAdapters.mapItem(item);
    }),

  // Move map item
  moveMapItem: publicProcedure
    .use(mappingServiceMiddleware)
    .input(itemMovementSchema)
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.mappingService.items.query.moveMapItem({
        oldCoords: input.oldCoords as HexCoord,
        newCoords: input.newCoords as HexCoord,
      });
      return contractToApiAdapters.mapItem(item);
    }),

  // Get descendants
  getDescendants: publicProcedure
    .use(mappingServiceMiddleware)
    .input(z.object({ itemId: z.number() }))
    .query(async ({ ctx, input }) => {
      const descendants = await ctx.mappingService.items.query.getDescendants({
        itemId: input.itemId,
      });
      return descendants.map(contractToApiAdapters.mapItem);
    }),
});
