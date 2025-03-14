import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  privateProcedure,
  contentServiceMiddleware,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

// Validation schemas
const createContentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).nullable().optional(),
  youtubeVideoId: z.string().min(11).max(11),
  viewCount: z.number().nonnegative().default(0),
  author: z.object({
    id: z.string(),
    name: z.string().min(1),
    imageUrl: z.string().url().optional(),
    description: z.string().optional(),
    subscriberCount: z.number().nonnegative().optional(),
  }),
  mentionedEventIds: z.array(z.number()).optional().default([]),
});

const updateContentSchema = z.object({
  id: z.string(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  youtubeVideoId: z.string().min(11).max(11).optional(),
  viewCount: z.number().nonnegative().optional(),
});

export const contentRouter = createTRPCRouter({
  getOne: publicProcedure
    .use(contentServiceMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.contentService.getOne(input.id);
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Content with ID ${input.id} not found`,
          cause: error,
        });
      }
    }),

  getMany: publicProcedure
    .use(contentServiceMiddleware)
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.contentService.getMany(input.limit, input.offset);
    }),

  getByOwnerId: publicProcedure
    .use(contentServiceMiddleware)
    .input(
      z.object({
        ownerId: z.string(),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.contentService.getByOwnerId(
        input.ownerId,
        input.limit,
        input.offset,
      );
    }),

  getByAuthorId: publicProcedure
    .use(contentServiceMiddleware)
    .input(
      z.object({
        authorId: z.string(),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.contentService.getByAuthorId(
        input.authorId,
        input.limit,
        input.offset,
      );
    }),

  create: privateProcedure
    .use(contentServiceMiddleware)
    .input(createContentSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create content",
        });
      }

      try {
        return await ctx.contentService.create(
          input.title,
          input.description ?? null,
          input.youtubeVideoId,
          input.viewCount,
          input.author,
          ctx.auth.userId,
          ctx.dbUser?.firstName || "Unknown User",
          input.mentionedEventIds,
        );
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),

  update: privateProcedure
    .use(contentServiceMiddleware)
    .input(updateContentSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update content",
        });
      }

      try {
        // Get the content to check ownership
        const content = await ctx.contentService.getOne(input.id);

        // Check if the user is the owner of the content
        if (content.owner.id !== ctx.auth.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only update content that you own",
          });
        }

        const { id, ...updateData } = input;
        return await ctx.contentService.update(id, updateData);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        if (error instanceof Error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),

  delete: privateProcedure
    .use(contentServiceMiddleware)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to delete content",
        });
      }

      try {
        // Get the content to check ownership
        const content = await ctx.contentService.getOne(input.id);

        // Check if the user is the owner of the content
        if (content.owner.id !== ctx.auth.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete content that you own",
          });
        }

        await ctx.contentService.remove(input.id);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Content with ID ${input.id} not found or already deleted`,
          cause: error,
        });
      }
    }),

  addMentionedEvent: privateProcedure
    .use(contentServiceMiddleware)
    .input(
      z.object({
        contentId: z.string(),
        event: z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          date: z.string().datetime(),
          imageUrl: z.string().url().optional(),
          location: z.string().optional(),
          organizerId: z.string().optional(),
          sourceUrl: z.string().url().optional(),
          tags: z.array(z.string()).optional(),
          createdAt: z.string().datetime(),
          updatedAt: z.string().datetime(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to add a mentioned event",
        });
      }

      try {
        // Get the content to check ownership
        const content = await ctx.contentService.getOne(input.contentId);

        // Check if the user is the owner of the content
        if (content.owner.id !== ctx.auth.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only modify content that you own",
          });
        }

        // Ensure all optional fields are defined for EventContract
        const eventContract = {
          ...input.event,
          imageUrl: input.event.imageUrl || undefined,
          location: input.event.location || undefined,
          organizerId: input.event.organizerId || undefined,
          sourceUrl: input.event.sourceUrl || undefined,
          tags: input.event.tags || undefined,
        };

        await ctx.contentService.addMentionedEvent(
          input.contentId,
          eventContract,
        );
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Unknown error",
          cause: error,
        });
      }
    }),

  removeMentionedEvent: privateProcedure
    .use(contentServiceMiddleware)
    .input(
      z.object({
        contentId: z.string(),
        eventId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.auth || !ctx.auth.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to remove a mentioned event",
        });
      }

      try {
        // Get the content to check ownership
        const content = await ctx.contentService.getOne(input.contentId);

        // Check if the user is the owner of the content
        if (content.owner.id !== ctx.auth.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only modify content that you own",
          });
        }

        await ctx.contentService.removeMentionedEvent(
          input.contentId,
          input.eventId,
        );
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Unknown error",
          cause: error,
        });
      }
    }),
});
