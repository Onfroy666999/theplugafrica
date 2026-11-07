import path from "node:path";
import { defineConfig } from "vitest/config";

// End-to-end tests (issue #9): drive a production build over HTTP, with a real database and a stand-in email
// provider. Run `npm run build` first, then `npm run test:e2e`. See docs/TESTING.md.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["tests/e2e/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/e2e/setup.ts"],
    // One file at a time: they share the server, the database and the email inbox.
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
