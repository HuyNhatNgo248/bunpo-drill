/** A catalog, compiled by @lingui/vite-plugin when a .po file is imported. */
declare module "*.po" {
  import type { Messages } from "@lingui/core";
  export const messages: Messages;
}
