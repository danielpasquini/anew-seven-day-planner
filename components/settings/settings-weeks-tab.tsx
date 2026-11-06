"use client"

import { useState } from "react"
import { AlertTriangle, Plus, Trash2 } from "lucide-react"
import { useStore, type WeekInstance } from "@/lib/store"
import { formatDateRangeLocale } from "@/lib/date-utils"
import { titleCase } from "@/lib/title-case"
import { cn } from "@/lib/utils"

interface SettingsWeeksTabProps {
  onCreateWeek: () => void
}

export function SettingsWeeksTab({ onCreateWeek }: SettingsWeeksTabProps) {
  const { weeks, activeWeek, selectWeek, deleteWeek, locale, t } = useStore()
  const [deletingWeek, setDeletingWeek] = useState<WeekInstance | null>(null)

  const handleConfirmDeleteWeek = () => {
    if (deletingWeek) {
      deleteWeek(deletingWeek.id)
      setDeletingWeek(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-base font-semibold text-foreground">
          {titleCase(t.settings.semanasTab.title)}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.settings.semanasTab.desc}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {locale === "en-US"
            ? "Start with your previous setup and notes, then choose the pace that fits this week."
            : "Comece com suas escolhas e anotações anteriores e escolha o ritmo que cabe nesta semana."}
        </p>
        <button type="button" onClick={onCreateWeek} className="primary-button">
          <Plus className="size-4" aria-hidden="true" />
          {locale === "en-US" ? "Add Week" : "Adicionar Semana"}
        </button>
      </div>

      {/* Confirm Delete Dialog */}
      {deletingWeek && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h4 className="text-sm font-semibold text-destructive">
                {titleCase(t.settings.semanasTab.confirmDeletePrefix)} &quot;{deletingWeek.title}&quot;?
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {t.week.deleteDesc} ({formatDateRangeLocale(deletingWeek.startDate, deletingWeek.endDate, locale)}).
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeletingWeek(null)}
              className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition touch-manipulation"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteWeek}
              className="rounded-md bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition shadow-xs touch-manipulation"
            >
              {t.week.deleteConfirm}
            </button>
          </div>
        </div>
      )}

      {/* List of Existing Weeks */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold tracking-wider text-muted-foreground">
          {locale === "en-US" ? "My Weeks" : "Minhas Semanas"} ({weeks.length})
        </h4>

        <div className="grid grid-cols-1 gap-2.5">
          {weeks.map((w) => {
            const isActive = w.id === activeWeek?.id
            const rangeStr = formatDateRangeLocale(w.startDate, w.endDate, locale)
            const countedActivities = w.programacao.activities.filter((activity) => activity.countsTowardCompletion !== false)
            const completedCount = countedActivities.filter((activity) => Boolean(w.data.done[activity.id])).length

            return (
              <div
                key={w.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition",
                  isActive
                    ? "border-primary bg-primary/8 shadow-xs"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif text-sm font-semibold text-foreground">
                      {w.title}
                    </span>
                    {isActive && (
                      <span className="rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[0.65rem] font-bold">
                        {locale === "en-US" ? "Selected" : "Selecionada"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.common.period} <span className="font-medium text-foreground">{rangeStr}</span>
                  </p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-[0.7rem] font-medium text-muted-foreground">
                      {countedActivities.length === 0 ? t.schedule.noCompletionTarget : `${completedCount}/${countedActivities.length} ${t.common.tasks}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => selectWeek(w.id)}
                      className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition touch-manipulation min-h-[2.25rem]"
                    >
                      {t.common.open}
                    </button>
                  )}

                  {weeks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDeletingWeek(w)}
                      className="rounded-md border border-border p-2 text-muted-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition touch-manipulation min-w-[2.25rem] min-h-[2.25rem] flex items-center justify-center"
                      title={t.common.delete}
                      aria-label={`${t.common.delete} ${w.title}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
