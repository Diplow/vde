import { TRPCError } from "@trpc/server";
import { type Context } from "../trpc";

// Helper to extract client IP from various headers
function getClientIp(ctx: Context): string | null {
  const headers = ctx.req?.headers;
  if (!headers) return null;
  
  // Check various headers that might contain the client IP
  const forwardedFor = headers["x-forwarded-for"];
  if (forwardedFor) {
    // x-forwarded-for can be comma-separated list, take the first one
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips?.split(',')[0]?.trim() ?? null;
  }
  
  const realIp = headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? (realIp[0] ?? null) : realIp;
  }
  
  // Vercel-specific headers
  const vercelIp = headers["x-vercel-forwarded-for"];
  if (vercelIp) {
    return Array.isArray(vercelIp) ? (vercelIp[0] ?? null) : vercelIp;
  }
  
  return null;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  keyGenerator?: (ctx: Context) => string; // Custom key generator
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async ({ ctx, next }: { ctx: Context; next: () => Promise<unknown> }) => {
    // Generate rate limit key
    const key = config.keyGenerator
      ? config.keyGenerator(ctx)
      : getClientIp(ctx) ?? "anonymous";

    const now = Date.now();
    const resetTime = now + config.windowMs;

    // Get or create rate limit entry
    let rateLimit = rateLimitStore.get(key);
    
    if (!rateLimit || rateLimit.resetTime < now) {
      rateLimit = { count: 0, resetTime };
      rateLimitStore.set(key, rateLimit);
    }

    // Check if rate limit exceeded
    if (rateLimit.count >= config.maxRequests) {
      const retryAfter = Math.ceil((rateLimit.resetTime - now) / 1000);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      });
    }

    // Increment counter if not skipping successful requests
    if (!config.skipSuccessfulRequests) {
      rateLimit.count++;
    }

    try {
      const result = await next();
      
      // Increment counter after successful request if configured
      if (config.skipSuccessfulRequests) {
        rateLimit.count++;
      }
      
      return result;
    } catch (error) {
      // Don't count failed requests against rate limit
      if (!config.skipSuccessfulRequests) {
        rateLimit.count--;
      }
      throw error;
    }
  };
}

// Preset configurations
export const rateLimits = {
  // Strict limit for public endpoints
  public: createRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  }),
  
  // More lenient for authenticated users
  authenticated: createRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    keyGenerator: (ctx) => ctx.user?.id ?? "anonymous",
  }),
  
  // Very strict for expensive operations
  expensive: createRateLimitMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10, // 10 requests per 5 minutes
  }),
  
  // Custom rate limit for mutations
  mutation: createRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 mutations per minute
    keyGenerator: (ctx) => ctx.user?.id ?? "anonymous",
  }),
};