import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  privateProcedure,
  mapServiceMiddleware,
} from "~/server/api/trpc";

export const mapRouter = createTRPCRouter({
  getOne: publicProcedure
    .use(mapServiceMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.mapService.getOne(input.id);
    }),

  getMany: publicProcedure
    .use(mapServiceMiddleware)
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.mapService.getMany(input.limit, input.offset);
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
        name: z.string().min(1),
        description: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new Error("You must be logged in to create a map");
      }

      return await ctx.mapService.create(
        input.name,
        input.description ?? null,
        ctx.auth.userId,
      );
    }),

  update: privateProcedure
    .use(mapServiceMiddleware)
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new Error("You must be logged in to update a map");
      }

      // Get the map to check ownership
      const map = await ctx.mapService.getOne(input.id);

      // Check if the user is the owner of the map
      if (map.owner.id !== ctx.auth.userId) {
        throw new Error("You can only update maps that you created");
      }

      const { id, ...updateData } = input;
      return await ctx.mapService.update(id, updateData);
    }),

  delete: privateProcedure
    .use(mapServiceMiddleware)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new Error("You must be logged in to delete a map");
      }

      // Get the map to check ownership
      const map = await ctx.mapService.getOne(input.id);

      // Check if the user is the owner of the map
      if (map.owner.id !== ctx.auth.userId) {
        throw new Error("You can only delete maps that you created");
      }

      await ctx.mapService.remove(input.id);
      return { success: true };
    }),
});
