import { useEffect, useRef, useState } from "react";
import type { Answers } from "./views";

/**
 * The answer sheet, kept the same on every page open on this test (live.server.ts relays it).
 * The socket reconnects 2 s after a drop.
 */
export function useLiveAnswers(testId: string) {
  const [answers, setAnswers] = useState<Answers>({});
  const [socket, setSocket] = useState<WebSocket | null>(null);
  // The sheet last received, so it isn't sent straight back.
  const received = useRef<Answers | null>(null);

  useEffect(() => {
    let ws: WebSocket;
    let retry: ReturnType<typeof setTimeout>;
    let stopped = false;
    const connect = () => {
      ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/live/${testId}`);
      ws.onopen = () => setSocket(ws);
      ws.onmessage = (event) => {
        received.current = JSON.parse(event.data);
        setAnswers(received.current!);
      };
      ws.onclose = () => {
        setSocket(null);
        if (!stopped) retry = setTimeout(connect, 2000);
      };
    };
    connect();
    return () => {
      stopped = true;
      clearTimeout(retry);
      ws.close();
    };
  }, [testId]);

  // On (re)connect, only a sheet with answers is sent, so a page that just opened takes the others' instead of clearing them.
  useEffect(() => {
    if (socket && Object.keys(answers).length) socket.send(JSON.stringify(answers));
  }, [socket]);

  useEffect(() => {
    if (answers !== received.current) socket?.send(JSON.stringify(answers));
  }, [answers]);

  return [answers, setAnswers] as const;
}
