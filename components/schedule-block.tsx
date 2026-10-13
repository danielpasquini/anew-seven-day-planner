"use client"

import { useState } from "react"
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown, Check, X } from "lucide-react"
import { useStore, type ScheduleActivity } from "@/lib/store"
import { getWeekDays } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { useModalAccessibility } from "@/components/modal-accessibility"

export function InteractiveScheduleBlock() {
  const {
    activeWeek,
    isDone,
    toggleDone,
    addScheduleActivity,
    updateScheduleActivity,
    deleteScheduleActivity,
    moveScheduleActivity,
    locale,
    t,
  } = useStore()

  const [editingAct, setEditingAct] = useState<ScheduleActivity | null>(null)
  const [addingForDay, setAddingForDay] = useState<number | null>(null)

  // Form states for add/edit
  const [timeInput, setTimeInput] = useState("")
  const [descInput, setDescInput] = useState("")
  const [daySelect, setDaySelect] = useState<number>(0)
  const [countsTowardCompletion, setCountsTowardCompletion] = useState<boolean>(true)
  const dialogRef = useModalAccessibility(addingForDay !== null || editingAct !== null, () => { setAddingForDay(null); setEditingAct(null) })

  if (!activeWeek) return null

  const days = getWeekDays(activeWeek.startDate, locale)
  const activities = activeWeek.programacao?.activities || []

  const handleOpenAdd = (dayIndex: number) => {
    setAddingForDay(dayIndex)
    setDaySelect(dayIndex)
    setTimeInput("16:30")
    setDescInput("")
    setCountsTowardCompletion(true)
    setEditingAct(null)
  }

  const handleOpenEdit = (act: ScheduleActivity) => {
    setEditingAct(act)
    setDaySelect(act.dayIndex)
    setTimeInput(act.time)
    setDescInput(act.description)
    setCountsTowardCompletion(act.countsTowardCompletion !== false)
    setAddingForDay(null)
  }

  const handleClose = () => {
    setAddingForDay(null)
    setEditingAct(null)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!descInput.trim()) return

    if (editingAct) {
      updateScheduleActivity(editingAct.id, {
        dayIndex: daySelect,
        time: timeInput || "12:00",
        description: descInput,
        countsTowardCompletion,
      })
      setEditingAct(null)
    } else if (addingForDay !== null) {
      addScheduleActivity(daySelect, timeInput || "12:00", descInput, countsTowardCompletion)
      setAddingForDay(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* 7-Day Grid — responsive: 1 col → 2 col → 3 col → 7 col */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {days.map((day) => {
          const dayActs = activities
            .filter((a) => a.dayIndex === day.dayIndex)
            .sort((a, b) => a.order - b.order || a.time.localeCompare(b.time))

          return (
            <div
              key={day.dayIndex}
              className="flex flex-col rounded-xl border border-border bg-background/30 p-4 transition hover:border-primary/30"
            >
              {/* Day Header */}
              <div className="mb-2.5 flex items-center justify-between border-b border-border/80 pb-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {day.dayNumberLabel}
                  </span>
                  <p className="text-xs font-medium text-muted-foreground">{day.formattedShort}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAdd(day.dayIndex)}
                  title={`${t.schedule.addActivity} (${day.dayNumberLabel})`}
                  aria-label={`${t.schedule.addActivity} (${day.dayNumberLabel})`}
                  className="icon-button text-muted-foreground hover:bg-primary/10 hover:text-primary"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* Day Activities List */}
              <div className="flex-1 space-y-2 min-h-[5rem]">
                {dayActs.length === 0 ? (
                  <p className="py-4 text-center text-xs italic text-muted-foreground">{t.schedule.emptyDay}</p>
                ) : (
                  dayActs.map((act, index) => {
                    const done = isDone(act.id)
                    const isNonCountable = act.countsTowardCompletion === false
                    return (
                      <div
                        key={act.id}
                        className={cn(
                          "group relative flex flex-col justify-between rounded-md border p-2 text-xs transition",
                          done
                            ? "border-primary/20 bg-primary/5 text-muted-foreground"
                            : "border-border/60 bg-background/50 hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            aria-pressed={done}
                            aria-label={done ? `${t.common.cancel}: ${act.description}` : `${t.common.done}: ${act.description}`}
                            onClick={() => toggleDone(act.id)}
                            className={cn(
                              "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border transition touch-manipulation",
                              done
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input hover:border-primary"
                            )}
                          >
                            {done && <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-mono text-[10px] font-medium text-primary/80">
                                {act.time}
                              </span>
                              {isNonCountable && (
                                <span className="rounded bg-muted px-1 py-0.2 text-[9px] text-muted-foreground">
                                  {t.schedule.infoBadge}
                                </span>
                              )}
                            </div>
                            <p className={cn("text-sm leading-relaxed break-words text-foreground", done && "line-through text-muted-foreground")}>
                              {act.description}
                            </p>
                          </div>
                        </div>

                        {/* Actions toolbar */}
                        <div className="mt-1.5 flex items-center justify-end gap-1 transition
                          opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100
                          [@media(hover:none)]:opacity-100">
                          <button
                            type="button"
                            onClick={() => moveScheduleActivity(act.id, "up")}
                            disabled={index === 0}
                            title={t.schedule.orderUp}
                            aria-label={t.schedule.orderUp}
                            className="p-1 min-w-[1.5rem] min-h-[1.5rem] flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                          >
                            <ArrowUp className="size-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveScheduleActivity(act.id, "down")}
                            disabled={index === dayActs.length - 1}
                            title={t.schedule.orderDown}
                            aria-label={t.schedule.orderDown}
                            className="p-1 min-w-[1.5rem] min-h-[1.5rem] flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                          >
                            <ArrowDown className="size-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(act)}
                            title={t.schedule.editActivity}
                            aria-label={`${t.schedule.editActivity}: ${act.description}`}
                            className="p-1 min-w-[1.5rem] min-h-[1.5rem] flex items-center justify-center text-muted-foreground hover:text-primary touch-manipulation"
                          >
                            <Edit2 className="size-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteScheduleActivity(act.id)}
                            title={t.schedule.deleteActivity}
                            aria-label={`${t.schedule.deleteActivity}: ${act.description}`}
                            className="p-1 min-w-[1.5rem] min-h-[1.5rem] flex items-center justify-center text-muted-foreground hover:text-destructive touch-manipulation"
                          >
                            <Trash2 className="size-3" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Quick Add Button */}
              <button
                type="button"
                onClick={() => handleOpenAdd(day.dayIndex)}
                aria-label={`${t.schedule.addActivity} (${day.dayNumberLabel})`}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-dashed border-border/80 py-2 text-[11px] font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition touch-manipulation"
              >
                <Plus className="size-3" aria-hidden="true" /> {t.common.create}
              </button>
            </div>
          )
        })}
      </div>

      {/* Add / Edit Activity Modal */}
      {(addingForDay !== null || editingAct !== null) && (
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editingAct ? t.schedule.editActivity : t.schedule.addActivity}
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={handleClose}
            aria-hidden="true"
          />
          <div
            className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 1.25rem))" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif text-lg font-semibold text-foreground">
                {editingAct ? t.schedule.editActivity : t.schedule.addActivity}
              </h4>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={t.common.close}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="schedule-day" className="mb-1 block text-xs font-semibold text-foreground">
                  {t.schedule.dayOfWeek}
                </label>
                <select
                  id="schedule-day"
                  value={daySelect}
                  onChange={(e) => setDaySelect(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                >
                  {days.map((d) => (
                    <option key={d.dayIndex} value={d.dayIndex}>
                      {d.dayNumberLabel} — {d.formattedShort}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="schedule-time" className="mb-1 block text-xs font-semibold text-foreground">
                  {t.schedule.timeLabel}
                </label>
                <input
                  id="schedule-time"
                  type="time"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </div>

              <div>
                <label htmlFor="schedule-description" className="mb-1 block text-xs font-semibold text-foreground">
                  {t.schedule.descLabel}
                </label>
                <textarea
                  id="schedule-description"
                  maxLength={1200}
                  rows={3}
                  required
                  placeholder={t.schedule.activityPlaceholder}
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="countsTowardCompletion"
                  checked={countsTowardCompletion}
                  onChange={(e) => setCountsTowardCompletion(e.target.checked)}
                  className="size-4 rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="countsTowardCompletion" className="text-xs font-medium text-foreground cursor-pointer">
                  {t.schedule.countsTowardCompletionDesc}
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md border border-input px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent touch-manipulation"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 touch-manipulation"
                >
                  {editingAct ? t.common.save : t.common.create}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
