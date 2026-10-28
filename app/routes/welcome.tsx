import { redirect } from "react-router";
import type { Route } from "./+types/welcome";
import { Welcome } from "~/components/welcome";
import { isSignedIn } from "~/lib/auth.server";
import { nextJlpt } from "~/lib/jlpt";

export function meta() {
  return [{ title: "文法ドリル · 自分の文法ノートから、JLPT形式の模擬試験" }];
}

/** Signed-in users have their tests at /, so they go there. The countdown is worked out here, so the server and the page agree on the day. */
export async function loader({ request }: Route.LoaderArgs) {
  if (await isSignedIn(request)) throw redirect("/");
  return { exam: nextJlpt() };
}

export default function WelcomeRoute({ loaderData }: Route.ComponentProps) {
  return <Welcome exam={loaderData.exam} />;
}
