import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

import pkg from "./package.json" with { type: "json" };

export default defineConfig(async () => ({
  server: {
    host: "0.0.0.0", // Expose to the network
    watch: {
      usePolling: true, // Force polling for file changes
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __VERSION__: `"${pkg.version}"`,
  },
  plugins: [
    tanstackStart({
      spa: {
        enabled: false,
      },
    }),
    react(),
  ],
}));
