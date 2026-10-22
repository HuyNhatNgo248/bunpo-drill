import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { signOut } from "~/lib/auth.server";

/** POST /logout: forget the login cookie, then show the login page. */
export function action({ request }: Route.ActionArgs) {
  return signOut(request);
}

/** A plain visit signs nothing out. */
export function loader() {
  return redirect("/");
}
