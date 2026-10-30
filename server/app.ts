import { createRequestHandler } from "@react-router/express";
import express from "express";

/** What server.ts runs: the React Router app. */

export const app = express();
// The host's proxy (Northflank's load balancer, or cloudflared) reaches us over http; trusting its
// X-Forwarded-Proto makes request.url https, so React Router's action Origin check (CSRF) passes.
// One hop: only the proxy right in front of us, which overwrites what the browser sent.
app.set("trust proxy", 1);
app.use(createRequestHandler({ build: () => import("virtual:react-router/server-build") }));
