import { cn } from "cn";
import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

/**
 * A labelled password input with an eye button that shows or hides what's typed.
 * The label sits outside the button, so the button's name isn't read as part of the field's.
 */
export function PasswordField({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & Omit<React.ComponentProps<"input">, "type" | "id">) {
  const id = useId();
  const [shown, setShown] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-caption font-medium">
        {label}
      </label>
      <div className="relative flex">
        <input {...props} id={id} type={shown ? "text" : "password"} className={cn(className, "w-full pr-11")} />
        <button
          type="button"
          onClick={() => setShown(!shown)}
          aria-label={shown ? `${label}を隠す` : `${label}を表示`}
          aria-pressed={shown}
          aria-controls={id}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {shown ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
