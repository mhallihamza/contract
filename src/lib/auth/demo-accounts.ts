/**
 * Demo credentials shared by the seed script and the sign-in demo bar (§51).
 *
 * This module is imported by a client component, so it must stay free of
 * server-only imports (node:crypto, Prisma, session helpers, ...). Password
 * hashing lives in `./password`, which is server-only.
 */
export const DEMO_PASSWORD = "Passw0rd!demo";

/** Seeded demo logins — keep in sync with `scripts/seed-data/users.ts`. */
export const DEMO_ACCOUNTS = {
  admin: "admin@morocco-legal-platform.test",
  lawyerA: "lawyer.a@morocco-legal-platform.test",
  lawyerB: "lawyer.b@morocco-legal-platform.test",
  lawyerC: "lawyer.c@morocco-legal-platform.test",
  client1: "client1@morocco-legal-platform.test",
  client2: "client2@morocco-legal-platform.test",
} as const;
