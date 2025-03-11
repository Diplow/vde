import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  privateProcedure,
  mapServiceMiddleware,
} from "~/server/api/trpc";

// Input validation schemas
const dimensionsSchema = z.object({
  rows: z.number().min(1).max(100).optional(),
  columns: z.number().min(1).max(100).optional(),
  baseSize: z.number().min(10).max(200).optional(),
});

export const mapRouter = createTRPCRouter({
  getOne: publicProcedure
    .use(mapServiceMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.mapService.getOne(input.id.toString());
    }),

  getMany: publicProcedure
    .use(mapServiceMiddleware)
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional(),
          offset: z.number().min(0).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.mapService.getMany(input?.limit, input?.offset);
    }),

  getMyMaps: privateProcedure
    .use(mapServiceMiddleware)
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new Error("You must be logged in to view your maps");
      }

      return await ctx.mapService.getByOwnerId(
        ctx.auth.userId,
        input.limit,
        input.offset,
      );
    }),

  create: privateProcedure
    .use(mapServiceMiddleware)
    .input(
      z.object({
        name: z.string().min(3).max(100),
        description: z.string().max(500).nullable(),
        dimensions: dimensionsSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new Error("You must be logged in to create a map");
      }

      return await ctx.mapService.create(
        input.name,
        input.description,
        ctx.auth.userId,
        input.dimensions,
      );
    }),

  update: privateProcedure
    .use(mapServiceMiddleware)
    .input(
      z.object({
        id: z.coerce.number(),
        data: z.object({
          name: z.string().min(3).max(100).optional(),
          description: z.string().max(500).nullable().optional(),
          rows: z.number().min(1).max(100).optional(),
          columns: z.number().min(1).max(100).optional(),
          baseSize: z.number().min(10).max(200).optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new Error("You must be logged in to update a map");
      }

      // Get the map to check ownership
      const map = await ctx.mapService.getOne(input.id.toString());

      // Check if the user is the owner of the map
      if (map.owner.id !== ctx.auth.userId) {
        throw new Error("You don't have permission to update this map");
      }

      return await ctx.mapService.update(input.id.toString(), input.data);
    }),

  delete: privateProcedure
    .use(mapServiceMiddleware)
    .input(z.object({ id: z.coerce.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new Error("You must be logged in to delete a map");
      }

      // Get the map to check ownership
      const map = await ctx.mapService.getOne(input.id.toString());

      // Check if the user is the owner of the map
      if (map.owner.id !== ctx.auth.userId) {
        throw new Error("You don't have permission to delete this map");
      }

      await ctx.mapService.remove(input.id.toString());
      return { success: true };
    }),
});
