# DDOS Protection Guide

## Current Vulnerabilities

1. **No Rate Limiting**: All API endpoints can be called unlimited times
2. **Public Endpoints**: Several expensive queries are publicly accessible
3. **No Query Complexity Limits**: Deep recursive queries can overwhelm the database
4. **No Caching**: Every request hits the database directly
5. **No Request Size Limits**: Large payloads can consume resources

## Immediate Recommendations

### 1. Enable Vercel's Built-in Protection
```bash
# In your Vercel dashboard:
# Settings > Security > Enable DDoS Protection
# Settings > Functions > Set concurrency limits
```

### 2. Add Rate Limiting Middleware
The rate limiting middleware has been created in `/src/server/api/middleware/rate-limit.ts`.

To use it, update your routers:

```typescript
// In map-items.ts
import { rateLimits } from "../middleware/rate-limit";

// Apply to public procedures
getRootItemById: publicProcedure
  .use(rateLimits.public)
  .input(z.object({ mapItemId: z.number() }))
  .query(async ({ ctx, input }) => {
    // ... existing code
  }),
```

### 3. Add Query Depth Limits
For endpoints that return hierarchical data:

```typescript
import { queryDepthLimits } from "../middleware/query-depth";

getDescendants: publicProcedure
  .use(rateLimits.public)
  .use(queryDepthLimits.standard)
  .input(z.object({ 
    itemId: z.number(),
    depth: z.number().min(1).max(5).optional().default(3)
  }))
  .query(async ({ ctx, input }) => {
    // Limit query depth in the service
  }),
```

### 4. Implement Caching

#### Option A: Vercel Edge Cache
```typescript
// In your API routes
export const runtime = 'edge';
export const revalidate = 60; // Cache for 60 seconds
```

#### Option B: Redis Cache (Recommended)
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// In your procedures
const cached = await redis.get(`item:${input.itemId}`);
if (cached) return cached;
```

### 5. Add Cloudflare Protection (Recommended)
1. Add your domain to Cloudflare
2. Enable "Under Attack Mode" during attacks
3. Set up rate limiting rules:
   - 50 requests per minute per IP for API endpoints
   - 10 requests per minute for mutations
4. Enable Bot Fight Mode

### 6. Database Connection Pooling
Update your database configuration:

```typescript
// In src/server/db/index.ts
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 7. Request Size Limits
Add to your Next.js config:

```javascript
// next.config.js
export default {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
```

### 8. Monitoring and Alerts
1. Set up Vercel Analytics to monitor traffic patterns
2. Use Sentry for error tracking
3. Set up alerts for:
   - High request rates
   - High error rates
   - Database connection issues

## Implementation Priority

1. **Immediate** (Do now):
   - Enable Vercel's DDoS protection
   - Add rate limiting to public endpoints
   - Set function concurrency limits

2. **High Priority** (Within 24 hours):
   - Implement caching for public queries
   - Add query depth limits
   - Set up Cloudflare

3. **Medium Priority** (Within a week):
   - Add Redis caching
   - Implement request size limits
   - Set up monitoring

4. **Future Enhancements**:
   - Move to edge functions for better performance
   - Implement CAPTCHA for suspicious traffic
   - Add IP allowlisting for admin functions

## Testing Your Protection

```bash
# Test rate limiting
for i in {1..100}; do
  curl -X POST https://your-app.vercel.app/api/trpc/map.items.getRootItemById \
    -H "Content-Type: application/json" \
    -d '{"json":{"mapItemId":1}}'
done

# You should see 429 errors after the rate limit is hit
```

## Emergency Response Plan

If under active DDOS attack:

1. Enable Cloudflare "Under Attack Mode"
2. Temporarily disable public endpoints
3. Scale down Vercel functions to minimum
4. Enable strict rate limiting
5. Block suspicious IPs in Cloudflare
6. Contact Vercel support if needed

## Cost Considerations

- Rate limiting in memory is free but not distributed
- Redis (Upstash) starts at $0.2 per 100k commands
- Cloudflare Pro ($20/month) provides better DDoS protection
- Vercel's DDoS protection is included in Pro plan