"use client"

import type { Section } from "@/lib/guide-data"
import { BlockRenderer } from "@/components/blocks"
import { ScriptureBlock } from "@/components/scripture"

export function SectionCard({ section }: { section: Section }) {
  return (
    <section id={section.id} className="scroll-mt-24">
      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <header className="border-b border-border bg-secondary/50 px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl font-semibold tabular-nums text-gold-foreground">
              {section.number}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
              {section.kicker}
            </span>
          </div>
          <h2 className="mt-1.5 font-serif text-2xl font-semibold leading-tight text-foreground text-balance sm:text-3xl">
            {section.title}
          </h2>
        </header>

        <div className="space-y-5 px-5 py-6 sm:px-8 sm:py-8">
          {section.blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
          {section.scripture && <ScriptureBlock scripture={section.scripture} />}
        </div>
      </article>
    </section>
  )
}
