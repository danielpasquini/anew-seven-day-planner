"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Edit2, Plus, Trash2, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { getWeekDays } from "@/lib/date-utils"
import { titleCase } from "@/lib/title-case"
import { cn } from "@/lib/utils"

export function SettingsPlanningTab() {
  const {
    activeWeek,
    locale,
    t,
    addScheduleActivity,
    updateScheduleActivity,
    deleteScheduleActivity,
    moveScheduleActivity,
  } = useStore()

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0)
  const [newActTime, setNewActTime] = useState("16:30")
  const [newActDesc, setNewActDesc] = useState("")
  const [editingActId, setEditingActId] = useState<string | null>(null)
  const [editActTime, setEditActTime] = useState("")
  const [editActDesc, setEditActDesc] = useState("")

  const days = activeWeek ? getWeekDays(activeWeek.startDate, locale) : []
  const activities = activeWeek?.programacao?.activities || []
  const dayActivities = activities
    .filter((a) => a.dayIndex === selectedDayIndex)
    .sort((a, b) => a.order - b.order || a.time.localeCompare(b.time))

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newActDesc.trim()) return
    addScheduleActivity(selectedDayIndex, newActTime.trim() || "12:00", newActDesc.trim())
    setNewActDesc("")
  }

  const handleStartEdit = (actId: string, time: string, desc: string) => {
    setEditingActId(actId)
    setEditActTime(time)
    setEditActDesc(desc)
  }

  const handleSaveEdit = (actId: string) => {
    if (!editActDesc.trim()) return
    updateScheduleActivity(actId, {
      time: editActTime || "12:00",
      description: editActDesc.trim(),
    })
    setEditingActId(null)
  }

  const copy = (pt: string, en: string) => locale === "en-US" ? en : pt

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-base font-semibold text-foreground">
          {titleCase(copy("Rotina de atividades", "Activity Routine"))} ({titleCase(activeWeek?.title ?? copy("Semana Selecionada", "Selected Week"))})
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {copy("Adicione, altere os horários ou remova compromissos para cada dia da semana ativa.", "Add, adjust or remove activities for each day of your selected week.")}
        </p>
      </div>

      {/* Day selector tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border">
        {days.map((d) => {
          const count = activities.filter((a) => a.dayIndex === d.dayIndex).length
          const isSel = d.dayIndex === selectedDayIndex

          return (
            <button
              key={d.dayIndex}
              type="button"
              aria-pressed={selectedDayIndex === d.dayIndex}
              onClick={() => setSelectedDayIndex(d.dayIndex)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition whitespace-nowrap touch-manipulation min-h-[2.25rem]",
                isSel
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span>{d.dayNumberLabel}</span>
              <span className="text-[0.65rem] opacity-80">({d.formattedShort})</span>
              <span className="rounded-full bg-background/20 px-1.5 py-0.2 text-[0.6rem]">
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Form: Add Activity for selected day */}
      <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
        <h4 className="text-xs font-bold tracking-wider text-primary">
          {titleCase(copy("Adicionar atividade", "Add Activity"))} ({titleCase(days[selectedDayIndex]?.dayNumberLabel)} - {titleCase(days[selectedDayIndex]?.formattedShort)})
        </h4>
        <form onSubmit={handleAddActivity} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-3 space-y-1">
            <label htmlFor="settings-newActTime" className="text-xs font-medium text-foreground block">
              {copy("Horário", "Time")}
            </label>
            <input
              id="settings-newActTime"
              type="time"
              value={newActTime}
              onChange={(e) => setNewActTime(e.target.value)}
              className="w-full placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-md border border-border bg-background px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="sm:col-span-6 space-y-1">
            <label htmlFor="settings-newActDesc" className="text-xs font-medium text-foreground block">
              {copy("Descrição da Tarefa", "Activity Description")}
            </label>
            <input
              id="settings-newActDesc"
              type="text"
              maxLength={1200}
              placeholder={locale === "en-US" ? "For example: 15-minute walk" : "Exemplo: caminhada de 15 minutos"}
              value={newActDesc}
              onChange={(e) => setNewActDesc(e.target.value)}
              className="w-full placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-md border border-border bg-background px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={!newActDesc.trim()}
              className="w-full placeholder:text-gray-500 dark:placeholder:text-gray-400 flex items-center justify-center gap-1 rounded-md bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition touch-manipulation min-h-[2.5rem]"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>{copy("Adicionar", "Add")}</span>
            </button>
          </div>
        </form>
      </div>

      {/* List of activities for selected day */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold tracking-wider text-muted-foreground">
          {titleCase(copy("Atividades deste dia", "Activities for this day"))} ({dayActivities.length})
        </h4>

        {dayActivities.length === 0 ? (
          <p className="p-4 text-center text-xs italic text-muted-foreground rounded-lg border border-dashed border-border">
            {locale === "en-US" ? "No activities scheduled for this day. Add one whenever you wish." : "Nenhuma atividade cadastrada para este dia. Adicione uma quando quiser."}
          </p>
        ) : (
          <div className="space-y-2">
            {dayActivities.map((act, index) => {
              const isEditing = editingActId === act.id

              if (isEditing) {
                return (
                  <div
                    key={act.id}
                    className="rounded-lg border border-primary bg-primary/5 p-3 space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="time"
                        aria-label={t.schedule.timeLabel}
                        value={editActTime}
                        onChange={(e) => setEditActTime(e.target.value)}
                        className="sm:col-span-3 rounded-md border border-border bg-background px-2.5 py-1.5 text-base font-medium"
                        placeholder={t.schedule.timeLabel}
                      />
                      <input
                        type="text"
                        aria-label={t.schedule.descLabel}
                        maxLength={1200}
                        value={editActDesc}
                        onChange={(e) => setEditActDesc(e.target.value)}
                        className="sm:col-span-7 rounded-md border border-border bg-background px-2.5 py-1.5 text-base font-medium"
                        placeholder={locale === "en-US" ? "For example: read a few pages after lunch" : "Exemplo: ler algumas páginas depois do almoço"}
                      />
                      <div className="sm:col-span-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(act.id)}
                          className="flex-1 rounded bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 touch-manipulation"
                        >
                          {t.common.save}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingActId(null)}
                          className="rounded border border-border p-2 text-xs text-muted-foreground hover:bg-accent touch-manipulation"
                          aria-label={t.common.cancel}
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={act.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-2.5 hover:border-primary/40 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-xs font-mono font-bold shrink-0">
                      {act.time}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{act.description}</p>
                      {act.countsTowardCompletion === false && (
                        <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-[0.65rem] text-muted-foreground">
                          {t.schedule.infoBadge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveScheduleActivity(act.id, "up")}
                      disabled={index === 0}
                      className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition touch-manipulation"
                      title={t.schedule.orderUp}
                      aria-label={t.schedule.orderUp}
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveScheduleActivity(act.id, "down")}
                      disabled={index === dayActivities.length - 1}
                      className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition touch-manipulation"
                      title={t.schedule.orderDown}
                      aria-label={t.schedule.orderDown}
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(act.id, act.time, act.description)}
                      className="p-1.5 text-muted-foreground hover:text-primary transition touch-manipulation"
                      title={t.settings.programacaoTab.editActivityTitle}
                      aria-label={`${t.settings.programacaoTab.editActivityTitle}: ${act.description}`}
                    >
                      <Edit2 className="size-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteScheduleActivity(act.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition touch-manipulation"
                      title={t.settings.programacaoTab.deleteActivityTitle}
                      aria-label={`${t.settings.programacaoTab.deleteActivityTitle}: ${act.description}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
