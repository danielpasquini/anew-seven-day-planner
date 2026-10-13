import { titleCase } from "@/lib/title-case"
import { ArrowLeft } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { LEGAL_UPDATED_AT, LEGAL_VERSION } from '@/lib/legal'

type LegalSection = {
  id: string
  title: string
  paragraphs: string[]
  points?: string[]
}

export function LegalDocument({ title, introduction, sections }: {
  title: string
  introduction: string
  sections: LegalSection[]
}) {
  return (
    <main id="content" lang="en" className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <a href="/" className="inline-flex min-h-11 items-center gap-2 rounded-md font-serif text-2xl font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <BrandMark className="size-7" /> Anew
        </a>
        <a href="/" className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to the App
        </a>
      </header>
      <article className="py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Clarity and informed choices</p>
        <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight sm:text-5xl">{titleCase(title)}</h1>
        <p className="mt-4 text-sm text-muted-foreground">Version {LEGAL_VERSION} · Updated {LEGAL_UPDATED_AT}</p>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">{introduction}</p>
        <nav aria-label="Document sections" className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <p className="font-semibold">In This Document</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {sections.map(section => <li key={section.id}><a href={`#${section.id}`} className="inline-flex min-h-10 items-center rounded-md text-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{titleCase(section.title)}</a></li>)}
          </ul>
        </nav>
        <div className="mt-10 space-y-10">
          {sections.map(section => <section key={section.id} id={section.id} aria-labelledby={`${section.id}-titulo`} className="scroll-mt-6">
            <h2 id={`${section.id}-titulo`} className="font-serif text-2xl font-medium sm:text-3xl">{titleCase(section.title)}</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
              {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              {section.points && <ul className="list-disc space-y-2 pl-5">{section.points.map(point => <li key={point}>{point}</li>)}</ul>}
            </div>
          </section>)}
        </div>
      </article>
      <footer className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border py-6 text-sm">
        <a href="/termos" className="inline-flex min-h-11 items-center rounded-md text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Terms of Use and Health Notice</a>
        <a href="/privacidade" className="inline-flex min-h-11 items-center rounded-md text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Privacy Notice</a>
        <a href="/delete-account" className="inline-flex min-h-11 items-center rounded-md text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Delete Account</a>
      </footer>
    </main>
  )
}
