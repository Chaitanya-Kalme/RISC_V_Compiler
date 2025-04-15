import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();

      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // Insert tab character at cursor
      const value = target.value;
      target.value = value.substring(0, start) + "\t" + value.substring(end);

      // Move cursor
      target.selectionStart = target.selectionEnd = start + 1;

      // Trigger a change event if needed (important for controlled components)
      const event = new Event("input", { bubbles: true });
      target.dispatchEvent(event);
    }
  };
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-2xl",
        className
      )}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

export { Textarea }
