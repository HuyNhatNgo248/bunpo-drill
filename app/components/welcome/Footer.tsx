import { Trans } from "@lingui/react/macro";

/** A quiet last line: a proverb about steady study (in Japanese on every page), and that the app is not the official JLPT. */
export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-260 flex-col items-center gap-1.5 px-4 py-5 text-center text-caption text-muted-foreground md:flex-row md:justify-between md:px-6 md:text-left">
        <p lang="ja" className="font-jp">
          継続は力なり
        </p>
        <p>
          <Trans>
            Not an official JLPT service. For exam dates and registration, see{" "}
            <a href="https://www.jlpt.jp/" target="_blank" rel="noreferrer" className="text-indigo underline-offset-4 hover:underline">
              jlpt.jp
            </a>
            .
          </Trans>
        </p>
      </div>
    </footer>
  );
}
