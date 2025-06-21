import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  mappingServiceMiddleware,
} from "~/server/api/trpc";
import { contractToApiAdapters } from "~/server/api/types/contracts";
import {
  paginationSchema,
  userMapCreationSchema,
  userMapUpdateSchema,
  userMapIdentifierSchema,
} from "./map-schemas";
import {
  _getUserId,
  _getUserName,
  _createSuccessResponse,
  _createErrorResponse,
} from "./_map-auth-helpers";

export const mapUserRouter = createTRPCRouter({
  // Get all root items (user's "maps") for the current user
  getMyRootItems: protectedProcedure
    .use(mappingServiceMiddleware)
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const userId = await _getUserId(ctx.user);
      const maps = await ctx.mappingService.maps.getManyUserMaps(
        userId,
        input.limit,
        input.offset,
      );
      return maps.map(contractToApiAdapters.mapRootItem);
    }),

  // Create a new user map (root MapItem)
  createUserMap: protectedProcedure
    .use(mappingServiceMiddleware)
    .input(userMapCreationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = await _getUserId(ctx.user);
      const map = await ctx.mappingService.maps.createMap({
        userId,
        groupId: input.groupId,
        title: input.title,
        descr: input.descr,
      });
      return contractToApiAdapters.mapRootItem(map);
    }),

  // Update user map info (root MapItem's BaseItem)
  updateUserMapInfo: protectedProcedure
    .use(mappingServiceMiddleware)
    .input(userMapUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      await _getUserId(ctx.user); // Ensure authenticated
      const map = await ctx.mappingService.maps.updateMapInfo(input);
      if (!map) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Map not found",
        });
      }
      return contractToApiAdapters.mapRootItem(map);
    }),

  // Remove user map (root MapItem and descendants)
  removeUserMap: protectedProcedure
    .use(mappingServiceMiddleware)
    .input(userMapIdentifierSchema)
    .mutation(async ({ ctx, input }) => {
      await _getUserId(ctx.user); // Ensure authenticated
      await ctx.mappingService.maps.removeMap(input);
      return _createSuccessResponse() as { success: true };
    }),

  // Create default map for current user
  createDefaultMapForCurrentUser: protectedProcedure
    .use(mappingServiceMiddleware)
    .input(z.void())
    .mutation(async ({ ctx }) => {
      const userId = await _getUserId(ctx.user);
      const userName = _getUserName(ctx.user);

      try {
        const map = await ctx.mappingService.maps.createMap({
          userId,
          groupId: 0,
          title: userName,
          descr: "",
        });
        return _createSuccessResponse({ mapId: map.id });
      } catch (error) {
        console.error("Error creating default map for user:", userId, error);
        return _createErrorResponse("Failed to create map", { mapId: null });
      }
    }),

  // Get user map
  getUserMap: protectedProcedure
    .use(mappingServiceMiddleware)
    .input(z.void())
    .query(async ({ ctx }) => {
      const userId = await _getUserId(ctx.user);
      try {
        const maps = await ctx.mappingService.maps.getManyUserMaps(
          userId,
          1,
          0,
        );
        const userMap = maps[0];

        if (userMap) {
          return _createSuccessResponse({
            map: { id: userMap.id, name: userMap.title },
          });
        }
        return _createErrorResponse("No map found", { map: null });
      } catch (error) {
        console.error("Error fetching map for user:", userId, error);
        return _createErrorResponse("Failed to fetch user map", { map: null });
      }
    }),
    
  // Get current user's mapping ID
  getCurrentUserMappingId: protectedProcedure
    .query(async ({ ctx }) => {
      const mappingUserId = await _getUserId(ctx.user);
      return { mappingUserId };
    }),
});
