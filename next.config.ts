import path from "node:path";
import type { NextConfig } from "next";

/**
 * This project lives next to other Node projects, so Next.js would otherwise infer
 * the parent workspace as its root from an unrelated lockfile. Pinning the root here
 * keeps build tracing (and the Turbopack cache) inside this application.
 */
const projectRoot = path.resolve(process.cwd());

const nextConfig: NextConfig = {
  // Prisma must stay on the Node.js runtime (no Edge) — see src/lib/db/prisma.ts.
  serverExternalPackages: ["@prisma/client", "prisma"],
  outputFileTracingRoot: projectRoot,
  turbopack: { root: projectRoot },
  experimental: {
    serverActions: {
      // Client documents (PDF/images) are uploaded through a server action.
      bodySizeLimit: "12mb",
    },
  },
  async headers() {
    return [
      {
        // Baseline hardening for every response. A Content-Security-Policy is
        // deliberately absent: a strict CSP for Next.js needs a nonce-based
        // middleware and a full rendering pass — it is tracked in the
        // market-readiness report instead of being shipped half-verified.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
