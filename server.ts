import { createServer } from "node:http";
import compression from "compression";
import express from "express";

/** The web server. `pnpm dev` runs server/app.ts through Vite, `pnpm start` runs its build. */

type ServerApp = { app: express.Handler };

// The jlpt-grammar-quiz skill posts to this port, so a taken port fails instead of moving.
const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.disable("x-powered-by");
app.use(compression());
// React Router flushes after every chunk it writes, which restarts gzip each time (a page came out 3× larger).
// shortcut: nothing streams late (no <Await> or Suspense), so compress each response whole; drop this once one does.
app.use((_req, res, next) => {
  res.flush = () => {};
  next();
});
const server = createServer(app);

let load: () => Promise<ServerApp>;
if (process.env.NODE_ENV === "production") {
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
  );
  app.use(express.static("build/client", { maxAge: "1h" }));
  // @ts-ignore: only exists after `pnpm build`.
  const build: ServerApp = await import("./build/server/index.js");
  load = async () => build;
} else {
  // Vite's hot reload socket shares the server, so the page reaches it on the same port.
  const vite = await (
    await import("vite")
  ).createServer({ server: { middlewareMode: true, ws: { server } } });
  app.use(vite.middlewares);
  // Loaded per request, so edits show up without a restart.
  load = () => vite.ssrLoadModule("./server/app.ts") as Promise<ServerApp>;
}

app.use((req, res, next) =>
  load()
    .then((entry) => entry.app(req, res, next))
    .catch(next),
);

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
