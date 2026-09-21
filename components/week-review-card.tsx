"use client"

import {
  CheckCircle2,
  Sparkles,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Target,
  Check,
  AlertTriangle,
  Lightbulb,
} from "lucide-react"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function WeekReviewCard() {
  const { activeWeek, reopenWeek, generateAIReview, isGeneratingAI, aiError, locale, t } = useStore()

  if (!activeWeek || activeWeek.status !== "completed") return null

  const snapshot = activeWeek.completionSnapshot
  const review = activeWeek.aiReview
  const isOutdated = activeWeek.aiReviewOutdated

  const completedDateStr = activeWeek.completedAt
    ? new Date(activeWeek.completedAt).toLocaleDateString(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : ""

  return (
    <div className="space-y-4 rounded-2xl border border-primary/20 bg-card p-4 sm:p-6 shadow-sm">
      {/* Banner Top: Status & Reopen Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-serif text-base sm:text-lg font-semibold text-foreground">
                {t.hero.weekCompleted}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                {snapshot ? `${snapshot.completionPercentage}% ${t.common.completed}` : t.common.completed}
              </span>
            </div>
            {completedDateStr && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.review.formalClosureRecorded} {completedDateStr}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => reopenWeek(activeWeek.id)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition touch-manipulation min-h-[2.25rem]"
            title={t.nav.reopenWeek}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span>{t.nav.reopenWeek}</span>
          </button>
        </div>
      </div>

      {/* Outdated Notice Banner */}
      {isOutdated && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>{t.review.outdatedAlert}</span>
          </div>
          <button
            type="button"
            onClick={() => generateAIReview(activeWeek.id)}
            disabled={isGeneratingAI}
            className="flex items-center gap-1 rounded-md bg-amber-600 dark:bg-amber-500 text-white px-2.5 py-1 text-xs font-semibold hover:bg-amber-700 transition touch-manipulation shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", isGeneratingAI && "animate-spin")} aria-hidden="true" />
            <span>{t.review.regenerateBtn}</span>
          </button>
        </div>
      )}

      {/* AI Review Section */}
      {isGeneratingAI ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-primary/30 bg-primary/5 space-y-3 text-center">
          <RefreshCw className="size-8 text-primary animate-spin" aria-hidden="true" />
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground">
              {t.review.generatingBtn}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {t.review.generatingDesc}
            </p>
          </div>
        </div>
      ) : review ? (
        <div className="space-y-4">
          {/* Verdict Box */}
          <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-foreground">
              <Sparkles className="size-4" aria-hidden="true" />
              <span>{t.review.verdictTitle}</span>
            </div>
            <p className="font-serif text-base font-semibold leading-relaxed text-foreground text-pretty">
              &quot;{review.verdict}&quot;
            </p>
          </div>

          {/* Summary */}
          {review.summary && (
            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {t.review.summaryLabel}
              </span>
              <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 text-pretty">
                {review.summary}
              </p>
            </div>
          )}

          {/* Analysis Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* What Worked */}
            {review.whatWorked && review.whatWorked.length > 0 && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <Check className="size-4" aria-hidden="true" />
                  <span>{t.review.whatWorkedLabel}</span>
                </div>
                <ul className="space-y-1.5 text-xs text-foreground/90">
                  {review.whatWorked.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Difficulties */}
            {review.difficulties && review.difficulties.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <Target className="size-4" aria-hidden="true" />
                  <span>{t.review.difficultiesLabel}</span>
                </div>
                <ul className="space-y-1.5 text-xs text-foreground/90">
                  {review.difficulties.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 size-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Observed Patterns */}
            {review.observedPatterns && review.observedPatterns.length > 0 && (
              <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <TrendingUp className="size-4" aria-hidden="true" />
                  <span>{t.review.patternsLabel}</span>
                </div>
                <ul className="space-y-1.5 text-xs text-foreground/90">
                  {review.observedPatterns.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Week Suggestions */}
            {review.nextWeekSuggestions && review.nextWeekSuggestions.length > 0 && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <Lightbulb className="size-4" aria-hidden="true" />
                  <span>{t.review.suggestionsLabel}</span>
                </div>
                <ul className="space-y-1.5 text-xs text-foreground/90">
                  {review.nextWeekSuggestions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Fallback / Failure / No Key State */
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t.review.aiUnavailable}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {aiError || t.review.aiUnavailableDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => generateAIReview(activeWeek.id)}
            disabled={isGeneratingAI}
            className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition touch-manipulation shrink-0 disabled:opacity-50 min-h-[2.25rem]"
          >
            <RefreshCw className={cn("size-3.5", isGeneratingAI && "animate-spin")} aria-hidden="true" />
            <span>{t.review.regenerateBtn}</span>
          </button>
        </div>
      )}
    </div>
  )
}
