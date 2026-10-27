import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// A standalone Vitest config, separate from vite.config.ts on purpose: the React Router plugin
// builds the app and must not run under the tests. Only the `~` alias stays, so app imports resolve.
export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./app", import.meta.url)),
    },
  },
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    projects: [
      {
        // happy-dom gives the components a DOM.
        extends: true,
        test: { name: "components", environment: "happy-dom", include: ["app/components/**/*.test.{ts,tsx}"] },
      },
      {
        // Node, not happy-dom: a happy-dom Response follows the browser and hides Set-Cookie,
        // so the login cookie of auth.server.ts and the routes would not reach the tests.
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: ["app/**/*.test.ts"],
          exclude: ["app/components/**"],
        },
      },
    ],
  },
});
