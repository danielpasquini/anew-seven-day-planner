"use client"

import { useEffect, useState } from "react"
import { List, RotateCcw, X } from "lucide-react"
import { intro, scheduleTaskIds, sections } from "@/lib/guide-data"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { SectionCard } from "@/components/section-card"

function ProgressRing({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-11 w-11">
        <svg viewBox="0 0 40 40" className="h-11 w-11 -rotate-90">
          <circle cx="20" cy="20" r="16" fill="none" stroke="var(--muted)" strokeWidth="4" />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 100.53} 100.53`}
            className="transition-[stroke-dasharray] duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[0.7rem] font-semibold tabular-nums text-foreground">
          {pct}%
        </span>
      </div>
      <div className="hidden leading-tight sm:block">
        <p className="text-sm font-semibold text-foreground">Progresso</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {value} de {total} tarefas
        </p>
      </div>
    </div>
  )
}

export function GuideApp() {
  const { ready, doneCount, reset } = useStore()
  const [navOpen, setNavOpen] = useState(false)
  const [active, setActive] = useState(sections[0]?.id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    )
    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  const total = scheduleTaskIds.length
  const done = ready ? doneCount(scheduleTaskIds) : 0

  const handleReset = () => {
    if (window.confirm("Isso apagará todas as suas respostas e marcações salvas neste navegador. Deseja continuar?")) {
      reset()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <a href="#topo" className="flex items-center gap-2 font-serif text-base font-semibold text-primary">
            <span className="hidden sm:inline">Guia de Retomada</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">14 dias</span>
          </a>
          <div className="flex items-center gap-2 sm:gap-4">
            <ProgressRing value={done} total={total} />
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
              aria-label="Reiniciar progresso"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent lg:hidden"
              aria-label="Abrir índice"
            >
              <List className="size-3.5" aria-hidden="true" />
              Índice
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div id="topo" className="scroll-mt-16 border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-gold-foreground">
            Plano pessoal · 14 dias
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-primary text-balance sm:text-5xl">
            {intro.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-serif text-lg italic leading-relaxed text-foreground/80 text-pretty">
            {intro.subtitle}
          </p>

          <div className="mx-auto mt-10 max-w-xl rounded-xl border border-primary/15 bg-card p-6 text-left shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary/70">Oração de abertura</p>
            <p className="font-serif italic leading-relaxed text-foreground/90 text-pretty">{intro.oracao}</p>
            <div className="mt-5 border-t border-border pt-4">
              <p className="font-serif text-sm font-semibold text-primary">{intro.salmo.ref}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80 text-pretty">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  ARA{" "}
                </span>
                {intro.salmo.ara}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80 text-pretty">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  NVT{" "}
                </span>
                {intro.salmo.nvt}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-10 sm:px-6">
        {/* Desktop TOC */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav aria-label="Índice" className="sticky top-20 space-y-1">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Índice</p>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "flex items-baseline gap-2 rounded-md px-3 py-1.5 text-sm transition",
                  active === s.id
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <span className="text-xs tabular-nums text-gold-foreground">{s.number}</span>
                <span className="text-pretty">{s.title}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Sections */}
        <main className="min-w-0 flex-1 space-y-8">
          {sections.map((s) => (
            <SectionCard key={s.id} section={s} />
          ))}
          <footer className="pt-4 text-center">
            <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
              Suas respostas e marcações são salvas automaticamente apenas neste navegador. Nada é enviado a servidores.
            </p>
          </footer>
        </main>
      </div>

      {/* Mobile TOC drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            aria-label="Fechar índice"
            onClick={() => setNavOpen(false)}
          />
          <nav
            aria-label="Índice"
            className="absolute right-0 top-0 h-full w-72 max-w-[85%] overflow-y-auto border-l border-border bg-card p-4 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Índice</p>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setNavOpen(false)}
                  className={cn(
                    "flex items-baseline gap-2 rounded-md px-3 py-2 text-sm transition",
                    active === s.id
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <span className="text-xs tabular-nums text-gold-foreground">{s.number}</span>
                  <span className="text-pretty">{s.title}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
