import { redirect } from "react-router";
import type { Route } from "./+types/login";

/** /login was the old address of both pages: ?mode=signup goes to /signup, anything else to /signin, with the same redirectTo. */
export function loader({ url }: Route.LoaderArgs) {
  const params = new URLSearchParams(url.search);
  const page = params.get("mode") === "signup" ? "/signup" : "/signin";
  params.delete("mode");
  const query = params.toString();
  return redirect(query ? `${page}?${query}` : page);
}
