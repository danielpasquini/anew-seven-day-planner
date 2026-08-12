"use client"

import { useState } from "react"
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown, Check } from "lucide-react"
import { useStore, type ScheduleActivity } from "@/lib/store"
import { getWeekDays } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

export function InteractiveScheduleBlock() {
  const {
    activeWeek,
    isDone,
    toggleDone,
    addScheduleActivity,
    updateScheduleActivity,
    deleteScheduleActivity,
    moveScheduleActivity,
  } = useStore()

  const [editingAct, setEditingAct] = useState<ScheduleActivity | null>(null)
  const [addingForDay, setAddingForDay] = useState<number | null>(null)

  // Form states for add/edit
  const [timeInput, setTimeInput] = useState("")
  const [descInput, setDescInput] = useState("")
  const [daySelect, setDaySelect] = useState<number>(0)

  if (!activeWeek) return null

  const days = getWeekDays(activeWeek.startDate)
  const activities = activeWeek.programacao?.activities || []

  const handleOpenAdd = (dayIndex: number) => {
    setAddingForDay(dayIndex)
    setDaySelect(dayIndex)
    setTimeInput("16:30")
    setDescInput("")
    setEditingAct(null)
  }

  const handleOpenEdit = (act: ScheduleActivity) => {
    setEditingAct(act)
    setDaySelect(act.dayIndex)
    setTimeInput(act.time)
    setDescInput(act.description)
    setAddingForDay(null)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!descInput.trim()) return

    if (editingAct) {
      updateScheduleActivity(editingAct.id, {
        dayIndex: daySelect,
        time: timeInput || "12:00",
        description: descInput,
      })
      setEditingAct(null)
    } else if (addingForDay !== null) {
      addScheduleActivity(daySelect, timeInput || "12:00", descInput)
      setAddingForDay(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* 7-Day Grid / Card Layout */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
        {days.map((day) => {
          const dayActs = activities
            .filter((a) => a.dayIndex === day.dayIndex)
            .sort((a, b) => a.order - b.order || a.time.localeCompare(b.time))

          return (
            <div
              key={day.dayIndex}
              className="flex flex-col rounded-lg border border-border bg-card p-3 shadow-xs transition hover:border-primary/30"
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
                  title="Adicionar atividade"
                  className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              {/* Day Activities List */}
              <div className="flex-1 space-y-2 min-h-[100px]">
                {dayActs.length === 0 ? (
                  <p className="py-4 text-center text-xs italic text-muted-foreground/60">Sem atividades</p>
                ) : (
                  dayActs.map((act, index) => {
                    const done = isDone(act.id)
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
                            onClick={() => toggleDone(act.id)}
                            className={cn(
                              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition",
                              done
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input hover:border-primary"
                            )}
                          >
                            {done && <Check className="size-2.5" strokeWidth={3} />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <span className="inline-block font-mono text-[10px] font-medium text-primary/80">
                              {act.time}
                            </span>
                            <p className={cn("leading-snug break-words text-foreground", done && "line-through text-muted-foreground")}>
                              {act.description}
                            </p>
                          </div>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="mt-1.5 flex items-center justify-end gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => moveScheduleActivity(act.id, "up")}
                            disabled={index === 0}
                            title="Mover para cima"
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowUp className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveScheduleActivity(act.id, "down")}
                            disabled={index === dayActs.length - 1}
                            title="Mover para baixo"
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowDown className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(act)}
                            title="Editar"
                            className="p-0.5 text-muted-foreground hover:text-primary"
                          >
                            <Edit2 className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteScheduleActivity(act.id)}
                            title="Excluir"
                            className="p-0.5 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Quick Add Button per day */}
              <button
                type="button"
                onClick={() => handleOpenAdd(day.dayIndex)}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-dashed border-border/80 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition"
              >
                <Plus className="size-3" /> Adicionar
              </button>
            </div>
          )
        })}
      </div>

      {/* Add / Edit Activity Form Modal */}
      {(addingForDay !== null || editingAct !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => {
              setAddingForDay(null)
              setEditingAct(null)
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6">
            <h4 className="mb-4 font-serif text-lg font-semibold text-foreground">
              {editingAct ? "Editar Atividade" : "Nova Atividade"}
            </h4>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Dia da Semana
                </label>
                <select
                  value={daySelect}
                  onChange={(e) => setDaySelect(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                >
                  {days.map((d) => (
                    <option key={d.dayIndex} value={d.dayIndex}>
                      {d.dayNumberLabel} — {d.formattedShort}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Horário
                </label>
                <input
                  type="text"
                  placeholder="Ex: 16:30"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Descrição da Tarefa
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descrição da atividade..."
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAddingForDay(null)
                    setEditingAct(null)
                  }}
                  className="rounded-md border border-input px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {editingAct ? "Salvar Alterações" : "Adicionar Tarefa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
