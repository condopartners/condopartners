import type { LabelHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  htmlFor: string
}

export function Label({ className, htmlFor, children, ...props }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    >
      {children}
    </label>
  )
}
