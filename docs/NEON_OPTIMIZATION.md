# Neon Database Optimization Guide

## Current Setup

We're using the `postgres` driver with Neon-optimized settings for serverless environments. This approach maintains type compatibility while providing better performance.

## Optimizations Applied

### 1. Connection Pool Settings
```typescript
max: isProduction ? 1 : 10  // Single connection in production
```
- Serverless functions should use minimal connections
- Prevents connection pool exhaustion

### 2. Idle Timeout
```typescript
idle_timeout: isProduction ? 20 : undefined
```
- Closes idle connections after 20 seconds
- Reduces connection overhead in serverless

### 3. Connection Timeout
```typescript
connect_timeout: 10  // 10 seconds
```
- Fast timeout suitable for serverless
- Fails fast if database is unreachable

### 4. Prepared Statements
```typescript
prepare: !isProduction
```
- Disabled in production for better connection pooling
- Neon's recommendation for serverless environments

### 5. SSL Requirement
```typescript
ssl: isProduction ? 'require' : false
```
- SSL is mandatory for Neon in production
- Ensures secure connections

## Environment Variables

Make sure your `DATABASE_URL` includes proper parameters:
```
postgresql://user:pass@host.neon.tech/dbname?sslmode=require
```

## Neon-Specific Features

### 1. Branching for Preview Deployments

Create a database branch for each PR:

```typescript
// In your CI/CD pipeline
const branch = await neon.createBranch({
  projectId: 'your-project-id',
  branchName: `pr-${prNumber}`,
  parentId: 'main'
});
```

### 2. Connection Pooling

For transactions or long operations:

```typescript
import { getPooledConnection } from "~/server/db";

const pooledDb = await getPooledConnection();
await pooledDb.transaction(async (tx) => {
  // Your transaction logic
});
```

### 3. Query Optimization

Neon supports these PostgreSQL extensions:
- `pg_stat_statements` - Query performance monitoring
- `pgvector` - Vector similarity search
- `postgis` - Geospatial data

Enable in Neon console under Extensions.

### 4. Auto-suspend

Neon automatically suspends inactive databases. First query after suspension takes ~1s longer.

To prevent this in production:
- Set up a cron job to ping the database
- Or upgrade to Neon Pro for always-on databases

## Performance Tips

1. **Use prepared statements**:
   ```typescript
   const prepared = db
     .select()
     .from(users)
     .where(eq(users.id, sql.placeholder('id')))
     .prepare();
   
   const result = await prepared.execute({ id: 123 });
   ```

2. **Batch operations**:
   ```typescript
   // Instead of multiple queries
   await db.insert(items).values([...manyItems]);
   ```

3. **Use indexes**:
   ```sql
   CREATE INDEX idx_user_email ON users(email);
   CREATE INDEX idx_items_owner ON items(owner_id);
   ```

4. **Connection string optimization**:
   ```
   ?sslmode=require&connect_timeout=10&tcp_keepalives_idle=30
   ```

## Monitoring

1. **Neon Console**: Monitor query performance, storage, compute usage
2. **Vercel Analytics**: Track function duration and database query time
3. **Custom logging**:
   ```typescript
   db.$client.on('query', (e) => {
     console.log('Query:', e.query, 'Duration:', e.duration);
   });
   ```

## Cost Optimization

1. **Use appropriate compute size**: Start with 0.25 vCPU
2. **Enable auto-suspend**: Saves costs during low traffic
3. **Archive old data**: Use Neon's branching to archive
4. **Monitor storage**: Neon charges for storage over free tier

## Common Issues

### "Too many connections"
- Use HTTP mode (default in our setup)
- Don't create new clients per request

### "SSL required"
- Always include `?sslmode=require` in connection string

### "Connection timeout"
- Increase timeout: `?connect_timeout=30`
- Check Vercel function timeout matches

### "Cold start slowness"
- Normal for first request after auto-suspend
- Consider Neon Pro for production