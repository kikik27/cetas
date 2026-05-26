import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Used by Prisma Migrate (direct connection, not pooled)
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"]!,
  },
});
