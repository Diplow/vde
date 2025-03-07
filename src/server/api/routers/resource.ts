import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { resources } from "~/server/db/schema/resources";
import { eq } from "drizzle-orm";

export const resourceRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        url: z.string().url(),
        title: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(resources).values(input).returning();
    }),

  update: privateProcedure
    .input(
      z.object({
        id: z.number(),
        url: z.string().url().optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return ctx.db
        .update(resources)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(resources.id, id))
        .returning();
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .delete(resources)
        .where(eq(resources.id, input.id))
        .returning();
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.resources.findMany({
      orderBy: (resources, { desc }) => [desc(resources.createdAt)],
    });
  }),
});
