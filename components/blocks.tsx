"use client"

import { Check } from "lucide-react"
import type { Block, Field } from "@/lib/guide-data"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { ScaleField, TextAreaField, TextField } from "@/components/fields"

function FieldRenderer({ field }: { field: Field }) {
  if (field.kind === "static") {
    return <p className="text-sm font-semibold text-primary">{field.text}</p>
  }
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
  const { isDone, toggleDone, getText, setText } = useStore()
  const done = isDone(id)
  return (
    <tr className="border-t border-border">
      <td className="py-2.5 pr-3 align-middle text-sm text-foreground">{label}</td>
      <td className="py-2.5 pr-3 align-middle">
        <input
          type="text"
          inputMode="numeric"
          aria-label={`Nota prevista: ${label}`}
          placeholder="0–10"
          value={getText(`${id}-nota`)}
          onChange={(e) => setText(`${id}-nota`, e.target.value)}
          className="w-16 rounded-md border border-input bg-card px-2 py-1 text-center text-sm tabular-nums outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </td>
      <td className="py-2.5 align-middle">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`Marcar feito: ${label}`}
          onClick={() => toggleDone(id)}
          className={cn(
            "flex size-5 items-center justify-center rounded-[5px] border-2 transition",
            done ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-primary/60",
          )}
        >
          {done && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
        </button>
      </td>
    </tr>
  )
}

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "lead":
      return (
        <p className="font-serif text-lg italic leading-relaxed text-primary/90 text-pretty">{block.text}</p>
      )
    case "p":
      return <p className="leading-relaxed text-foreground/90 text-pretty">{block.text}</p>
    case "h":
      return (
        <h3 className="mt-2 font-serif text-xl font-semibold text-foreground text-balance">{block.text}</h3>
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
        <div className="overflow-x-auto rounded-lg border border-border bg-card p-1">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {block.head.map((h, i) => (
                  <th
                    key={i}
                    className={cn(
                      "px-3 pb-2 pt-1 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                      i > 0 && "w-px whitespace-nowrap",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <LadderRow key={row.id} id={row.id} label={row.label} />
              ))}
            </tbody>
          </table>
        </div>
      )
    case "fields":
      return (
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
          {block.title && (
            <h4 className="mb-4 font-serif text-lg font-semibold text-foreground text-balance">{block.title}</h4>
          )}
          <div className="space-y-4">
            {block.fields.map((field, i) => (
              <FieldRenderer key={i} field={field} />
            ))}
          </div>
          {block.note && (
            <p className="mt-4 rounded-md bg-muted p-3 text-sm italic leading-relaxed text-muted-foreground text-pretty">
              {block.note}
            </p>
          )}
        </div>
      )
    case "schedule":
      return (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-secondary">
                <th className="px-3 py-2.5 text-left font-semibold text-secondary-foreground">Dia</th>
                {block.cols.map((c, i) => (
                  <th key={i} className="px-3 py-2.5 text-left font-semibold tabular-nums text-secondary-foreground">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">{row.day}</td>
                  {row.tasks.map((task, i) => (
                    <td key={i} className="px-1.5 py-1.5">
                      <ScheduleCell id={`${row.id}-${i}`} text={task} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    default:
      return null
  }
}
