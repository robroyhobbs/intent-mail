import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: [
      "node_modules",
      ".next",
      // Pre-existing tests using custom runner (run with `npx tsx` directly)
      "src/lib/encryption.test.ts",
      "src/lib/ai/gemini.test.ts",
      "src/lib/ai/limits.test.ts",
      "src/lib/email/client-ai.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
