// prisma.config.ts
import dotenv from "dotenv";
import path from "path";

// Load .env from backend folder only
dotenv.config({ path: path.resolve(__dirname, "backend/.env") });

export default {
  schema: "./backend/prisma/schema.prisma",
};
