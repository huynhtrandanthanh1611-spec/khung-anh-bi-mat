import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/khung-anh-bi-mat/" : "/",
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  build: { outDir: "dist", sourcemap: false },
});
