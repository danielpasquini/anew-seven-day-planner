import { cn } from "@/lib/utils"

/** A curved leaf with an asymmetric vein: the app's own mark. */
export function BrandMark({ className = "", paper = false }: { className?: string; paper?: boolean }) {
  return <span className={cn("anew-brand-mark inline-flex items-center justify-center", paper && "anew-paper-mark", className)} aria-hidden="true">
    <svg viewBox="0 0 64 64" fill="none" className="h-full w-full">
      <path d="M16 46C9 30 21 15 47 10C53 34 40 52 21 48C17 53 14 56 9 58" fill="currentColor" fillOpacity=".12" />
      <path d="M17 46C9 30 21 15 47 10C53 34 40 52 21 48" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 55C20 44 26 32 40 20M24 39L22 29M30 31L40 31" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  </span>
}
