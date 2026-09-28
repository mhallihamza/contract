import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression guard for the sign-in crash where a client component imported
 * `@/lib/auth/password` (node:crypto + node:util) and Turbopack shipped the
 * module to the browser, throwing "The 'original' argument must be of type
 * Function" from `promisify(scrypt)`.
 */

const SRC_DIR = path.join(process.cwd(), "src");

/** Modules that must never be reachable from a client component. */
const SERVER_ONLY_SPECIFIERS = [
  "@/lib/auth/hash",
  "@/lib/auth/password",
  "@/lib/auth/session",
  "@/lib/db/prisma",
  "@/lib/documents/service",
  "@/lib/documents/storage",
  "@/lib/i18n/server",
  "@/lib/lawyers/assignment",
  "@/lib/notifications/service",
  "@/lib/payments/service",
  "@/lib/signatures/service",
];

const USE_CLIENT_DIRECTIVE =
  /^\s*(?:(?:\/\/[^\n]*\n)|(?:\/\*[\s\S]*?\*\/))*["']use client["']/;

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return listSourceFiles(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

function importedSpecifiers(source: string): string[] {
  return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]!);
}

describe("client/server boundary", () => {
  const files = listSourceFiles(SRC_DIR);

  it("scans the application source tree", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("never imports server-only modules from client components", () => {
    const violations: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      if (!USE_CLIENT_DIRECTIVE.test(source)) continue;

      for (const specifier of importedSpecifiers(source)) {
        if (specifier.startsWith("node:") || SERVER_ONLY_SPECIFIERS.includes(specifier)) {
          violations.push(`${path.relative(process.cwd(), file)} → ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps demo credentials in a client-safe module", () => {
    const demo = readFileSync(path.join(SRC_DIR, "lib", "auth", "demo-accounts.ts"), "utf8");

    expect(demo).toMatch(/export const DEMO_PASSWORD/);
    expect(demo).not.toMatch(/from\s+["']node:/);
    expect(demo).not.toMatch(/from\s+["']@\/lib\/(auth\/password|db\/|documents\/|i18n\/server)/);
    expect(demo).not.toMatch(/from\s+["']server-only["']/);
  });

  it("keeps the password hasher server-only for the app, importable for scripts", () => {
    const password = readFileSync(path.join(SRC_DIR, "lib", "auth", "password.ts"), "utf8");
    const hash = readFileSync(path.join(SRC_DIR, "lib", "auth", "hash.ts"), "utf8");

    expect(password).toMatch(/import\s+["']server-only["']/);
    expect(password).toMatch(/from\s+["']\.\/hash["']/);
    expect(password).not.toMatch(/export const DEMO_PASSWORD/);

    expect(hash).not.toMatch(/from\s+["']server-only["']/);
    expect(hash).toMatch(/export async function hashPassword/);
    expect(hash).toMatch(/export async function verifyPassword/);
  });
});
