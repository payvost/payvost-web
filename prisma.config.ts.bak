// prisma.config.ts
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load only backend/.env for Prisma operations to avoid conflicts
// Root .env is for frontend/Next.js, backend/.env is for backend/Prisma
const backendEnvPath = path.resolve(__dirname, "backend/.env");

// Load backend .env only (if it exists)
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}

export default {
  schema: "./backend/prisma/schema.prisma",
};
