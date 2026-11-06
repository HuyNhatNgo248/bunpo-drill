import { m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A box that grows and shrinks smoothly to its content, so a tab with more cards slides the page below instead of
 * jumping it. Its overflow is clipped a little outside it, so card shadows still show.
 */
export function AutoHeight({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  const reduce = useReducedMotion();
  useEffect(() => {
    const inner = ref.current;
    if (!inner) return;
    const observer = new ResizeObserver(() => setHeight(inner.offsetHeight));
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);
  return (
    <m.div
      initial={false}
      animate={{ height }}
      transition={{ duration: reduce ? 0 : 0.3, ease: "easeOut" }}
      className="overflow-clip [overflow-clip-margin:8px]"
    >
      <div ref={ref}>{children}</div>
    </m.div>
  );
}
