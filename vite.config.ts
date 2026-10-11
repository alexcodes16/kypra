import { defineConfig,type Plugin,type Connect } from "vite";
import react from "@vitejs/plugin-react";
import { GET } from "./server/demo";

const demoHandler: Connect.NextHandleFunction = async (
  request,
  response,
  next,
) => {
  const url = new URL(request.url ?? "/","http://localhost");
  if (url.pathname !== "/api/demo") return next();
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405,{ Allow: "GET,HEAD" });
    response.end();
    return;
  }
  try {
    const result = GET(new Request(url));
    response.writeHead(result.status,Object.fromEntries(result.headers));
    response.end(request.method === "HEAD" ? undefined : await result.text());
  } catch (error) {
    next(error as Error);
  }
};

const demoApi: Plugin = {
  name: "demo-api",
  configureServer(server) {
    server.middlewares.use(demoHandler);
  },
  configurePreviewServer(server) {
    server.middlewares.use(demoHandler);
  },
};

export default defineConfig({
  plugins: [react(),demoApi],
  server: { port: 5173,strictPort: true },
  preview: { port: 5173,strictPort: true },
});
