import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // During dev, forward /api calls to the Express server
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
