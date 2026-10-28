import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        /** Level tag on the quiz and results pages. */
        default: "rounded-md bg-primary px-2 py-0.5 font-semibold text-primary-foreground",
        /** Level tag in the mock test list. */
        soft: "rounded-md bg-primary-soft px-2 py-0.5 font-semibold text-primary-soft-foreground",
        /** Score pill, e.g. "7 / 8". */
        outline: "rounded-full border-border px-2.5 py-px text-secondary-foreground",
        /** A test left before submitting, e.g. "解答中 2 / 3". */
        progress: "rounded-full border-indigo/25 bg-indigo/10 px-2.5 py-px text-indigo",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
