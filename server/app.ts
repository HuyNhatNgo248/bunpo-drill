import { createRequestHandler } from "@react-router/express";
import express from "express";

/** What server.ts runs: the React Router app, and the live answers' WebSocket upgrade. */

export const app = express();
app.use(createRequestHandler({ build: () => import("virtual:react-router/server-build") }));

export { upgrade } from "~/lib/live.server";
