import { useLingui } from "@lingui/react/macro";
import { useLocation, useNavigation } from "react-router";
import { NavTabs } from "~/components/NavTabs";
import type { JlptLevel } from "~/lib/payload";

/** The pages the tabs switch between. */
const PATHS = { grammar: "/", kanji: "/kanji", notes: "/notes" } as const;

/**
 * True while a tab's page loads, another level of the same one included: the page shown fades, so the click shows at
 * once.
 */
export function useTabLoading(): boolean {
  const navigation = useNavigation();
  return navigation.state === "loading" && Object.values(PATHS).some((path) => path === navigation.location.pathname);
}

/**
 * Switches between the grammar mock tests, kanji and the notes, the tab of the page shown being the current one, at
 * the level picked on the page (notes have none). Like
 * the level tabs, one highlight slides to the subject picked, as soon as it is picked; TabsLayout keeps the tabs on
 * screen while the page changes, so the slide is never cut short.
 */
export function SubjectTabs({ level }: { level: JlptLevel | null }) {
  const { t } = useLingui();
  const tabs = [
    { key: "grammar", path: PATHS.grammar, label: t`Grammar` },
    { key: "kanji", path: PATHS.kanji, label: t`Kanji` },
    { key: "notes", path: PATHS.notes, label: t`Notes` },
  ].map((tab) => ({ ...tab, to: level && tab.key !== "notes" ? `${tab.path}?level=${level}` : tab.path }));
  const here = useLocation().pathname;
  const current = tabs.find((tab) => tab.path === here)?.key;
  const next = useNavigation().location?.pathname;
  const shown = tabs.find((tab) => tab.path === next)?.key ?? current;
  return <NavTabs label={t`Subject`} tabs={tabs} current={current} shown={shown} className="md:w-96" />;
}
