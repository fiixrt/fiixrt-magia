import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import devApi from "./scripts/dev-api.js";

export default defineConfig({
  plugins: [react(), devApi()],
  server: { host: true, port: 5199 },
  build: { outDir: "dist", sourcemap: false },
});
