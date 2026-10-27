import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  // The server build starts at server/app.ts, which server.ts runs (the port is set there).
  environments: {
    ssr: { build: { rollupOptions: { input: "./server/app.ts" } } },
  },
});
