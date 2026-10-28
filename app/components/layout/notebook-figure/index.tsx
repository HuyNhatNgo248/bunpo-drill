import { cn } from "~/lib/utils";
import { useEffect, useRef } from "react";
import { loadFigure } from "./helpers/loadFigure";

/**
 * The notebook drawing on the sign-in pages: a 文法ノート whose week tabs slide out under the pointer.
 * It is decoration, so screen readers skip it. The server renders the empty 5:4 box, and the drawing
 * mounts into it in the browser, so the page does not move when it appears.
 * `onRead` gets the tab under the pointer ("第4週"), or "rest" when there is none.
 */
export function NotebookFigure({ className, onRead }: { className?: string; onRead?: (part: string) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  // The latest callback, so the drawing is mounted once however often the page renders.
  const reader = useRef(onRead);
  reader.current = onRead;

  useEffect(() => {
    const host = stage.current!;
    const { HL, figure } = loadFigure();
    HL.inject(document);
    const svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, host);
    let text = "rest";
    const read = {
      get textContent() {
        return text;
      },
      set textContent(value: string) {
        text = value;
        reader.current?.(value);
      },
    };
    const handle = figure.mount({ stage: host, svg, read }, figure.range[1]);
    return () => {
      handle.destroy();
      svg.remove();
    };
  }, []);

  return <div ref={stage} data-hairline="tabs" aria-hidden="true" className={cn("aspect-5/4", className)} />;
}
