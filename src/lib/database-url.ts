import path from "node:path";

/**
 * Resolve a relative sqlite `file:` DATABASE_URL against the project root.
 *
 * Prisma resolves relative sqlite paths differently depending on who is
 * asking — the CLI uses the schema's directory, while the generated client
 * depends on its own module location, which bundlers rewrite. Handing Prisma
 * an absolute path sidesteps all of that so the CLI, the seed script and the
 * running app all open the same file.
 */
export function resolveDatabaseUrl(): string | undefined {
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
