// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * In dev mode Nitro is not active, so we mount Better Auth directly as Vite
 * middleware.  In production the Nitro server route at
 * server/routes/api/auth/[...].ts handles requests instead.
 */
function betterAuthDevMiddleware() {
  return {
    name: "better-auth-dev",
    apply: "serve" as const,
    async configureServer(server: { middlewares: { use: Function } }) {
      server.middlewares.use(
        "/api/auth",
        async (req: IncomingMessage, res: ServerResponse, next: Function) => {
          try {
            // Dynamic import so Vite resolves it through its own module graph
            const { auth } = await import("./src/server/auth.js");

            const base = `http://${req.headers.host ?? "localhost"}`;
            const url = new URL((req.url ?? "/"), base);
            // Restore the full /api/auth prefix that connect strips
            url.pathname = "/api/auth" + url.pathname;

            const chunks: Buffer[] = [];
            await new Promise<void>((resolve, reject) => {
              req.on("data", (c: Buffer) => chunks.push(c));
              req.on("end", resolve);
              req.on("error", reject);
            });

            const headers = new Headers();
            const rawHeaders = req.headers;
            for (const [k, v] of Object.entries(rawHeaders)) {
              if (v === undefined) continue;
              if (Array.isArray(v)) v.forEach((val) => headers.append(k, val));
              else headers.set(k, v);
            }

            const body =
              req.method !== "GET" && req.method !== "HEAD" && chunks.length
                ? Buffer.concat(chunks)
                : undefined;

            const webReq = new Request(url.toString(), {
              method: req.method ?? "GET",
              headers,
              body,
            });

            const webRes = await auth.handler(webReq);

            res.statusCode = webRes.status;
            webRes.headers.forEach((val, key) => res.setHeader(key, val));
            const buf = await webRes.arrayBuffer();
            res.end(Buffer.from(buf));
          } catch (err) {
            next(err);
          }
        },
      );
    },
  };
}

// When NITRO_PRESET=vercel is set (e.g. on Vercel CI or via `bun run build:vercel`),
// pass the preset explicitly so Nitro targets the Vercel runtime instead of Cloudflare.
const nitroPreset = process.env.NITRO_PRESET;

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: nitroPreset ? { preset: nitroPreset } : undefined,
  vite: {
    plugins: [betterAuthDevMiddleware()],
  },
});
