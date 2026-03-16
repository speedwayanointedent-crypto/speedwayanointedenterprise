import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth": "http://localhost:4000",
      "/products": "http://localhost:4000",
      "/orders": "http://localhost:4000",
      "/sales": "http://localhost:4000",
      "/categories": "http://localhost:4000",
      "/brands": "http://localhost:4000",
      "/models": "http://localhost:4000",
      "/reports": "http://localhost:4000",
      "/users": "http://localhost:4000",
      "/years": "http://localhost:4000",
      "/reviews": "http://localhost:4000"
    }
  }
});

