import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The session cookie is SameSite=Strict and set by localhost:3000, so the app
// only works when opened at localhost. Send 127.0.0.1 visits there.
const redirectLoopbackIp = {
  name: "redirect-127-to-localhost",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const host = req.headers.host ?? "";
      if (!host.startsWith("127.0.0.1")) return next();
      res.statusCode = 302;
      res.setHeader("Location", `http://${host.replace("127.0.0.1", "localhost")}${req.url}`);
      res.end();
    });
  },
};

export default defineConfig({
  plugins: [redirectLoopbackIp, react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
