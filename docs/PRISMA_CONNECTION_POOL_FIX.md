# Prisma Connection Pool Fix

## Problem

You're seeing errors like:
```
Timed out fetching a new connection from the connection pool. 
More info: http://pris.ly/d/connection-pool 
(Current connection pool timeout: 10, connection limit: 5)
```

This happens when multiple Prisma queries run in parallel and exhaust the connection pool.

## Solution

### 1. Update DATABASE_URL in `.env.local`

Add connection pool parameters to your `DATABASE_URL`:

**Before:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/payvost
```

**After:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/payvost?connection_limit=10&pool_timeout=20
```

**For Neon or other hosted databases (if URL already has parameters, use &):**
```bash
# If your URL already has ?sslmode=require, add &connection_limit=10&pool_timeout=20
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require&connection_limit=10&pool_timeout=20

# If your URL has no parameters, add ?connection_limit=10&pool_timeout=20
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?connection_limit=10&pool_timeout=20
```

### 2. Parameters Explained

- `connection_limit=10`: Maximum number of connections in the pool (default: 5, recommended: 10-20 for development)
- `pool_timeout=20`: Timeout in seconds to get a connection (default: 10, recommended: 20)

### 3. Code Changes

The route `/api/external-transactions/stats` has been optimized to use `$transaction`, which reuses connections more efficiently.

### 4. Restart Your Dev Server

After updating `.env.local`, restart your dev server:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Why This Happens

1. **Next.js Development Mode**: Hot reloading can create multiple Prisma client instances
2. **Parallel Queries**: Routes using `Promise.all` with multiple Prisma queries need multiple connections
3. **Default Pool Size**: Prisma's default pool size (5) is too small for development workloads

## Testing

After applying the fix, test the route:
```bash
curl http://localhost:3000/api/external-transactions/stats?userId=YOUR_USER_ID
```

You should no longer see connection pool timeout errors.

## Production

For production (Render/Vercel), ensure your `DATABASE_URL` also includes these parameters:
- `connection_limit=10` (or higher based on your needs)
- `pool_timeout=20`

See `docs/RENDER_ENVIRONMENT_VARIABLES.md` for production setup.

