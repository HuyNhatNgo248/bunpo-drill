import { redirect } from "react-router";
import type { Route } from "./+types/locale";
import { isLocale, localeCookie } from "~/lib/i18n";

/** POST /locale with `locale` and `redirectTo`: keep the language in its cookie, then show the same page again. */
export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const locale = form.get("locale");
  if (!isLocale(locale)) return new Response("Unknown language.", { status: 400 });
  return redirect(samePage(form.get("redirectTo")), { headers: { "Set-Cookie": localeCookie(locale) } });
}

/** A plain visit changes nothing. */
export function loader() {
  return redirect("/");
}

/** Only a path on this site, so the form cannot send the visitor away. */
function samePage(to: FormDataEntryValue | null) {
  return typeof to === "string" && to.startsWith("/") && !to.startsWith("//") && !to.startsWith("/\\") ? to : "/";
}
