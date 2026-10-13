"use client"

import { titleCase } from "@/lib/title-case"

import { Check } from "lucide-react"
import type { Block, Field } from "@/lib/guide-data"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { ScaleField, TextAreaField, TextField } from "@/components/fields"
import { InteractiveScheduleBlock } from "@/components/schedule-block"

function FieldRenderer({ field, preview = false }: { field: Field; preview?: boolean }) {
  if (field.kind === "static") {
    return <p className="text-sm font-semibold text-primary">{field.text}</p>
  }
  if (preview) return <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4"><p className="text-sm font-medium">{field.label}</p><div className="mt-3 h-px w-2/3 bg-border" aria-hidden="true" /></div>
  if (field.kind === "text") {
    return <TextField id={field.id} label={field.label} />
  }
  if (field.kind === "textarea") {
    return <TextAreaField id={field.id} label={field.label} />
  }
  return <ScaleField id={field.id} label={field.label} max={field.max} />
}

function ScheduleCell({ id, text }: { id: string; text: string }) {
  const { isDone, toggleDone } = useStore()
  if (text === "—") {
    return <span className="text-muted-foreground/50" aria-hidden="true">—</span>
  }
  const done = isDone(id)
  return (
    <button
      type="button"
      aria-pressed={done}
      onClick={() => toggleDone(id)}
      className={cn(
        "group flex w-full items-start gap-2 rounded-md p-1.5 text-left text-sm leading-snug transition",
        done ? "bg-primary/8 text-muted-foreground" : "hover:bg-accent/60",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2 transition",
          done ? "border-primary bg-primary text-primary-foreground" : "border-input group-hover:border-primary/60",
        )}
      >
        {done && <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />}
      </span>
      <span className={cn(done && "line-through")}>{text}</span>
    </button>
  )
}

function LadderRow({ id, label }: { id: string; label: string }) {
  const { isDone, toggleDone, getText, setText, locale } = useStore()
  const done = isDone(id)
  return (
    <tr className="border-t border-border/70 hover:bg-muted/30 transition">
      <td className="py-3 pl-4 pr-3 align-middle text-sm font-medium text-foreground">{label}</td>
      <td className="py-3 px-3 align-middle text-center">
        <input
          type="number"
          min={0}
          max={10}
          step={1}
          inputMode="numeric"
          aria-label={`${locale === "en-US" ? "Your own rating for" : "Sua percepção de"}: ${label}`}
          placeholder="0–10"
          value={getText(`${id}-nota`)}
          onChange={(e) => setText(`${id}-nota`, e.target.value)}
          className="w-16 rounded-md border border-input bg-background px-2.5 py-1.5 text-center text-sm tabular-nums outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </td>
      <td className="py-3 pr-4 pl-3 align-middle text-center">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`${locale === "en-US" ? "Mark as done" : "Marcar como feito"}: ${label}`}
          onClick={() => toggleDone(id)}
          className={cn(
            "flex size-11 items-center justify-center rounded-xl border-2 transition mx-auto touch-manipulation",
            done ? "border-primary bg-primary text-primary-foreground shadow-xs" : "border-input bg-card hover:border-primary/60",
          )}
        >
          {done && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
        </button>
      </td>
    </tr>
  )
}

export function BlockRenderer({ block, preview = false }: { block: Block; preview?: boolean }) {
  switch (block.type) {
    case "lead":
      return (
        <p className="font-serif text-lg sm:text-xl italic leading-relaxed text-primary text-pretty">{block.text}</p>
      )
    case "p":
      return <p className="leading-relaxed text-foreground/90 text-pretty">{block.text}</p>
    case "h":
      return (
        <h3 className="mt-2 font-serif text-xl font-semibold text-foreground text-balance">{titleCase(block.text)}</h3>
      )
    case "list":
      return (
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 leading-relaxed text-foreground/90">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
              <span className="text-pretty">{item}</span>
            </li>
          ))}
        </ul>
      )
    case "note":
      return (
        <aside className="rounded-lg border border-gold/40 bg-gold/10 p-4">
          {block.label && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gold-foreground">{block.label}</p>
          )}
          <p className="text-sm leading-relaxed text-foreground/90 text-pretty">{block.text}</p>
        </aside>
      )
    case "table":
      return (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-secondary">
                {block.head.map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left font-semibold text-secondary-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={cn(
                        "px-4 py-2.5 align-top leading-relaxed text-foreground/90",
                        j === 0 && "font-medium text-foreground",
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case "ladder":
      return (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {block.head.map((h, i) => (
                  <th
                    key={i}
                    className={cn(
                      "py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                      i === 0 && "pl-4 pr-3 text-left",
                      i === 1 && "px-3 text-center w-px whitespace-nowrap",
                      i === 2 && "pr-4 pl-3 text-center w-px whitespace-nowrap",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                preview ? <tr key={row.id}><td colSpan={3} className="border-t border-border px-4 py-3 text-sm">{row.label}</td></tr> : <LadderRow key={row.id} id={row.id} label={row.label} />
              ))}
            </tbody>
          </table>
        </div>
      )
    case "fields":
      return (
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
          {block.title && (
            <h4 className="mb-4 font-serif text-lg font-semibold text-foreground text-balance">{titleCase(block.title)}</h4>
          )}
          <div className="space-y-4">
            {block.fields.map((field, i) => (
              <FieldRenderer key={i} field={field} preview={preview} />
            ))}
          </div>
          {block.note && (
            <p className="mt-4 rounded-md bg-muted/70 p-3 text-sm italic leading-relaxed text-foreground/85 text-pretty">
              {block.note}
            </p>
          )}
        </div>
      )
    case "schedule":
      return preview ? <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4"><CalendarPreview /></div> : <InteractiveScheduleBlock />
    default:
      return null
  }
}

function CalendarPreview() {
  const { locale } = useStore()
  return <p className="text-sm leading-relaxed text-muted-foreground">{locale === "en-US" ? "Your personal space includes an editable seven-day routine. Each activity can be adapted, skipped or replaced by rest." : "Seu espaço pessoal inclui uma rotina editável de sete dias. Cada atividade pode ser adaptada, pulada ou substituída por descanso."}</p>
}
