import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Prefer backend-specific env files so Prisma CLI doesn't pick up frontend vars.
const backendEnvLocal = path.resolve(__dirname, "backend/.env.local");
const backendEnv = path.resolve(__dirname, "backend/.env");

// Load .env.local first (higher priority), then fall back to .env
if (fs.existsSync(backendEnvLocal)) {
  dotenv.config({ path: backendEnvLocal });
}

if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
}

export default {
  schema: "./backend/prisma/schema.prisma",
};
