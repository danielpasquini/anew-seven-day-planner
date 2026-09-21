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
  CheckCircle2,
  Sparkles,
  Check,
  AlertCircle,
  CloudOff,
  RefreshCw,
} from "lucide-react"
import { DEFAULT_GUIDE_TEMPLATE, intro, sections } from "@/lib/guide-data"
import { useStore, type WeekInstance } from "@/lib/store"
import { BibleProvider } from "@/lib/bible/bible-provider"
import { formatDateRangeLocale } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { SectionCard } from "@/components/section-card"
import { CreateWeekModal, DeleteWeekModal } from "@/components/week-modal"
import { SettingsModal } from "@/components/settings-modal"
import { CompleteWeekModal } from "@/components/complete-week-modal"
import { WeekReviewCard } from "@/components/week-review-card"
import { MyGuidesModal } from "@/components/my-guides-modal"
import { MigrationBanner } from "@/components/migration-banner"

export function GuideApp() {
  const {
    weeks,
    activeWeek,
    activeGuide,
    selectWeek,
    hasPrevWeek,
    hasNextWeek,
    prevWeek,
    nextWeek,
    resetActiveWeek,
    theme,
    setTheme,
    locale,
    bibleVersion,
    t,
    saveStatus,
    retrySync,
  } = useStore()

  const [navOpen, setNavOpen] = useState(false)
  const [weeksDrawerOpen, setWeeksDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [myGuidesModalOpen, setMyGuidesModalOpen] = useState(false)
  const [weekToDelete, setWeekToDelete] = useState<WeekInstance | null>(null)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<"semanas" | "programacao" | "aparencia" | "exportacao">("semanas")
  const [activeSection, setActiveSection] = useState(sections[0]?.id)
  const [showMigrationBanner, setShowMigrationBanner] = useState(false)

  const guideSections = activeGuide.sections || sections
  const guideIntro = activeGuide.intro || intro

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    )
    for (const s of guideSections) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [guideSections])

  const handleReset = () => {
    if (window.confirm(t.hero.resetWeekConfirm)) {
      resetActiveWeek()
    }
  }

  const dateRangeStr = activeWeek
    ? formatDateRangeLocale(activeWeek.startDate, activeWeek.endDate, locale)
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
                {activeGuide ? activeGuide.title : DEFAULT_GUIDE_TEMPLATE.title}
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
                className="flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/8 px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition touch-manipulation max-w-[8rem] sm:max-w-[14rem]"
                title="Trocar de semana"
              >
                <Calendar className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{activeWeek.title}</span>
                {activeWeek.status === "completed" ? (
                  <span className="rounded bg-primary/20 text-[0.65rem] px-1 py-0.2 font-bold shrink-0">
                    {t.common.completed} · {activeWeek.progresso.percentual}%
                  </span>
                ) : (
                  <span className="hidden lg:inline text-[0.7rem] font-normal text-primary/70 shrink-0">
                    ({dateRangeStr})
                  </span>
                )}
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
            {/* Realtime Save / Sync Status Badge */}
            {saveStatus !== "idle" && (
              <div
                className={cn(
                  "hidden sm:flex items-center gap-1 rounded-md px-2 py-1 text-[0.7rem] font-medium transition",
                  saveStatus === "saving" && "bg-primary/10 text-primary",
                  saveStatus === "saved" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                  saveStatus === "error" && "bg-destructive/10 text-destructive cursor-pointer hover:bg-destructive/20",
                  saveStatus === "offline" && "bg-muted text-muted-foreground"
                )}
                onClick={saveStatus === "error" ? retrySync : undefined}
                title={saveStatus === "error" ? t.sync.retry : undefined}
                role={saveStatus === "error" ? "button" : undefined}
                tabIndex={saveStatus === "error" ? 0 : undefined}
              >
                {saveStatus === "saving" && <RefreshCw className="size-3 animate-spin" aria-hidden="true" />}
                {saveStatus === "saved" && <Check className="size-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
                {saveStatus === "error" && <AlertCircle className="size-3" aria-hidden="true" />}
                {saveStatus === "offline" && <CloudOff className="size-3" aria-hidden="true" />}
                <span>
                  {saveStatus === "saving" && t.sync.saving}
                  {saveStatus === "saved" && t.sync.saved}
                  {saveStatus === "error" && t.sync.error}
                  {saveStatus === "offline" && t.sync.offline}
                </span>
              </div>
            )}

            {/* Completar Semana */}
            {activeWeek && activeWeek.status === "active" && (
              <button
                type="button"
                onClick={() => setCompleteModalOpen(true)}
                className="flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition touch-manipulation"
                aria-label={t.nav.completeWeek}
              >
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t.nav.completeWeek}</span>
                <span className="sm:hidden">{t.common.completed}</span>
              </button>
            )}

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
              <span className="hidden md:inline text-xs font-semibold capitalize">
                {theme === "light" ? "Claro" : theme === "dark" ? "Escuro" : "Sistema"}
              </span>
            </button>

            {/* Meus Guias */}
            <button
              type="button"
              onClick={() => setMyGuidesModalOpen(true)}
              className="flex size-8 min-w-[2rem] items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent hover:border-primary/40 transition touch-manipulation sm:h-auto sm:w-auto sm:px-2.5 sm:py-1.5 sm:gap-1.5"
              title={t.nav.myGuides}
              aria-label={t.nav.myGuides}
            >
              <BookOpen className="size-3.5 text-primary shrink-0" aria-hidden="true" />
              <span className="hidden md:inline text-xs font-semibold">{t.nav.myGuides}</span>
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => {
                setSettingsTab("semanas")
                setSettingsModalOpen(true)
              }}
              className="flex size-8 min-w-[2rem] items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent hover:border-primary/40 transition touch-manipulation sm:h-auto sm:w-auto sm:px-2.5 sm:py-1.5 sm:gap-1.5"
              title={t.nav.settings}
              aria-label={t.nav.settings}
            >
              <Settings className="size-3.5 text-primary shrink-0" aria-hidden="true" />
              <span className="hidden md:inline text-xs font-semibold">{t.nav.settings}</span>
            </button>

            {/* Nova Semana */}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition touch-manipulation"
              aria-label={t.nav.newWeek}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              <span>{t.nav.newWeek}</span>
            </button>

            {/* Mobile: Weeks drawer */}
            <button
              type="button"
              onClick={() => setWeeksDrawerOpen(true)}
              className="flex size-8 min-w-[2rem] items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:bg-accent lg:hidden touch-manipulation"
              aria-label={t.nav.weeks}
              title={t.nav.weeks}
            >
              <Calendar className="size-4" aria-hidden="true" />
            </button>

            {/* Mobile: TOC drawer */}
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="flex size-8 min-w-[2rem] items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:bg-accent lg:hidden touch-manipulation"
              aria-label={t.nav.index}
              title={t.nav.index}
            >
              <List className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div id="topo" className="scroll-mt-16 border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-3xl px-4 py-8 text-center sm:px-6 sm:py-14">
          <div className="mb-4 inline-flex items-center gap-2 flex-wrap justify-center rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-foreground">
            <Calendar className="size-3" aria-hidden="true" />
            <span>
              {activeWeek ? `${activeWeek.title} · ${dateRangeStr}` : "Período de 7 dias"}
            </span>
            {activeWeek?.status === "completed" && (
              <span className="rounded bg-primary/20 text-primary px-2 py-0.2 text-[0.65rem] font-bold">
                {t.common.completed} · {activeWeek.progresso.percentual}%
              </span>
            )}
          </div>

          <h1 className="font-serif text-2xl font-semibold leading-tight text-primary text-balance sm:text-4xl md:text-5xl">
            {activeGuide.title}
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-serif text-sm italic leading-relaxed text-foreground/90 text-pretty sm:text-base sm:mt-4 md:text-lg">
            {activeGuide.description || t.hero.subtitle}
          </p>

          {/* Action button in Hero if week is active */}
          {activeWeek && activeWeek.status === "active" && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCompleteModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition touch-manipulation"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                <span>{t.nav.completeWeek}</span>
              </button>
            </div>
          )}

          {/* Prayer & Psalm (Only when theologyEnabled is true) */}
          {activeGuide.theologyEnabled && activeGuide.intro?.oracao && (
            <div className="mx-auto mt-6 max-w-xl rounded-xl border border-primary/20 bg-card/80 p-4 sm:p-5 shadow-xs text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-primary/80 mb-1">
                {t.scripture.prayer}
              </p>
              <p className="font-serif text-sm italic leading-relaxed text-foreground/90 text-pretty">
                &quot;{activeGuide.intro.oracao}&quot;
              </p>

              {activeGuide.intro.salmo && (
                <div className="mt-3 pt-3 border-t border-border/80">
                  <p className="text-xs font-semibold text-primary mb-1">
                    {activeGuide.intro.salmo.ref}
                  </p>
                  <p className="font-serif text-xs italic leading-relaxed text-muted-foreground text-pretty">
                    {BibleProvider.resolvePassage(activeGuide.intro.salmo.ref, bibleVersion, locale).text || activeGuide.intro.salmo.ara}
                  </p>
                </div>
              )}
            </div>
          )}
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
                <h3 className="font-serif text-sm font-semibold text-foreground">{t.nav.weeks}</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition shadow-xs touch-manipulation"
              >
                <Plus className="size-3" aria-hidden="true" />
                <span>{t.common.create}</span>
              </button>
            </div>

            <div className="mt-3 space-y-1.5 max-h-[28vh] overflow-y-auto pr-1">
              {weeks.map((w) => {
                const isActive = w.id === activeWeek?.id
                const isCompleted = w.status === "completed"
                const range = formatDateRangeLocale(w.startDate, w.endDate, locale)

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
                          <span className="rounded-full bg-primary text-primary-foreground px-1.5 py-0.2 text-[0.6rem] font-bold">
                            {t.common.active}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="rounded bg-primary/15 text-primary px-1.5 py-0.2 text-[0.6rem] font-medium">
                            {t.common.completed} · {w.progresso.percentual}%
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
                {t.nav.index}
              </p>
              <nav aria-label={t.nav.index} className="space-y-0.5 max-h-[38vh] overflow-y-auto pr-1">
                {activeGuide.sections.map((s) => (
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
          {/* Local Data Cloud Migration Banner */}
          {showMigrationBanner && (
            <MigrationBanner onDismiss={() => setShowMigrationBanner(false)} />
          )}

          {/* Week Review Card (when completed) */}
          <WeekReviewCard />

          {activeGuide.sections.map((s) => (
            <SectionCard key={s.id} section={s} />
          ))}

          <footer className="pt-6 text-center border-t border-border/60">
            <p className="text-xs text-muted-foreground">
              {activeGuide.title} · {t.guide.answersSavedLocally}
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
                  <h3 className="font-serif text-base font-semibold text-foreground">{t.nav.weeks}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setWeeksDrawerOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label={t.common.close}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setWeeksDrawerOpen(false)
                    setCreateModalOpen(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-3 text-xs sm:text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition touch-manipulation min-h-[2.5rem]"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  <span>{t.nav.newWeek}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWeeksDrawerOpen(false)
                    setMyGuidesModalOpen(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 px-3 text-xs sm:text-sm font-semibold text-foreground hover:bg-accent transition touch-manipulation min-h-[2.5rem]"
                >
                  <BookOpen className="size-4 text-primary" aria-hidden="true" />
                  <span>{t.nav.myGuides}</span>
                </button>
              </div>

              <div className="space-y-2">
                {weeks.map((w) => {
                  const isActive = w.id === activeWeek?.id
                  const isCompleted = w.status === "completed"
                  const range = formatDateRangeLocale(w.startDate, w.endDate, locale)

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
                              {t.common.active}
                            </span>
                          )}
                          {isCompleted && (
                            <span className="rounded bg-primary/15 text-primary px-2 py-0.5 text-[0.65rem] font-medium">
                              {t.common.completed} · {w.progresso.percentual}%
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
                <span>{t.hero.resetWeekAnswers}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Index TOC Drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t.nav.sections}>
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-xs"
            aria-hidden="true"
            onClick={() => setNavOpen(false)}
          />
          <nav
            aria-label={t.nav.index}
            className="absolute right-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto border-l border-border bg-card p-4 shadow-xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 1rem)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.nav.sections}</p>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={t.common.close}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            {/* Mobile TOC list */}
            <div className="p-4 space-y-1 overflow-y-auto">
              {activeGuide.sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setNavOpen(false)}
                  className={cn(
                    "flex items-baseline gap-2.5 rounded-lg px-3 py-2 text-sm transition touch-manipulation",
                    activeSection === s.id
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <span className="text-xs font-semibold tabular-nums text-gold-foreground">{s.number}</span>
                  <span className="truncate">{s.title}</span>
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

      <CompleteWeekModal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        initialTab={settingsTab}
      />
      {/* My Guides Modal */}
      <MyGuidesModal
        isOpen={myGuidesModalOpen}
        onClose={() => setMyGuidesModalOpen(false)}
      />
    </div>
  )
}
