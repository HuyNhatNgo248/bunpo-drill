/** A form's error or saved message, or nothing. `id` is the error's, for the fields' `aria-describedby`. */
export function Status({ error, saved, id }: { error?: string; saved?: string; id?: string }) {
  if (error) {
    return (
      <p id={id} role="alert" className="text-caption text-primary-soft-foreground">
        {error}
      </p>
    );
  }
  return saved ? (
    <p role="status" className="text-caption text-success">
      {saved}
    </p>
  ) : null;
}
