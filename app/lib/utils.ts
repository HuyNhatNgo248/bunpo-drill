import { createCn } from "cn/engine";
import tables from "./cn-tables";

/**
 * Merges class names, the last of two conflicting Tailwind classes winning, with the theme's scales from
 * cn.config.ts. It reads tables that the cn plugin in vite.config.ts compiles from the classes the app uses,
 * instead of shipping the whole Tailwind class compiler to the browser.
 */
export const cn = createCn(tables);
