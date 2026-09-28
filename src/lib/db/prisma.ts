import { PrismaClient } from "@prisma/client";

/**
 * Prisma is the only database access layer (§4, §57).
 *
 * The client is created lazily so that pages can render a clearly-labelled
 * "database not configured" state instead of crashing when DATABASE_URL is
 * missing (the same convention the sibling workspace project uses).
 */
export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "DATABASE_URL is not configured. Copy .env.example to .env/.env.local and run `npm run db:deploy`.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new DatabaseNotConfiguredError();
  return new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/** True when a database connection string is present. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Returns the shared Prisma client, or throws DatabaseNotConfiguredError. */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createClient();
  return globalForPrisma.prisma;
}

/**
 * Convenience proxy so feature code can `import { db } from "@/lib/db/prisma"`
 * while still failing in a typed, catchable way when the database is absent.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrisma() as object, prop, receiver);
  },
});

export function isDatabaseNotConfiguredError(error: unknown): boolean {
  return error instanceof DatabaseNotConfiguredError;
}
