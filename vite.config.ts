import { lingui, linguiTransformerBabelPreset } from "@lingui/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    lingui(),
    // Expands the @lingui macros. React Router's plugin runs no Babel, so a <Trans> would reach the bundle unexpanded.
    babel({ presets: [linguiTransformerBabelPreset()] }),
    reactRouter(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  // The server build starts at server/app.ts, which server.ts runs (the port is set there).
  environments: {
    ssr: { build: { rollupOptions: { input: "./server/app.ts" } } },
  },
  // The server build bundles its dependencies, so it loads only the code it uses (a few lucide icons, not all 4,000):
  // on the host's 0.1 vCPU that loading was most of the first request after a deploy. libSQL loads a native module,
  // and server.ts runs Express from node_modules too, so those stay outside. Dev keeps them external: its module
  // runner can't evaluate CommonJS packages such as React.
  ssr: command === "build" ? { noExternal: true, external: ["@libsql/client", "libsql", "express"] } : undefined,
  server: {
    port: 3001,
    strictPort: true,
    allowedHosts: ["bunpo.huyngo248-dev.org"],
  },
}));
