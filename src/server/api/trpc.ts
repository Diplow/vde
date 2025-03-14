/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";

import { db } from "~/server/db";
import { ClerkUserRepository } from "~/lib/infrastructure/actors/repositories/users";
import { users } from "~/server/db/schema/users";
import { eq } from "drizzle-orm";

import { UserService } from "~/lib/domains/actors/services";
import { MapDrizzlePostgresRepository } from "~/lib/infrastructure/mapping/repositories/map-drizzle-postgres-repository";
import { MapService } from "~/lib/domains/mapping/services/map-service";
import { EventDrizzlePostgresRepository } from "~/lib/infrastructure/politics/repositories/event-drizzle-postgres-repository";
import { EventService } from "~/lib/domains/politics/services";
import { ContentDrizzlePostgresRepository } from "~/lib/infrastructure/ideas/repositories";
import { ContentService } from "~/lib/domains/ideas/services";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const authData = await auth();
  let dbUser = null;

  // If user is authenticated with Clerk
  if (authData?.userId) {
    // Try to find the user in the database
    dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, authData.userId),
    });

    // If user doesn't exist in the database, create them
    if (!dbUser && authData.userId) {
      try {
        // Get user details from Clerk
        const clerk = await import("@clerk/nextjs/server").then(
          (mod) => mod.clerkClient,
        );
        const clerkInstance = await clerk();
        const clerkUser = await clerkInstance.users.getUser(authData.userId);

        // Insert the user into the database
        const [newUser] = await db
          .insert(users)
          .values({
            clerkId: authData.userId,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        dbUser = newUser;
        console.log(
          `Created new user in database for Clerk ID: ${authData.userId}`,
        );
      } catch (error) {
        console.error("Error creating user in database:", error);
      }
    }
  }

  return {
    db,
    headers: opts.headers,
    auth: authData,
    dbUser,
  };
};

/**
 * Inner context creator useful for testing - accepts db directly
 */
export const createInnerTRPCContext = (opts: { db: typeof db }) => {
  return {
    db: opts.db,
    headers: new Headers(),
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);
/**
 * Protected (authenticated) procedure
 *
 * This procedure ensures that the user is authenticated before executing.
 * If the user is not authenticated, it will throw an unauthorized error.
 */
export const privateProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.auth?.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }
    return next({
      ctx: {
        ...ctx,
        auth: {
          ...ctx.auth,
          userId: ctx.auth.userId,
        },
      },
    });
  });

// Service middlewares
export const mapServiceMiddleware = t.middleware(async ({ ctx, next }) => {
  // Create a new context with the map service
  const db = ctx.db;
  const repository = MapDrizzlePostgresRepository(db);
  const mapService = new MapService(repository);

  return next({
    ctx: {
      ...ctx,
      mapService,
    },
  });
});

export const userServiceMiddleware = t.middleware(({ ctx, next }) =>
  next({
    ctx: {
      ...ctx,
      userService: new UserService(ClerkUserRepository()),
    },
  }),
);

export const eventServiceMiddleware = t.middleware(({ ctx, next }) =>
  next({
    ctx: {
      ...ctx,
      eventService: new EventService(EventDrizzlePostgresRepository(ctx.db)),
    },
  }),
);

export const contentServiceMiddleware = t.middleware(({ ctx, next }) =>
  next({
    ctx: {
      ...ctx,
      contentService: new ContentService(
        ContentDrizzlePostgresRepository(ctx.db),
      ),
    },
  }),
);
