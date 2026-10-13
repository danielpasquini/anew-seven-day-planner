"use client"

import { useEffect, useState } from "react"
import { BookOpen, Calendar, Check, Plus, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { formatDateRangeLocale, getTodayFormatted } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { titleCase } from "@/lib/title-case"
import { CreateGuideModal } from "@/components/create-guide-modal"
import { useModalAccessibility } from "@/components/modal-accessibility"
import { EditGuideSectionsModal } from "@/components/edit-guide-sections-modal"

interface MyGuidesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MyGuidesModal({ isOpen, onClose }: MyGuidesModalProps) {
  const {
    guides,
    activeGuide,
    activeGuideId,
    selectGuide,
    weeks,
    selectWeek,
    createWeek,
    locale,
    t,
    starterIsPreview,
    storageReadOnly,
    activeWeek,
  } = useStore()

  const [selectedGuideId, setSelectedGuideId] = useState<string>(activeGuideId)
  const [newWeekTitle, setNewWeekTitle] = useState("")
  const [newWeekStartDate, setNewWeekStartDate] = useState(getTodayFormatted())
  const [createGuideOpen, setCreateGuideOpen] = useState(false)
  const [sectionsOpen, setSectionsOpen] = useState(false)
  const dialogRef = useModalAccessibility(isOpen, onClose)
  const en = locale === "en-US"
  useEffect(() => { if (isOpen) { setSelectedGuideId(activeGuideId); setNewWeekTitle(""); setNewWeekStartDate(getTodayFormatted()) } }, [isOpen, activeGuideId])

  if (!isOpen) return null

  const currentGuide = guides.find((g) => g.id === selectedGuideId) || activeGuide

  // Weeks belonging to selected guide
  const guideWeeks = weeks.filter((w) => (w.guideId || w.templateId) === currentGuide.id)

  const handleSelectGuide = (guideId: string) => {
    if (storageReadOnly) return
    setSelectedGuideId(guideId)
  }

  const handleCreateWeekForGuide = (e: React.FormEvent) => {
    e.preventDefault()
    if (storageReadOnly || starterIsPreview) return
    const autoTitle = `${t.week.weekNumberLabel} ${guideWeeks.length + 1}`
    createWeek(
      newWeekTitle.trim() || autoTitle,
      newWeekStartDate || getTodayFormatted(),
      currentGuide.id
    )
    setNewWeekTitle("")
    setNewWeekStartDate(getTodayFormatted())
  }

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-guides-modal-title"
    >
      <div className="relative flex w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3.5 sm:px-6 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" aria-hidden="true" />
            <h2 id="my-guides-modal-title" className="font-serif text-lg font-semibold text-foreground">
              {titleCase(t.guide.myGuidesTitle)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition touch-manipulation"
            aria-label={t.common.close}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          <p className="text-sm leading-relaxed text-muted-foreground">{en ? "Use a ready-made week for everyday balance or a personal goal, or create your own. Every preset works without AI." : "Use uma semana pronta para o cotidiano ou um objetivo pessoal, ou crie a sua. Todos os modelos funcionam sem IA."}</p>
          {/* Guide Selector Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {titleCase(t.guide.availableTemplates)} ({guides.length})
              </h3>
              <button
                type="button"
                onClick={() => setCreateGuideOpen(true)}
                disabled={storageReadOnly}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition touch-manipulation shadow-xs"
                title={t.guide.createNewGuideBtn}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                <span>{t.guide.createNewGuideBtn}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {guides.map((guide) => {
                const isSelected = guide.id === selectedGuideId
                const isActive = guide.id === activeGuideId
                const weekCount = weeks.filter((w) => (w.guideId || w.templateId) === guide.id).length

                return (
                  <div
                    key={guide.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handleSelectGuide(guide.id) } }}
                    onClick={() => handleSelectGuide(guide.id)}
                    className={cn(
                      "group relative flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition touch-manipulation",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <BookOpen
                            className={cn(
                              "size-4 shrink-0",
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )}
                            aria-hidden="true"
                          />
                          <h4 className="font-serif text-sm font-semibold text-foreground">
                            {titleCase(guide.title)}
                          </h4>
                        </div>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-bold text-primary shrink-0">
                            <Check className="size-3" aria-hidden="true" /> {t.guide.activeGuideBadge}
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {guide.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/60 text-[0.7rem] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" aria-hidden="true" />
                        {weekCount} {weekCount === 1 ? t.week.weekSingular : t.week.weekPlural}
                      </span>
                      <span className="flex items-center gap-1">
                        {guide.sections.length} {t.common.sections}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Active Guide Detail Card & Weeks */}
          {currentGuide && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-base font-semibold text-foreground">
                      {titleCase(currentGuide.title)}
                    </h3>
                    <span className="rounded bg-secondary px-2 py-0.5 text-[0.7rem] font-medium text-secondary-foreground">
                      v{currentGuide.version || 1}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentGuide.description}
                  </p>
                </div>

                {activeGuideId !== currentGuide.id && (
                  <button
                    type="button"
                    onClick={() => { if (!storageReadOnly && !starterIsPreview) selectGuide(currentGuide.id) }}
                    disabled={storageReadOnly || starterIsPreview}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition touch-manipulation shrink-0"
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                    <span>{t.guide.switchGuide}</span>
                  </button>
                )}
              </div>

              {/* Guide Config & Completion Dimensions */}
              <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer text-sm font-medium">{titleCase(en ? "Optional Guide Details" : "Detalhes Opcionais do Guia")}</summary><div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-lg bg-muted/40 p-3 border border-border space-y-1.5">
                  <span className="font-semibold text-foreground block">{t.guide.analysisDimensionsTitle}:</span>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {currentGuide.completionConfig?.analysisDimensions.map((dim, i) => (
                      <li key={i}>{dim}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 border border-border space-y-1.5">
                  <span className="font-semibold text-foreground block">{t.guide.templateConfig}</span>
                  <div className="text-muted-foreground space-y-1">
                    <p>• <strong>{t.guide.category}:</strong> {currentGuide.config?.category || t.common.general}</p>
                    <p>• <strong>{t.guide.targetAudience}:</strong> {currentGuide.config?.targetAudience || t.common.general}</p>
                    <p>• <strong>{t.guide.theologyActiveLabel}</strong> {currentGuide.theologyEnabled ? t.common.yes : t.common.no}</p>
                    <p>• <strong>{t.guide.sectionsInGuideLabel}</strong> {currentGuide.sections?.length || 0} {t.common.sections}</p>
                  </div>
                </div>
              </div></details>
              {currentGuide.id === activeGuideId && <button type="button" disabled={storageReadOnly || starterIsPreview || activeWeek?.status === "completed"} onClick={() => setSectionsOpen(true)} className="min-h-11 rounded-xl border border-border px-4 text-sm text-primary disabled:opacity-50">{en ? "Customize Sections and Fields" : "Personalizar Seções e Campos"}</button>}

              {/* Create Week for this Guide */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Plus className="size-3.5 text-primary" aria-hidden="true" />
                  {titleCase(t.guide.createWeekForGuide)}: &quot;{titleCase(currentGuide.title)}&quot;
                </h4>

                {starterIsPreview && <p className="text-xs text-muted-foreground">{en ? "Choose Use This Week on the dashboard, or create a new guide, before adding another week." : "Escolha Usar Esta Semana no painel ou crie um novo guia antes de adicionar outra semana."}</p>}
                <form onSubmit={handleCreateWeekForGuide} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="guides-newWeekTitle" className="block text-[0.7rem] font-semibold text-muted-foreground mb-1">
                      {t.week.titleLabel}
                    </label>
                      <input id="guides-newWeekTitle"
                      type="text"
                      placeholder={`${en ? "e.g." : "Ex.:"} ${t.week.weekNumberLabel} ${guideWeeks.length + 1}`}
                      maxLength={100}
                      value={newWeekTitle}
                      onChange={(e) => setNewWeekTitle(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                    />
                  </div>

                  <div>
                    <label htmlFor="guides-newWeekStartDate" className="block text-[0.7rem] font-semibold text-muted-foreground mb-1">
                      {t.week.startDateLabel}
                    </label>
                      <input id="guides-newWeekStartDate"
                      type="date"
                      value={newWeekStartDate}
                      onChange={(e) => setNewWeekStartDate(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={storageReadOnly || starterIsPreview}
                      className="w-full flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition touch-manipulation min-h-[2.5rem]"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      <span>{t.week.createTitle}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Linked Weeks List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {titleCase(t.week.historyTitle)} ({guideWeeks.length})
                </h4>

                {guideWeeks.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground p-3 border border-dashed rounded-lg text-center">
                    {t.week.empty}
                  </p>
                ) : (
                  <div className="divide-y divide-border border rounded-lg bg-card overflow-hidden">
                    {guideWeeks.map((w) => {
                      const rangeStr = formatDateRangeLocale(w.startDate, w.endDate, locale)
                      return (
                        <div
                          key={w.id}
                          className="flex items-center justify-between p-3 text-xs hover:bg-accent/40 transition"
                        >
                          <div>
                            <span className="font-semibold text-foreground">{w.title}</span>
                            <span className="text-muted-foreground ml-2">({rangeStr})</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "rounded px-2 py-0.5 text-[0.65rem] font-bold",
                                w.status === "completed"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {w.status === "completed" ? t.common.completed : t.common.inProgress}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                if (storageReadOnly || starterIsPreview) return
                                selectWeek(w.id)
                                onClose()
                              }}
                              disabled={storageReadOnly || starterIsPreview}
                              className="rounded border border-border bg-card px-2.5 py-1 font-medium hover:bg-accent transition touch-manipulation"
                            >
                              {t.common.open}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3 sm:px-6 shrink-0">
          <span className="text-xs text-muted-foreground">
            {t.guide.activeGuideBadge}: <strong>{titleCase(activeGuide.title)}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition touch-manipulation"
          >
            {t.common.done}
          </button>
        </div>
      </div>

      {/* Create Guide Modal */}
      <CreateGuideModal
        isOpen={createGuideOpen}
        onClose={() => setCreateGuideOpen(false)}
      />
      <EditGuideSectionsModal isOpen={sectionsOpen} onClose={() => setSectionsOpen(false)} />
    </div>
  )
}
