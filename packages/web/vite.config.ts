import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Any import starting with "lib/..." resolves inside the web package
      lib: path.resolve(__dirname, "src/lib"),
    },
  },
});
