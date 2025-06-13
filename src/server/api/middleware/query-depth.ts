import { TRPCError } from "@trpc/server";

interface QueryDepthConfig {
  maxDepth: number;
  costPerLevel?: number; // Optional: Calculate query cost
  maxCost?: number; // Optional: Max total cost
}

/**
 * Middleware to limit query depth for preventing expensive recursive queries
 */
export function createQueryDepthMiddleware(config: QueryDepthConfig) {
  return async ({ input, next }: { input: unknown; next: () => Promise<unknown> }) => {
    // Check if input contains depth parameter
    if (typeof input === "object" && input !== null && "depth" in input) {
      const depth = (input as { depth?: number }).depth;
      
      if (typeof depth === "number" && depth > config.maxDepth) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Query depth ${depth} exceeds maximum allowed depth of ${config.maxDepth}`,
        });
      }
      
      // Calculate query cost if configured
      if (config.costPerLevel && config.maxCost && typeof depth === "number") {
        const cost = depth * config.costPerLevel;
        if (cost > config.maxCost) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Query cost ${cost} exceeds maximum allowed cost of ${config.maxCost}`,
          });
        }
      }
    }
    
    return next();
  };
}

// Preset configurations
export const queryDepthLimits = {
  // Standard depth limit for tree queries
  standard: createQueryDepthMiddleware({
    maxDepth: 5,
  }),
  
  // Shallow queries only
  shallow: createQueryDepthMiddleware({
    maxDepth: 2,
  }),
  
  // Deep queries with cost calculation
  expensive: createQueryDepthMiddleware({
    maxDepth: 10,
    costPerLevel: 10,
    maxCost: 50,
  }),
};