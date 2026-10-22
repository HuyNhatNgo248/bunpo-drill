import * as React from "react"
import { cn } from "cn"

/** A white surface with a 1px border and 12px corners. */
function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="card"
      className={cn("rounded-xl border bg-card text-card-foreground", className)}
      {...props}
    />
  )
}

export { Card }
