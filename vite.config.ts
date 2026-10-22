import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  // The jlpt-grammar-quiz skill posts to this port, so fail loudly instead of picking another.
  server: {
    port: 3000,
    strictPort: true,
  },
});
