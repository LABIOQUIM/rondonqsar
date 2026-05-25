import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  server: {
    host: "0.0.0.0", // Expose to the network
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:4000",
        changeOrigin: true,
        rewrite: (requestPath: string) => requestPath.replace(/^\/api/, ""),
      },
    },
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
  plugins: [tanstackRouter(), react()],
});
