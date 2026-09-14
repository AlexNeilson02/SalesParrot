import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Resolve a relative sqlite `file:` DATABASE_URL against process.cwd() (the
// project root when running `next dev`/`next start`) instead of letting the
// bundled Prisma client try to derive a path from its own module location,
// which Turbopack/webpack bundling makes unreliable.
function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  if (url.startsWith("file:")) {
    const filePath = url.slice("file:".length);
    if (!path.isAbsolute(filePath)) {
      return `file:${path.join(/* turbopackIgnore: true */ process.cwd(), filePath)}`;
    }
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: resolveDatabaseUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
