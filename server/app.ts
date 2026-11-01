import { createRequestHandler } from "@react-router/express";
import express from "express";
import * as build from "virtual:react-router/server-build";
import { db } from "~/lib/db.server";

/**
 * What server.ts runs: the React Router app. The app's code loads, and the database opens, while the server starts,
 * so the first request after a deploy waits for neither (on the host's 0.1 vCPU that took seconds).
 */

// A failure is logged and left to the first request, which tries again.
db().catch((error: unknown) => console.error("The database could not be opened at start:", error));

export const app = express();
// The host's proxy (Northflank's load balancer, or cloudflared) reaches us over http; trusting its
// X-Forwarded-Proto makes request.url https, so React Router's action Origin check (CSRF) passes.
// One hop: only the proxy right in front of us, which overwrites what the browser sent.
app.set("trust proxy", 1);
app.use(createRequestHandler({ build }));
