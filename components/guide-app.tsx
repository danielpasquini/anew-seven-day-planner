"use client"

import { useEffect, useState } from "react"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  RotateCcw,
  Trash2,
  X,
  BookOpen,
  Settings,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"
import { DEFAULT_GUIDE_TEMPLATE, intro, sections } from "@/lib/guide-data"
import { useStore, type WeekInstance } from "@/lib/store"
import { formatDateRangeBR } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { SectionCard } from "@/components/section-card"
import { CreateWeekModal, DeleteWeekModal } from "@/components/week-modal"
import { SettingsModal } from "@/components/settings-modal"

export function GuideApp() {
  const {
    weeks,
    activeWeek,
    selectWeek,
    hasPrevWeek,
    hasNextWeek,
    prevWeek,
    nextWeek,
    resetActiveWeek,
    theme,
    setTheme,
  } = useStore()

  const [navOpen, setNavOpen] = useState(false)
  const [weeksDrawerOpen, setWeeksDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [weekToDelete, setWeekToDelete] = useState<WeekInstance | null>(null)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<"semanas" | "programacao" | "aparencia" | "exportacao">("semanas")
  const [activeSection, setActiveSection] = useState(sections[0]?.id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
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

  const handleReset = () => {
    if (
      window.confirm(
        `Isso apagará todas as respostas e tarefas salvas APENAS para a "${
          activeWeek?.title ?? "semana atual"
        }". Deseja continuar?`
      )
    ) {
      resetActiveWeek()
    }
  }

  const dateRangeStr = activeWeek
    ? formatDateRangeBR(activeWeek.startDate, activeWeek.endDate)
    : ""

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky header — safe-area-top handled via pt in inner div */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        {/* Safe area top padding for iOS notch */}
        <div
          className="mx-auto flex max-w-7xl items-center justify-between gap-1.5 px-3 py-2 sm:gap-2 sm:px-6 sm:py-2.5"
          style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top, 0.5rem))" }}
        >
          {/* Logo & Guide Template Title */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            <a
              href="#topo"
              className="flex items-center gap-2 font-serif text-sm font-semibold text-primary min-w-0"
            >
              <BookOpen className="size-4 hidden sm:block text-primary shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[7rem] xs:max-w-none sm:max-w-[14rem]">
                {DEFAULT_GUIDE_TEMPLATE.title}
              </span>
            </a>
          </div>

          {/* Week Selector — visible on all sizes */}
          {activeWeek && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={prevWeek}
                disabled={!hasPrevWeek}
                className={cn(
                  "flex size-8 min-w-[2rem] items-center justify-center rounded-md border border-border bg-card transition touch-manipulation",
                  hasPrevWeek
                    ? "text-foreground hover:bg-accent cursor-pointer"
                    : "text-muted-foreground border-border/50 cursor-not-allowed"
                )}
                aria-label="Semana anterior"
                title="Semana anterior"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setWeeksDrawerOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/8 px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition touch-manipulation max-w-[7rem] sm:max-w-[12rem]"
                title="Trocar de semana"
              >
                <Calendar className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{activeWeek.title}</span>
                <span className="hidden lg:inline text-[0.7rem] font-normal text-primary/70 shrink-0">
                  ({dateRangeStr})
                </span>
              </button>

              <button
                type="button"
                onClick={nextWeek}
                disabled={!hasNextWeek}
                className={cn(
                  "flex size-8 min-w-[2rem] items-center justify-center rounded-md border border-border bg-card transition touch-manipulation",
                  hasNextWeek
                    ? "text-foreground hover:bg-accent cursor-pointer"
                    : "text-muted-foreground border-border/50 cursor-not-allowed"
                )}
                aria-label="Próxima semana"
                title="Próxima semana"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Theme toggle — icon only on mobile */}
            <button
              type="button"
              onClick={() => {
                const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
                setTheme(nextTheme)
              }}
              className="flex size-8 min-w-[2rem] items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent hover:border-primary/40 transition touch-manipulation sm:h-auto sm:w-auto sm:px-2.5 sm:py-1.5 sm:gap-1.5"
              title={`Tema: ${theme === "light" ? "Claro" : theme === "dark" ? "Escuro" : "Sistema"}. Clique para alterar.`}
              aria-label="Alternar modo de exibição"
            >
              {theme === "light" && <Sun className="size-3.5 text-amber-500 shrink-0" aria-hidden="true" />}
              {theme === "dark" && <Moon className="size-3.5 text-indigo-400 shrink-0" aria-hidden="true" />}
              {theme === "system" && <Monitor className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />}
              <span className="hidden sm:inline text-xs font-semibold capitalize">
                {theme === "light" ? "Claro" : theme === "dark" ? "Escuro" : "Sistema"}
              </span>
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => {
                setSettingsTab("semanas")
                setSettingsModalOpen(true)
              }}
              className="flex size-8 min-w-[2rem] items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent hover:border-primary/40 transition touch-manipulation sm:h-auto sm:w-auto sm:px-2.5 sm:py-1.5 sm:gap-1.5"
              title="Abrir configurações do aplicativo"
              aria-label="Configurações"
            >
              <Settings className="size-3.5 text-primary shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline text-xs font-semibold">Configurações</span>
            </button>

            {/* Nova Semana */}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 touch-manipulation"
              aria-label="Nova semana"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              <span>Nova Semana</span>
            </button>

            {/* Reiniciar — desktop only */}
            <button
              type="button"
              onClick={handleReset}
              className="hidden lg:flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-destructive/40 hover:text-destructive touch-manipulation"
              title="Limpar respostas desta semana"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span>Reiniciar</span>
            </button>

            {/* Mobile: Weeks drawer */}
            <button
              type="button"
              onClick={() => setWeeksDrawerOpen(true)}
              className="flex size-8 min-w-[2rem] items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:bg-accent lg:hidden touch-manipulation"
              aria-label="Gerenciar semanas"
              title="Semanas"
            >
              <Calendar className="size-4" aria-hidden="true" />
            </button>

            {/* Mobile: TOC drawer */}
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="flex size-8 min-w-[2rem] items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:bg-accent lg:hidden touch-manipulation"
              aria-label="Abrir índice"
              title="Índice"
            >
              <List className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div id="topo" className="scroll-mt-16 border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-3xl px-4 py-8 text-center sm:px-6 sm:py-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-foreground">
            <Calendar className="size-3" aria-hidden="true" />
            <span>
              {activeWeek ? `${activeWeek.title} · ${dateRangeStr}` : "Período de 7 dias"}
            </span>
          </div>

          <h1 className="font-serif text-2xl font-semibold leading-tight text-primary text-balance sm:text-4xl md:text-5xl">
            {intro.title}
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-serif text-sm italic leading-relaxed text-foreground/90 text-pretty sm:text-base sm:mt-4 md:text-lg">
            {intro.subtitle}
          </p>

          <div className="mx-auto mt-6 max-w-xl rounded-xl border border-primary/15 bg-card p-4 text-left shadow-xs sm:mt-8 sm:p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary/80">Oração de abertura</p>
            <p className="font-serif text-sm italic leading-relaxed text-foreground text-pretty sm:text-base">
              {intro.oracao}
            </p>
            <div className="mt-4 border-t border-border pt-4">
              <p className="font-serif text-sm font-semibold text-primary">{intro.salmo.ref}</p>
              <p className="mt-2 text-xs leading-relaxed text-foreground/80 text-pretty sm:text-sm">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  ARA{" "}
                </span>
                {intro.salmo.ara}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-foreground/80 text-pretty sm:text-sm">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  NVT{" "}
                </span>
                {intro.salmo.nvt}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Layout */}
      <div className="mx-auto flex max-w-7xl gap-6 px-3 py-6 sm:gap-8 sm:px-6 sm:py-8">
        {/* Desktop Left Sidebar */}
        <aside className="hidden w-64 shrink-0 xl:block xl:w-72 space-y-6">
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-4 text-primary" aria-hidden="true" />
                <h3 className="font-serif text-sm font-semibold text-foreground">Semanas</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition shadow-xs touch-manipulation"
              >
                <Plus className="size-3" aria-hidden="true" />
                <span>Nova</span>
              </button>
            </div>

            <div className="mt-3 space-y-1.5 max-h-[28vh] overflow-y-auto pr-1">
              {weeks.map((w) => {
                const isActive = w.id === activeWeek?.id
                const range = formatDateRangeBR(w.startDate, w.endDate)

                return (
                  <div
                    key={w.id}
                    className={cn(
                      "group relative flex items-center justify-between rounded-lg border p-2.5 transition cursor-pointer",
                      isActive
                        ? "border-primary bg-primary/8 shadow-xs"
                        : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
                    )}
                    onClick={() => selectWeek(w.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && selectWeek(w.id)}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn("text-xs font-semibold", isActive ? "text-primary" : "text-foreground")}>
                          {w.title}
                        </span>
                        {isActive && (
                          <span className="rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 text-[0.6rem] font-bold">
                            Atual
                          </span>
                        )}
                      </div>
                      <p className="text-[0.7rem] text-muted-foreground mt-0.5">{range}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      {weeks.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setWeekToDelete(w)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition rounded"
                          title="Excluir semana"
                          aria-label={`Excluir ${w.title}`}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Table of Contents */}
            <div className="mt-5 pt-4 border-t border-border">
              <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Índice de Seções
              </p>
              <nav aria-label="Índice de seções" className="space-y-0.5 max-h-[38vh] overflow-y-auto pr-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={cn(
                      "flex items-baseline gap-2 rounded-md px-2.5 py-1.5 text-xs transition",
                      activeSection === s.id
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    <span className="text-[0.68rem] tabular-nums text-gold-foreground shrink-0">{s.number}</span>
                    <span className="truncate">{s.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content Sections */}
        <main className="min-w-0 flex-1 space-y-6 sm:space-y-8">
          {sections.map((s) => (
            <SectionCard key={s.id} section={s} />
          ))}

          <footer className="pt-6 text-center border-t border-border/60">
            <p className="text-xs text-muted-foreground">
              Guia Pessoal de Retomada · As respostas desta semana ({activeWeek?.title}) ficam salvas isoladamente neste navegador.
            </p>
          </footer>
        </main>
      </div>

      {/* Mobile Weeks Switcher Drawer */}
      {weeksDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Semanas do Guia">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-xs"
            aria-hidden="true"
            onClick={() => setWeeksDrawerOpen(false)}
          />
          <div
            className="absolute right-0 top-0 h-full w-80 max-w-[88vw] overflow-y-auto border-l border-border bg-card shadow-2xl flex flex-col"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-primary" aria-hidden="true" />
                  <h3 className="font-serif text-base font-semibold text-foreground">Semanas do Guia</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setWeeksDrawerOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Fechar"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setWeeksDrawerOpen(false)
                    setCreateModalOpen(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 px-3 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition touch-manipulation"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  <span>Criar Nova Semana</span>
                </button>
              </div>

              <div className="space-y-2">
                {weeks.map((w) => {
                  const isActive = w.id === activeWeek?.id
                  const range = formatDateRangeBR(w.startDate, w.endDate)

                  return (
                    <div
                      key={w.id}
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-3 transition touch-manipulation cursor-pointer",
                        isActive
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border bg-card hover:bg-accent/50"
                      )}
                      onClick={() => {
                        selectWeek(w.id)
                        setWeeksDrawerOpen(false)
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { selectWeek(w.id); setWeeksDrawerOpen(false) }
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-sm font-semibold", isActive ? "text-primary" : "text-foreground")}>
                            {w.title}
                          </span>
                          {isActive && (
                            <span className="rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[0.65rem] font-bold">
                              Ativa
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{range}</p>
                      </div>

                      {weeks.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setWeekToDelete(w)
                          }}
                          className="ml-2 p-2 min-w-[2.5rem] min-h-[2.5rem] flex items-center justify-center text-muted-foreground hover:text-destructive transition rounded-md"
                          title="Excluir semana"
                          aria-label={`Excluir ${w.title}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div
              className="px-4 py-4 border-t border-border bg-card"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}
            >
              <button
                type="button"
                onClick={() => {
                  setWeeksDrawerOpen(false)
                  handleReset()
                }}
                className="w-full flex items-center justify-center gap-2 rounded-md border border-border py-3 text-sm font-medium text-muted-foreground hover:text-destructive hover:border-destructive/40 transition touch-manipulation"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                <span>Reiniciar Respostas desta Semana</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Index TOC Drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Índice de seções">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-xs"
            aria-hidden="true"
            onClick={() => setNavOpen(false)}
          />
          <nav
            aria-label="Índice"
            className="absolute right-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto border-l border-border bg-card p-4 shadow-xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 1rem)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Índice de Seções</p>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Fechar índice"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-0.5">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setNavOpen(false)}
                  className={cn(
                    "flex items-baseline gap-2 rounded-md px-3 py-2.5 text-sm transition touch-manipulation",
                    activeSection === s.id
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <span className="text-xs tabular-nums text-gold-foreground shrink-0">{s.number}</span>
                  <span className="text-pretty">{s.title}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* Modals */}
      <CreateWeekModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <DeleteWeekModal
        week={weekToDelete}
        isOpen={Boolean(weekToDelete)}
        onClose={() => setWeekToDelete(null)}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        initialTab={settingsTab}
      />
    </div>
  )
}
