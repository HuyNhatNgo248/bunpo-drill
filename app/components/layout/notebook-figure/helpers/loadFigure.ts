import kernelSource from "../hairline/kernel.js?raw";
import figureSource from "../hairline/tabs.js?raw";

/** What the figure gets to draw into: its stage, the svg on it, and a read-out it names its part on. */
type Host = { stage: HTMLElement; svg: SVGSVGElement; read: { textContent: string } };

/** What a hairline figure file passes to `hairline(…)`. */
export type Figure = {
  name: string;
  means: string;
  /** The figure's own number at intensity 0, 0.5 and 1; the middle one is its default. */
  range: [number, number, number];
  mount: (host: Host, value: number) => { set: (value: number) => void; destroy: () => void };
};

/** The part of the kernel's `HL` that mounting a figure needs. */
type Kernel = {
  inject: (root: Document) => void;
  mk: (tag: string, attrs: Record<string, string>, parent: Element) => SVGSVGElement;
};

let loaded: { HL: Kernel; figure: Figure } | undefined;

/**
 * Runs the hairline kernel, then the notebook figure, once, in the browser.
 * Both files stay byte for byte as the hairline skill writes them (the kernel's header names its sha256),
 * so they run from their source, the way the skill's page runs them, instead of being edited into modules.
 */
export function loadFigure(): { HL: Kernel; figure: Figure } {
  if (loaded) return loaded;
  const HL = new Function(`${kernelSource}\nreturn HL;`)() as Kernel;
  let figure: Figure | undefined;
  new Function("HL", "hairline", figureSource)(HL, (f: Figure) => {
    figure = f;
  });
  if (!figure) throw new Error("The notebook figure did not call hairline(…).");
  loaded = { HL, figure };
  return loaded;
}
