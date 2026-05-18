/*
 * Role: Vite build and dev server configuration for the web client.
 * Author: Dennies Bor
 * Description:
 *   Configures the React, Tailwind, and Cesium plugins. The base path is the
 *   site root because the dashboard is served at the root of its own
 *   subdomain. The dev server proxies /api to the local backend; production
 *   builds read the API base from VITE_API_BASE instead.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import cesium from "vite-plugin-cesium";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss(), cesium()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});