import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // dev روی / اجرا شود، build روی /CHANCYBOXES/
  base: command === "build" ? "/CHANCYBOXES/" : "/",
}));
