import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white transition-all duration-150 placeholder:text-white/22 hover:border-white/[0.12] hover:bg-white/[0.055] focus-visible:border-indigo-400/50 focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] disabled:cursor-not-allowed disabled:opacity-45 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
