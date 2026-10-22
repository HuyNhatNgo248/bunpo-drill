import * as React from "react"
import { cn } from "cn"
import { Progress as ProgressPrimitive } from "radix-ui"

function Progress({
  className,
  value,
  minFill = 0,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  /** Percent drawn even below it (the reported value stays exact), so an empty bar still shows a start. */
  minFill?: number
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - Math.max(value || 0, minFill)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
