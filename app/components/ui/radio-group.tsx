import * as React from "react"
import { cn } from "~/lib/utils"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  )
}

/** A whole option card that acts as one radio: ring, number and label. */
function RadioGroupCard({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-card"
      className={cn(
        "group/radio m-px flex min-h-12 items-center gap-3 rounded-box border bg-card px-3.5 text-left text-foreground outline-none md:min-h-13",
        "hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/40",
        "data-[state=checked]:m-0 data-[state=checked]:border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary-soft",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="size-4 flex-none rounded-full border-line border-faint bg-card group-data-[state=checked]/radio:border-5 group-data-[state=checked]/radio:border-primary"
      />
      {children}
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupCard }
