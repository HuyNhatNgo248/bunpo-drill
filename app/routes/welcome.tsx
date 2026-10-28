import { redirect } from "react-router";
import type { Route } from "./+types/welcome";
import { Welcome } from "~/components/welcome";
import { isSignedIn } from "~/lib/auth.server";

export function meta() {
  return [{ title: "文法ドリル · 自分の文法ノートから、JLPT形式の模擬試験" }];
}

/** Signed-in users have their tests at /, so they go there. */
export async function loader({ request }: Route.LoaderArgs) {
  if (await isSignedIn(request)) throw redirect("/");
  return null;
}

export default function WelcomeRoute() {
  return <Welcome />;
}
