"use client"

import type { Section } from "@/lib/guide-data"
import { BlockRenderer } from "@/components/blocks"
import { ScriptureBlock } from "@/components/scripture"
import { useStore } from "@/lib/store"
import { titleCase } from "@/lib/title-case"

export function SectionCard({ section, preview = false, collapsed = false }: { section: Section; preview?: boolean; collapsed?: boolean }) {
  const { activeGuide } = useStore()
  const heading = <><span className="mr-3 font-mono text-xs text-primary">{section.number}</span><span className="font-serif text-lg font-medium sm:text-xl">{titleCase(section.title)}</span></>
  const content = <div className="space-y-6 px-5 py-6 text-sm leading-relaxed sm:px-8 sm:py-8 sm:text-base">{section.blocks.map((block, index) => <BlockRenderer key={index} block={block} preview={preview} />)}{!preview && activeGuide.theologyEnabled && section.scripture && <ScriptureBlock scripture={section.scripture} />}</div>
  if (collapsed) return <section id={section.id} className="section-card scroll-mt-24" aria-label={section.title}><details className="overflow-hidden rounded-2xl border border-border bg-card"><summary className="cursor-pointer px-5 py-5 sm:px-8">{heading}</summary>{content}</details></section>
  return (
    <section id={section.id} className="section-card scroll-mt-36 lg:scroll-mt-24" aria-labelledby={`${section.id}-title`}>
      <article className="overflow-hidden rounded-[20px] border border-border bg-card">
        <header className="border-b border-border/70 px-5 py-5 sm:px-8 sm:py-7">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs tabular-nums text-primary">
              {section.number}
            </span>
            <span className="eyebrow text-muted-foreground">
              {section.kicker}
            </span>
          </div>
          <h2 id={`${section.id}-title`} className="mt-3 font-serif text-2xl font-medium leading-tight tracking-tight text-foreground text-balance sm:text-3xl">
            {titleCase(section.title)}
          </h2>
        </header>

        <div className="space-y-6 px-5 py-6 text-sm leading-relaxed sm:px-8 sm:py-8 sm:text-base">
          {section.blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} preview={preview} />
          ))}
          {!preview && activeGuide.theologyEnabled && section.scripture && <ScriptureBlock scripture={section.scripture} />}
        </div>
      </article>
    </section>
  )
}
