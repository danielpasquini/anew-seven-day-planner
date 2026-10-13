"use client"

import { useRef, useState } from "react"
import { ArrowRight, FlaskConical, RotateCcw, X } from "lucide-react"
import { useDemo } from "@/lib/demo"

export function TestAccessControls({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const demo = useDemo()
  const [open, setOpen] = useState(initiallyOpen)
  const summaryRef = useRef<HTMLElement>(null)
  if (!demo.available) return null

  const select = (action: () => boolean | void) => {
    if (action() === false) return
    setOpen(false)
    window.scrollTo({ top: 0, behavior: "instant" })
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  return <aside aria-label="App Test Access" className="border-b border-primary/20 bg-card px-4 py-3 text-foreground sm:px-8">
    {demo.accessError && <p role="alert" className="mx-auto mb-2 max-w-6xl rounded-xl border border-destructive/30 p-3 text-sm text-destructive">{demo.accessError}</p>}
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="mx-auto max-w-6xl">
      <summary ref={summaryRef} className="min-h-11 cursor-pointer rounded-xl px-2 py-3 text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <FlaskConical className="mr-2 inline size-4" aria-hidden="true" />
        {demo.enabled ? `Test Mode · ${demo.scenario === "first-visit" ? "First-Time Visit" : "Returning User"}` : "Test the App"}
      </summary>
      <div className="space-y-4 pb-3 pt-2">
        <p className="max-w-2xl text-sm text-muted-foreground">Choose a fresh first visit or explore an existing sample workspace. You can switch modes or restart at any time.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => select(demo.startFirstVisit)} className="min-h-24 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-left hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary">
            <span className="flex items-center justify-between gap-3 text-sm font-semibold text-primary">First-Time Visit <ArrowRight className="size-4 shrink-0" aria-hidden="true" /></span>
            <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">Replay the opening and welcome, try optional personalization, and start a clean week.</span>
          </button>
          <button type="button" onClick={() => select(() => demo.startDemo())} className="min-h-24 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-left hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary">
            <span className="flex items-center justify-between gap-3 text-sm font-semibold text-primary">Returning User <ArrowRight className="size-4 shrink-0" aria-hidden="true" /></span>
            <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">Open the planner immediately with sample weeks, notes, and a completed week.</span>
          </button>
        </div>
        {demo.enabled && <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => select(demo.resetDemo)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-xs"><RotateCcw className="size-4" aria-hidden="true" />Restart This Test</button>
          <button type="button" onClick={() => select(demo.exitDemo)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-xs"><X className="size-4" aria-hidden="true" />Exit Test Mode</button>
        </div>}
        <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">Test changes stay in memory and clear on restart or reload. Your real account records are preserved. Live sign-in, email verification, account deletion, and AI require configured services and a real account.</p>
      </div>
    </details>
  </aside>
}
