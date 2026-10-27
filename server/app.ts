import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { createRequestHandler } from "@react-router/express";
import express from "express";
import { WebSocketServer, type WebSocket } from "ws";
import { isSignedIn } from "~/lib/auth.server";
import { submittedAnswersSchema } from "~/lib/grading.server";

/** The React Router app, plus the live view's WebSocket relay. server.ts runs both. */

export const app = express();
app.use(createRequestHandler({ build: () => import("virtual:react-router/server-build") }));

/**
 * Live view: the quiz page sends its answers to /live/:id on every change, and each
 * watch page on that id gets them. A watch page that joins late gets the last ones.
 * shortcut: kept in memory, so they're lost on restart and need one server instance; use Redis to run several.
 */
const rooms = new Map<string, { answers: string; sockets: Set<WebSocket> }>();
const sockets = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });

export async function upgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
  const id = req.url?.match(/^\/live\/([\w-]+)$/)?.[1];
  // The Origin check stops another site from opening the socket with the login cookie.
  const sameOrigin = req.headers.origin?.replace(/^https?:\/\//, "") === req.headers.host;
  const cookie = { Cookie: req.headers.cookie ?? "" };
  // A throw here would crash the server (no request handler catches it), so it counts as signed out.
  const signedIn = await isSignedIn(new Request("http://localhost", { headers: cookie })).catch(() => false);
  if (!id || !sameOrigin || !signedIn) {
    socket.end("HTTP/1.1 401 Unauthorized\r\n\r\n");
    return;
  }
  sockets.handleUpgrade(req, socket, head, (ws) => {
    const room = rooms.get(id) ?? { answers: "{}", sockets: new Set() };
    rooms.set(id, room);
    room.sockets.add(ws);
    ws.send(room.answers);
    ws.on("message", (data) => {
      let answers;
      try {
        answers = submittedAnswersSchema.parse(JSON.parse(String(data)));
      } catch {
        return; // Not answers; ignored like a bad request.
      }
      room.answers = JSON.stringify(answers);
      for (const other of room.sockets) if (other !== ws) other.send(room.answers);
    });
    ws.on("close", () => room.sockets.delete(ws));
  });
}
