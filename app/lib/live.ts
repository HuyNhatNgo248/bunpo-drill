import { useEffect, useState } from "react";
import type { Answers } from "./views";

/**
 * A WebSocket to the live view relay (server/app.ts) for one test; null until it's open.
 * It reconnects 2 s after a drop. Messages from the relay go to `onAnswers`.
 */
export function useLiveSocket(testId: string | null, onAnswers?: (answers: Answers) => void) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  useEffect(() => {
    if (!testId) return;
    let ws: WebSocket;
    let retry: ReturnType<typeof setTimeout>;
    let stopped = false;
    const connect = () => {
      ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/live/${testId}`);
      ws.onopen = () => setSocket(ws);
      ws.onmessage = (event) => onAnswers?.(JSON.parse(event.data));
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
  }, [testId, onAnswers]);
  return socket;
}
