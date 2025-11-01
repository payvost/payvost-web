// Local shim so TypeScript is happy; Prisma CLI only needs the returned object

// Centralize Prisma schema location so CLI commands work from repo root
// Note: Some Prisma versions don't export `defineConfig`; a plain object works.
export default {
  schema: './backend/prisma/schema.prisma',
} as const;
