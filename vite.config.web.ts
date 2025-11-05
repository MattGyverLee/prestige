import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  publicDir: "public",

  build: {
    outDir: "build",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },

  server: {
    port: 3000,
    strictPort: false,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  define: {
    // Define global constants (replaces webpack.DefinePlugin)
    "process.env.FLUENTFFMPEG_COV": "false",
    // Define process.env for compatibility
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    "process.env.REACT_APP_MODE": JSON.stringify(process.env.REACT_APP_MODE || "web"),
  },

  optimizeDeps: {
    include: ["wavesurfer.js"],
  },

  // For web target
  target: "es2015",
});
