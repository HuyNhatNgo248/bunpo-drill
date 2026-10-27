import { Link } from "react-router";

/** The 文 tile and the app name, linking home. */
export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-foreground no-underline">
      <span className="flex size-7.5 items-center justify-center rounded-lg bg-primary font-jp text-sm font-bold text-primary-foreground md:size-8 md:text-body-sm">
        文
      </span>
      <span className="font-jp text-base font-semibold">文法ドリル</span>
    </Link>
  );
}
