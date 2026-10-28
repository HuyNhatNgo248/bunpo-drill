import { fileURLToPath } from "node:url";
import { lingui, linguiTransformerBabelPreset } from "@lingui/vite-plugin";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vitest/config";

// A standalone Vitest config, separate from vite.config.ts on purpose: the React Router plugin
// builds the app and must not run under the tests. Only the `~` alias stays, so app imports resolve.
export default defineConfig({
  // The two Lingui transforms of vite.config.ts: lingui() compiles the .po catalogs, babel expands the macros.
  plugins: [lingui(), babel({ presets: [linguiTransformerBabelPreset()] })],
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
