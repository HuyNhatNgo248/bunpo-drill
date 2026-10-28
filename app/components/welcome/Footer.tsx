/** A quiet last line: a proverb about steady study, and that the app is not the official JLPT, with a link to it. */
export function Footer() {
  return (
    <footer className="border-t">
      <div
        lang="ja"
        className="mx-auto flex max-w-260 flex-col items-center gap-1.5 px-4 py-5 text-center font-jp text-caption text-muted-foreground md:flex-row md:justify-between md:px-6 md:text-left"
      >
        <p>継続は力なり</p>
        <p>
          日本語能力試験（JLPT）の公式サービスではありません。試験日と申し込みは{" "}
          <a href="https://www.jlpt.jp/" target="_blank" rel="noreferrer" className="text-indigo underline-offset-4 hover:underline">
            jlpt.jp
          </a>
          へ。
        </p>
      </div>
    </footer>
  );
}
