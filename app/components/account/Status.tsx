import type { AccountResult } from "./types";

/** The error or the saved message of a form, or nothing. */
export function Status({ result }: { result?: AccountResult }) {
  if (result?.error) {
    return (
      <p role="alert" className="text-caption text-primary-soft-foreground">
        {result.error}
      </p>
    );
  }
  return result?.saved ? (
    <p role="status" className="text-caption text-success">
      {result.saved}
    </p>
  ) : null;
}
