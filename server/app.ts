import { createRequestHandler } from "@react-router/express";
import express from "express";

/** What server.ts runs: the React Router app. */

export const app = express();
// cloudflared reaches us over http from this machine; trusting its X-Forwarded-Proto makes request.url
// https, so React Router's action Origin check (CSRF) passes. Only loopback, so others can't fake it.
app.set("trust proxy", "loopback");
app.use(createRequestHandler({ build: () => import("virtual:react-router/server-build") }));
