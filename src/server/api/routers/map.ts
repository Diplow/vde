import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  mappingServiceMiddleware,
  protectedProcedure,
} from "~/server/api/trpc";
import { contractToApiAdapters } from "~/server/api/types/contracts";
import { HexCoord } from "~/lib/domains/mapping/utils/hex-coordinates";
import { TRPCError } from "@trpc/server";

export const mapRouter = createTRPCRouter({
  getOne: publicProcedure
    .use(mappingServiceMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const map = await ctx.mappingService.getOne(input.id.toString());
      return contractToApiAdapters.map(map);
    }),

  getMany: publicProcedure
    .use(mappingServiceMiddleware)
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional(),
          offset: z.number().min(0).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const maps = await ctx.mappingService.getMany(
        input?.limit,
        input?.offset,
      );
      return maps.map(contractToApiAdapters.map);
    }),

  getMyMaps: publicProcedure
    .use(mappingServiceMiddleware)
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const maps = await ctx.mappingService.getByOwnerId(
        "1",
        input.limit,
        input.offset,
      );
      return maps.map(contractToApiAdapters.map);
    }),

  create: publicProcedure
    .use(mappingServiceMiddleware)
    .input(
      z.object({
        name: z.string().min(3).max(100),
        description: z.string().max(500).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const map = await ctx.mappingService.create({
        title: input.name,
        descr: input.description ?? undefined,
        ownerId: "1",
      });
      return contractToApiAdapters.map(map);
    }),

  update: publicProcedure
    .use(mappingServiceMiddleware)
    .input(
      z.object({
        id: z.coerce.number(),
        data: z.object({
          name: z.string().min(3).max(100).optional(),
          description: z.string().max(500).nullable().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const map = await ctx.mappingService.update({
        mapId: input.id.toString(),
        title: input.data.name,
        descr: input.data.description ?? undefined,
      });
      return contractToApiAdapters.map(map);
    }),

  delete: publicProcedure
    .use(mappingServiceMiddleware)
    .input(z.object({ id: z.coerce.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.mappingService.remove(input.id.toString());
    }),

  // New endpoints for full MapService interface coverage

  addItem: publicProcedure
    .use(mappingServiceMiddleware)
    .input(
      z.object({
        centerId: z.string(),
        coords: z.object({
          row: z.number(),
          col: z.number(),
          path: z.array(z.number()),
        }),
        title: z.string().optional(),
        descr: z.string().optional(),
        url: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const mapItem = await ctx.mappingService.addItem({
        mapId: input.centerId,
        coords: input.coords as HexCoord,
        title: input.title,
        descr: input.descr,
        url: input.url,
      });
      return contractToApiAdapters.mapItem(mapItem);
    }),

  getItems: publicProcedure
    .use(mappingServiceMiddleware)
    .input(
      z.object({
        mapId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.mappingService.getItems({
        mapId: input.mapId,
      });
      return items.map(contractToApiAdapters.mapItem);
    }),

  removeItem: publicProcedure
    .use(mappingServiceMiddleware)
    .input(
      z.object({
        itemId: z.string(),
        mapId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.mappingService.removeItem({
        itemId: input.itemId,
        mapId: input.mapId,
      });
    }),

  updateItem: publicProcedure
    .use(mappingServiceMiddleware)
    .input(
      z.object({
        itemId: z.string(),
        mapId: z.string(),
        data: z.object({
          title: z.string().optional(),
          descr: z.string().optional(),
          color: z.string().optional(),
          url: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.mappingService.updateItem({
        itemId: input.itemId,
        mapId: input.mapId,
        title: input.data.title,
        descr: input.data.descr,
        color: input.data.color,
        url: input.data.url,
      });
      return contractToApiAdapters.mapItem(item);
    }),

  moveMapItem: publicProcedure
    .use(mappingServiceMiddleware)
    .input(
      z.object({
        mapId: z.string(),
        oldCoords: z.object({
          row: z.number(),
          col: z.number(),
          path: z.array(z.number()),
        }),
        newCoords: z.object({
          row: z.number(),
          col: z.number(),
          path: z.array(z.number()),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const map = await ctx.mappingService.moveMapItem({
        mapId: input.mapId,
        oldCoords: input.oldCoords as HexCoord,
        newCoords: input.newCoords as HexCoord,
      });
      return contractToApiAdapters.map(map);
    }),

  getDescendants: publicProcedure
    .use(mappingServiceMiddleware)
    .input(
      z.object({
        mapId: z.string(),
        itemId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const descendants = await ctx.mappingService.getDescendants({
        mapId: input.mapId,
        itemId: input.itemId,
      });
      return descendants.map(contractToApiAdapters.mapItem);
    }),

  createDefaultMapForCurrentUser: protectedProcedure
    .use(mappingServiceMiddleware)
    .input(z.void())
    .mutation(async ({ ctx }) => {
      if (!ctx.user) {
        // This should ideally not be reached due to protectedProcedure
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated in createDefaultMapForCurrentUser.",
        });
      }
      const user = ctx.user;
      const userName = user.name || user.email || "User";

      try {
        const map = await ctx.mappingService.create({
          title: `${userName}\'s Map`,
          ownerId: user.id,
        });
        return { success: true, mapId: map.id };
      } catch (error) {
        console.error("Error creating default map for user:", user.id, error);
        return { success: false, mapId: null, error: "Failed to create map" };
      }
    }),

  getUserMap: protectedProcedure
    .use(mappingServiceMiddleware)
    .input(z.void())
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        // This should ideally not be reached due to protectedProcedure
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated in getUserMap.",
        });
      }
      const user = ctx.user;
      try {
        const maps = await ctx.mappingService.getByOwnerId(user.id, 1, 0);

        if (maps && maps.length > 0) {
          const userMap = maps[0];
          if (userMap) {
            return {
              success: true,
              map: { id: userMap.id, name: userMap.title },
            };
          }
        }
        return { success: false, map: null };
      } catch (error) {
        console.error("Error fetching map for user:", user.id, error);
        return { success: false, map: null, error: "Failed to fetch user map" };
      }
    }),
});
