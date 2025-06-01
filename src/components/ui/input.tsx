import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Glass styling base
        "glass-input h-12 rounded-xl border-0 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0",
        // Default functionality classes
        "flex w-full min-w-0 px-3 py-1 text-base outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Text styling - removed glass-text since it's handled in CSS
        "selection:bg-primary selection:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
