"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"

export function TextField({ id, label }: { id: string; label: string }) {
  const { getText, setText } = useStore()
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <input
        type="text"
        value={getText(id)}
        onChange={(e) => setText(id, e.target.value)}
        /* font-size 1rem (16px) prevents iOS auto-zoom */
        className="w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
      />
    </label>
  )
}

export function TextAreaField({ id, label }: { id: string; label: string }) {
  const { getText, setText } = useStore()
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <textarea
        value={getText(id)}
        onChange={(e) => setText(id, e.target.value)}
        rows={3}
        /* font-size 1rem (16px) prevents iOS auto-zoom */
        className="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-base leading-relaxed text-foreground shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
      />
    </label>
  )
}

export function ScaleField({ id, label, max = 10 }: { id: string; label: string; max?: number }) {
  const { getText, setText } = useStore()
  const current = getText(id)
  const values = Array.from({ length: max + 1 }, (_, i) => i)
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label} <span className="text-muted-foreground">(0–{max})</span>
      </span>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => {
          const active = current === String(v)
          return (
            <button
              key={v}
              type="button"
              aria-pressed={active}
              onClick={() => setText(id, active ? "" : String(v))}
              className={cn(
                /* min 44×44 touch target on mobile via min-h */
                "flex h-9 w-9 min-h-[2.25rem] min-w-[2.25rem] items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition touch-manipulation",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                  : "border-input bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CheckField({
  id,
  label,
  scaleId,
}: {
  id: string
  label: string
  scaleId: string
}) {
  const { isDone, toggleDone, getText, setText } = useStore()
  const done = isDone(id)
  return (
    <div className="flex items-center gap-3 py-1">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={label}
        onClick={() => toggleDone(id)}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition touch-manipulation",
          done ? "border-primary bg-primary text-primary-foreground shadow-xs" : "border-input bg-card hover:border-primary/60",
        )}
      >
        {done && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
      </button>
      <span className={cn("flex-1 text-sm font-medium leading-relaxed", done ? "text-muted-foreground line-through" : "text-foreground")}>
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        aria-label={`Nota prevista para: ${label}`}
        placeholder="0–10"
        value={getText(scaleId)}
        onChange={(e) => setText(scaleId, e.target.value)}
        /* 16px to prevent iOS zoom */
        className="w-16 rounded-md border border-input bg-background px-2.5 py-1.5 text-base text-center tabular-nums text-foreground outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
      />
    </div>
  )
}
