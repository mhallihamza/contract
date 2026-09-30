import { defineConfig } from "vitest/config";
import path from "node:path";

// Depending on the Vite config loader the file is evaluated as CommonJS or as
// ESM, and `__dirname` only exists in the first one. Every npm script runs from
// the project root, so the alias is derived from the working directory.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
});
