import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { mapRouter } from "~/server/api/routers/map";
import { eventRouter } from "~/server/api/routers/event";
import { mapItemsRouter } from "~/server/api/routers/map-items";
import { contentRouter } from "~/server/api/routers/content";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  map: mapRouter,
  event: eventRouter,
  mapItems: mapItemsRouter,
  content: contentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.resource.all();
 *       ^? Resource[]
 */
export const createCaller = createCallerFactory(appRouter);
