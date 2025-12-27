# Gateway Build Fix: Exclude Notification Processor

## Problem
The gateway build on Render was failing with:
```
services/notification-processor/src/index.ts(4,18): error TS2307: Cannot find module 'node-cron'
```

## Root Cause
- The backend `tsconfig.json` includes `"services/**/*"` in the compilation
- This includes the notification-processor service code
- The notification-processor has `node-cron` as a dependency
- But `node-cron` is only in the notification-processor's local `node_modules`
- It's NOT in the gateway's main `backend/node_modules`
- Result: TypeScript fails when compiling the notification-processor

## Solution
Added notification-processor to the `exclude` list in `backend/tsconfig.json`:

```jsonc
"exclude": [
  "node_modules",
  "dist",
  "services/pdf/**/*",
  "services/notification-processor/**/*"  // ← NEW
],
```

## Why This Works
- The notification-processor is a **standalone service**, not part of the gateway
- It has its own build process on Render with its own dependencies
- Similar to `services/pdf/**/*` which was already excluded
- Each service maintains its own dependency tree and builds independently

## File Changed
- `backend/tsconfig.json` - Added `services/notification-processor/**/*` to exclude list

## Result
✅ Gateway will no longer try to compile notification-processor  
✅ Each service builds independently  
✅ Render deployment should now succeed  

## Architecture
```
payvost-backend-gateway (Render)
├── Compiles: gateway, services/notification, services/invoice, etc.
├── Excludes: services/pdf/**, services/notification-processor/**
└── Uses: node_modules from backend/package.json

payvost-notification-processor (Render - separate service)
├── Compiles: notification-processor code only
├── Dependencies: node-cron, @prisma/client, mailgun.js, etc.
└── Uses: node_modules from notification-processor/package.json
```

Both services deploy independently and don't interfere with each other's builds.
