import { cn } from "@/lib/utils"

/** The Mirror mark from BLUEPRINT §3, minus the app-icon background tile.
 * Drawn with currentColor so it always inherits a design token. */
export function MirrorMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 88 88"
      role="img"
      aria-label="Mirror"
      className={cn("text-primary", className)}
    >
      <path d="M40 26 L28 44 L40 62 Z" fill="currentColor" />
      <path d="M48 26 L60 44 L48 62 Z" fill="currentColor" opacity="0.32" />
      <line
        x1="44"
        y1="24"
        x2="44"
        y2="64"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        opacity="0.5"
      />
    </svg>
  )
}
