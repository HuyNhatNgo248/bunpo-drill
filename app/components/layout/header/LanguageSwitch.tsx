import { useLingui } from "@lingui/react/macro";
import { Check, ChevronDown, Languages } from "lucide-react";
import { Form, useLocation } from "react-router";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { Locale } from "~/lib/i18n";

/** Each language named in itself, so a reader finds theirs whatever the page is in. */
const LANGUAGES: { locale: Locale; name: string }[] = [
  { locale: "en", name: "English" },
  { locale: "ja", name: "日本語" },
];

const FORM_ID = "language-switch";

/**
 * The language menu. A choice submits a form that reloads the whole page (`reloadDocument`), so the
 * server renders the new language and the browser loads its catalog. The items sit in a portal, so
 * they reach the form by its id. On a phone the button hides the language name.
 */
export function LanguageSwitch() {
  const { t, i18n } = useLingui();
  const { pathname, search } = useLocation();
  const current = LANGUAGES.find((language) => language.locale === i18n.locale) ?? LANGUAGES[0];

  return (
    <>
      <Form id={FORM_ID} method="post" action="/locale" reloadDocument hidden>
        <input type="hidden" name="redirectTo" value={pathname + search} />
      </Form>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label={t`Language: ${current.name}`}>
            <Languages aria-hidden="true" />
            <span lang={current.locale} className="hidden md:inline">
              {current.name}
            </span>
            <ChevronDown aria-hidden="true" className="opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {LANGUAGES.map(({ locale, name }) => (
            <DropdownMenuItem key={locale} asChild>
              <button type="submit" form={FORM_ID} name="locale" value={locale} lang={locale} className="w-full">
                {name}
                {locale === current.locale && <Check aria-hidden="true" className="ml-auto" />}
              </button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
