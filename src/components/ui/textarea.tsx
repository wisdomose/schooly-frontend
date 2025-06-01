import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Glass styling base
        "glass-input rounded-xl border-0 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0",
        // Default functionality classes
        "flex field-sizing-content min-h-16 w-full px-3 py-2 text-base outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Text styling - removed glass-text since it's handled in CSS
        "selection:bg-primary selection:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
