// prisma.config.ts
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load .env from root first, then backend (root takes precedence)
// This allows shared variables in root .env and service-specific in backend/.env
const rootEnvPath = path.resolve(__dirname, ".env");
const backendEnvPath = path.resolve(__dirname, "backend/.env");

// Load backend .env first (if it exists)
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}

// Load root .env second (will override backend vars - root takes precedence)
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: true });
}

export default {
  schema: "./backend/prisma/schema.prisma",
};
