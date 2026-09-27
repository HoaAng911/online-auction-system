import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "text-black",
        destructive:
          "border-[var(--color-danger)] bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
        success:
          "border-[var(--color-success)] bg-[var(--color-success)]/10 text-[var(--color-success)]",
        warning:
          "border-[var(--color-warning)] bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({ className, variant, ...props }) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }) {
  return (
    <h5
      className={cn("mb-1 font-black uppercase leading-none tracking-tight", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }) {
  return (
    <div
      className={cn("text-sm text-[var(--color-text-muted)]", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
