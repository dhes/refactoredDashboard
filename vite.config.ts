import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/cds-services": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/fhir": {
        target: "https://enhanced.hopena.info",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/fhir/, '/fhir'),
      },
    },
  },
});
