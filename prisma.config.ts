// Local shim so TypeScript is happy; Prisma CLI only needs the returned object
const defineConfig = <T>(config: T) => config;

// Centralize Prisma schema location so CLI commands work from repo root
export default defineConfig({
  schema: './backend/prisma/schema.prisma',
});
