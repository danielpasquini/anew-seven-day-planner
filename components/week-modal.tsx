"use client"

import { titleCase } from "@/lib/title-case"

import { useEffect, useState } from "react"
import { Calendar, AlertTriangle, X } from "lucide-react"
import { calculateInclusiveEndDate, formatDateRangeLocale, getNextDayDate, getTodayFormatted } from "@/lib/date-utils"
import { useStore, type WeekInstance } from "@/lib/store"
import { useModalAccessibility } from "@/components/modal-accessibility"
import { isValidDate } from "@/lib/backup-validation"

type CreateModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function CreateWeekModal({ isOpen, onClose }: CreateModalProps) {
  const { weeks, createWeek, activeGuide, locale, t } = useStore()
  const dialogRef = useModalAccessibility(isOpen, onClose)

  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState("")

  useEffect(() => {
    if (isOpen) {
      const sorted = weeks.filter((week) => (week.guideId || week.templateId) === activeGuide.id).sort((a, b) =>
        a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
      )
      if (sorted.length > 0) {
        const lastWeek = sorted[sorted.length - 1]
        setStartDate(getNextDayDate(lastWeek.endDate))
      } else {
        setStartDate(getTodayFormatted())
      }
      setTitle(`${t.week.weekNumberLabel} ${sorted.length + 1}`)
    }
  }, [isOpen, weeks, t, activeGuide.id])

  if (!isOpen) return null

  const validStart = isValidDate(startDate)
  const endDate = validStart ? calculateInclusiveEndDate(startDate) : ""
  const rangeFormatted = formatDateRangeLocale(startDate, endDate, locale)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validStart || !isValidDate(endDate)) return
    createWeek(title, startDate)
    onClose()
  }

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-week-title"
    >
      <div
        className="fixed inset-0 bg-foreground/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xl"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 1.25rem))" }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Calendar className="size-4" aria-hidden="true" />
            </div>
            <h3 id="create-week-title" className="font-serif text-lg font-semibold text-foreground">
              {titleCase(t.week.createTitle)}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-week-title" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.week.titleLabel}
            </label>
            <input
              id="new-week-title"
              type="text"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${locale === "en-US" ? "e.g." : "Ex.:"} ${t.week.weekNumberLabel} 2`}
              className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-base text-foreground shadow-xs outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <div>
            <label htmlFor="new-week-date" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.week.startDateLabel}
            </label>
            <input
              id="new-week-date"
              type="date"
              required
              min="0100-01-01"
              max="9999-12-25"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-base text-foreground shadow-xs outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">{locale === "en-US" ? "This starts seven days with your current guide’s suggested steps. Choose Another Week on the dashboard offers fresh presets." : "Comece sete dias com os passos sugeridos do guia atual. Escolher Outra Semana no painel oferece novos modelos."}</p>
          {validStart && (
            <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-xs leading-relaxed text-foreground/90">
              <span className="font-semibold text-gold-foreground">{t.hero.sevenDaysCycle}:</span>
              <p className="mt-0.5 font-medium text-foreground">{rangeFormatted}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition touch-manipulation"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={!validStart || !isValidDate(endDate)}
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition touch-manipulation"
            >
              {t.common.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type DeleteModalProps = {
  week: WeekInstance | null
  isOpen: boolean
  onClose: () => void
}

export function DeleteWeekModal({ week, isOpen, onClose }: DeleteModalProps) {
  const { deleteWeek, locale, t } = useStore()
  const dialogRef = useModalAccessibility(isOpen, onClose)

  if (!isOpen || !week) return null

  const rangeFormatted = formatDateRangeLocale(week.startDate, week.endDate, locale)

  const handleDelete = () => {
    deleteWeek(week.id)
    onClose()
  }

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-week-title"
    >
      <div
        className="fixed inset-0 bg-foreground/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xl"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 1.25rem))" }}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h3 id="delete-week-title" className="font-serif text-lg font-semibold text-foreground">
              {titleCase(t.week.deleteTitle)}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.week.deletePromptPrefix}{" "}
              <strong className="text-foreground">{week.title}</strong> ({rangeFormatted}).
            </p>
            <p className="mt-2 text-xs text-destructive font-medium">
              {t.week.deleteDesc}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition touch-manipulation"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground shadow-xs hover:bg-destructive/90 transition touch-manipulation"
          >
            {t.week.deleteConfirm}
          </button>
        </div>
      </div>
    </div>
  )
}
