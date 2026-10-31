import { isTestLevel, type JlptLevel } from "~/lib/payload";

/**
 * Hairline's Drawer, the figure of a level that has no tests yet, loaded on first use: the package's React entry
 * brings all its figures, about 49 KB gzipped. The browser keeps the module, so calling this again costs nothing,
 * which lets a level's tab start the load on hover or press, alongside the page's data instead of after it.
 */
export const loadDrawerFigure = () => import("@lucasmarkes/hairline/react");

/** What a level's tab starts loading: the figure, for a level with no tests yet; nothing for one that has them. */
export const warmDrawerFigure = (level: JlptLevel) => (isTestLevel(level) ? undefined : () => void loadDrawerFigure());
