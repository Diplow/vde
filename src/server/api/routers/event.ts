import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  privateProcedure,
  eventServiceMiddleware,
} from "~/server/api/trpc";

export const eventRouter = createTRPCRouter({
  getOne: publicProcedure
    .use(eventServiceMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.eventService.getOne(input.id);
    }),

  getMany: publicProcedure
    .use(eventServiceMiddleware)
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.eventService.getMany(input.limit, input.offset);
    }),

  create: privateProcedure
    .use(eventServiceMiddleware)
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().nullable().optional(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new Error("You must be logged in to create an event");
      }

      return await ctx.eventService.create(
        input.title,
        input.description ?? null,
        input.startDate,
        input.endDate,
        ctx.auth.userId,
      );
    }),

  update: privateProcedure
    .use(eventServiceMiddleware)
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new Error("You must be logged in to update an event");
      }

      // Get the event to check ownership
      const event = await ctx.eventService.getOne(input.id);

      // Check if the user is the author of the event
      if (event.author.id !== ctx.auth.userId) {
        throw new Error("You can only update events that you created");
      }

      const { id, ...updateData } = input;
      return await ctx.eventService.update(id, updateData);
    }),

  delete: privateProcedure
    .use(eventServiceMiddleware)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new Error("You must be logged in to delete an event");
      }

      // Get the event to check ownership
      const event = await ctx.eventService.getOne(input.id);

      // Check if the user is the author of the event
      if (event.author.id !== ctx.auth.userId) {
        throw new Error("You can only delete events that you created");
      }

      await ctx.eventService.remove(input.id);
      return { success: true };
    }),
});
