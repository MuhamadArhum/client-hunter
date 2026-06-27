import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/12 text-primary border border-primary/20 hover:bg-primary/20",
        secondary:
          "bg-secondary/12 text-secondary border border-secondary/20 hover:bg-secondary/20",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/18",
        outline:
          "border border-border text-foreground bg-transparent hover:bg-muted/50",
        success:
          "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/18 dark:text-emerald-400",
        warning:
          "bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/18 dark:text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
