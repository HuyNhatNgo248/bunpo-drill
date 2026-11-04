import { useLingui } from "@lingui/react/macro";
import { useNavigation } from "react-router";
import { NavTabs } from "~/components/NavTabs";
import type { JlptLevel } from "~/lib/payload";

/**
 * Switches a page (the mock tests, or kanji) between the JLPT levels. The level is in the URL, so a reload keeps it.
 * The highlight slides to the level picked before its tests have loaded.
 */
export function LevelTabs({
  levels,
  current,
}: {
  levels: readonly JlptLevel[];
  current: JlptLevel;
}) {
  const { t } = useLingui();
  const next = new URLSearchParams(useNavigation().location?.search).get("level");
  const shown = levels.find((level) => level === next) ?? current;
  return (
    // A phone's row is too narrow for the title and five tabs, so the tabs wrap under it and fill the width.
    <NavTabs
      label={t`Level`}
      tabs={levels.map((level) => ({ key: level, to: `?level=${level}`, label: level }))}
      current={current}
      shown={shown}
      className="md:w-auto"
    />
  );
}
