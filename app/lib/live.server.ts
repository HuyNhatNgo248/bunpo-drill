import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, type WebSocket } from "ws";
import { isSignedIn } from "./auth.server";
import { submittedAnswersSchema } from "./grading.server";

/**
 * Live answers: every quiz page on a test connects to /live/:id and sends its answers
 * on each change. The relay keeps the last ones and sends them to every page on that
 * test (the sender too, so all pages end on the same answers). A page that joins gets them.
 * Messages to pages are {"answers"} or {"notes": true} (notes changed: reload them).
 * shortcut: kept in memory, so they're lost on restart and need one server instance; use Redis to run several.
 */

const rooms = new Map<string, { answers: string | null; sockets: Set<WebSocket> }>();
const sockets = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });

/** Answers the WebSocket upgrade for /live/:id (server.ts sends it here). */
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
    const room = rooms.get(id) ?? { answers: null, sockets: new Set() };
    rooms.set(id, room);
    room.sockets.add(ws);
    if (room.answers) ws.send(room.answers);
    ws.on("message", (data) => {
      let answers;
      try {
        answers = submittedAnswersSchema.parse(JSON.parse(String(data)));
      } catch {
        return; // Not answers; ignored like a bad request.
      }
      room.answers = JSON.stringify({ answers });
      for (const other of room.sockets) other.send(room.answers);
    });
    ws.on("close", () => room.sockets.delete(ws));
  });
}

/** Tells every page on a test that its notes changed. */
export function notifyNotes(id: string) {
  for (const ws of rooms.get(id)?.sockets ?? []) ws.send(JSON.stringify({ notes: true }));
}

/** Drops a test's live answers once it's submitted or retaken, so the next attempt starts blank. */
export function forgetLive(id: string) {
  const room = rooms.get(id);
  if (room) room.answers = null;
}
