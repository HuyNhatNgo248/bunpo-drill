import { useEffect, useRef, useState } from "react";
import { useRevalidator } from "react-router";
import type { Answers } from "./views";

/**
 * A WebSocket to the live relay (live.server.ts) for one test; null until it's open.
 * It reconnects 2 s after a drop. Answers from the relay go to `onAnswers`; a notes
 * change reloads the page's data.
 */
function useLiveSocket(testId: string, onAnswers?: (answers: Answers) => void) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { revalidate } = useRevalidator();

  useEffect(() => {
    let ws: WebSocket;
    let retry: ReturnType<typeof setTimeout>;
    let stopped = false;
    const connect = () => {
      ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/live/${testId}`);
      ws.onopen = () => setSocket(ws);
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.notes) revalidate();
        else onAnswers?.(message.answers);
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

  return socket;
}

/** Shows notes added or deleted on another page as they happen. */
export function useLiveNotes(testId: string) {
  useLiveSocket(testId);
}

/** The answer sheet, kept the same on every page open on this test. */
export function useLiveAnswers(testId: string) {
  const [answers, setAnswers] = useState<Answers>({});
  // The sheet last received, so it isn't sent straight back.
  const received = useRef<Answers | null>(null);
  const socket = useLiveSocket(testId, (answers) => {
    received.current = answers;
    setAnswers(answers);
  });

  // On (re)connect, only a sheet with answers is sent, so a page that just opened takes the others' instead of clearing them.
  useEffect(() => {
    if (socket && Object.keys(answers).length) socket.send(JSON.stringify(answers));
  }, [socket]);

  useEffect(() => {
    if (answers !== received.current) socket?.send(JSON.stringify(answers));
  }, [answers]);

  return [answers, setAnswers] as const;
}
