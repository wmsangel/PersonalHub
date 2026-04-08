import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-primary-foreground shadow-[0_10px_30px_rgba(99,102,241,0.25)] hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(99,102,241,0.32)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_10px_30px_rgba(190,24,93,0.18)] hover:-translate-y-0.5 hover:bg-destructive/90",
        outline: "border border-white/12 bg-white/5 text-white shadow-none hover:border-white/18 hover:bg-white/8 hover:text-white",
        secondary:
          "bg-white/8 text-secondary-foreground shadow-none hover:bg-white/12",
        ghost: "text-white/60 hover:bg-white/6 hover:text-white",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2.5",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
