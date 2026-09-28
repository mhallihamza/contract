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
};

export default nextConfig;
