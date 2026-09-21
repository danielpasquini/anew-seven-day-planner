"use client"

import { CheckCircle2, X, Sparkles } from "lucide-react"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

type CompleteWeekModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function CompleteWeekModal({ isOpen, onClose }: CompleteWeekModalProps) {
  const { activeWeek, completeWeek, isGeneratingAI, locale, t } = useStore()

  if (!isOpen || !activeWeek) return null

  const activities = activeWeek.programacao?.activities || []
  const countableActivities = activities.filter((a) => a.countsTowardCompletion !== false)
  const totalTasks = countableActivities.length
  const completedTasks = countableActivities.filter((a) => Boolean(activeWeek.data.done[a.id])).length
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const handleConfirm = async () => {
    await completeWeek(activeWeek.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-week-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 1.25rem))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </div>
            <h3 id="complete-week-title" className="font-serif text-lg font-semibold text-foreground">
              {t.review.formalCompletionTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition touch-manipulation"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content & Snapshot Summary */}
        <div className="space-y-3">
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {t.review.concludingNoticePrefix} &quot;{activeWeek.title}&quot;. {t.review.concludingNoticeSuffix}
          </p>

          {/* Progress Card Snapshot */}
          <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground">{t.review.snapshotTitle}:</span>
              <span className="text-primary font-mono">{percentage}% {t.common.completed}</span>
            </div>

            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border/50">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[0.75rem] text-muted-foreground pt-1">
              <span>{t.review.activeCountableTasks}</span>
              <span className="font-medium text-foreground">
                {completedTasks} {t.common.of} {totalTasks} ({percentage}%)
              </span>
            </div>
          </div>

          <p className="text-[0.75rem] italic text-muted-foreground/90">
            {t.review.completionProgressPhilosophy}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isGeneratingAI}
            className="rounded-md border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition touch-manipulation disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isGeneratingAI}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition touch-manipulation disabled:opacity-50"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            <span>{t.common.confirm}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
