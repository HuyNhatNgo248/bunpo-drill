import { lingui, linguiTransformerBabelPreset } from "@lingui/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { cn } from "cn/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // Compiles app/lib/cn-tables.ts, the merge tables of `cn` (utils.ts), from the classes the app uses; dev rebuilds them on save.
    cn({ content: ["app/**/*.{ts,tsx}"], config: "app/lib/cn.config.ts", css: "app/tailwind.css", out: "app/lib/cn-tables.ts" }),
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
  server: {
    port: 3001,
    strictPort: true,
    allowedHosts: ["bunpo.huyngo248-dev.org"],
  },
});
