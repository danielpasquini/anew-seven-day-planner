"use client"

import { useEffect, useId, useRef } from "react"
import { Plus, Trash2 } from "lucide-react"
import type { GuideTemplate } from "@/lib/guide-data"
import { isValidActivity } from "@/lib/backup-validation"
import { plannerId } from "@/lib/planner"

type Routine = GuideTemplate["weeklyPlan"]
const MAX_ACTIVITIES = 500
const inputClass = "w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2.5 text-base placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"

export function validateGuideRoutine(weeklyPlan: Routine, en: boolean): string | null {
  if (weeklyPlan.length > MAX_ACTIVITIES) return en ? "A week can include up to 500 activities." : "Uma semana pode incluir até 500 atividades."
  if (weeklyPlan.some((activity) => !activity.description.trim())) return en ? "Describe each activity, or remove any empty activities." : "Descreva cada atividade ou remova as atividades vazias."
  if (weeklyPlan.some((activity) => !isValidActivity(activity)) || new Set(weeklyPlan.map((activity) => activity.id)).size !== weeklyPlan.length) return en ? "Check each activity's day and time before saving." : "Verifique o dia e o horário de cada atividade antes de salvar."
  return null
}

/** Edits activities in memory; the caller chooses when to save the week. */
export function GuideRoutineEditor({ weeklyPlan, onChange, en }: { weeklyPlan: Routine; onChange: (next: Routine) => void; en: boolean }) {
  const prefix = useId()
  const pendingFocus = useRef<string | null>(null)
  const descriptionRefs = useRef(new Map<string, HTMLTextAreaElement>())
  const dayRefs = useRef(new Map<string, HTMLSelectElement>())
  const detailsRefs = useRef(new Map<number, HTMLDetailsElement>())
  const addRefs = useRef(new Map<number, HTMLButtonElement>())
  const copy = (pt: string, english: string) => en ? english : pt
  useEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    pendingFocus.current = null
    if (target.startsWith("day:")) addRefs.current.get(Number(target.slice(4)))?.focus()
    else if (target.startsWith("move:")) dayRefs.current.get(target.slice(5))?.focus()
    else descriptionRefs.current.get(target)?.focus()
  }, [weeklyPlan])

  const update = (id: string, changes: Partial<Routine[number]>) => {
    if (changes.dayIndex !== undefined && weeklyPlan.find((activity) => activity.id === id)?.dayIndex !== changes.dayIndex) {
      const destination = detailsRefs.current.get(changes.dayIndex)
      if (destination) destination.open = true
      pendingFocus.current = `move:${id}`
    }
    onChange(weeklyPlan.map((activity) => activity.id === id ? {
      ...activity, ...changes,
      ...(changes.dayIndex !== undefined && changes.dayIndex !== activity.dayIndex ? {
        order: Math.max(-1, ...weeklyPlan.filter((other) => other.dayIndex === changes.dayIndex && other.id !== id).map((other) => other.order)) + 1,
      } : {}),
    } : activity))
  }
  const add = (dayIndex: number) => {
    if (weeklyPlan.length >= MAX_ACTIVITIES) return
    const id = plannerId("week-activity")
    pendingFocus.current = id
    onChange([...weeklyPlan, { id, dayIndex, time: "09:00", description: "", order: Math.max(-1, ...weeklyPlan.filter((activity) => activity.dayIndex === dayIndex).map((activity) => activity.order)) + 1, countsTowardCompletion: true }])
  }
  const remove = (id: string, dayIndex: number) => {
    pendingFocus.current = `day:${dayIndex}`
    onChange(weeklyPlan.filter((activity) => activity.id !== id))
  }

  return <div className="space-y-3">
    <p className="text-sm leading-relaxed text-muted-foreground">{copy("Adapte os dias, horários e atividades desta semana. As outras semanas ficam iguais.", "Adapt this week’s days, times, and activities. Other weeks stay unchanged.")}</p>
    {Array.from({ length: 7 }, (_, dayIndex) => {
      const activities = weeklyPlan.filter((activity) => activity.dayIndex === dayIndex).sort((a, b) => a.order - b.order || a.time.localeCompare(b.time))
      return <details key={dayIndex} ref={(element) => { if (element) detailsRefs.current.set(dayIndex, element); else detailsRefs.current.delete(dayIndex) }} open={dayIndex === 0} className="rounded-xl border border-border p-4">
        <summary className="cursor-pointer text-sm font-medium">{copy("Dia", "Day")} {dayIndex + 1} · {activities.length} {copy(activities.length === 1 ? "Atividade" : "Atividades", activities.length === 1 ? "Activity" : "Activities")}</summary>
        <div className="mt-4 space-y-4">
          {activities.length === 0 && <p className="text-xs text-muted-foreground">{copy("Deixe espaço livre ou acrescente uma atividade.", "Leave open space or add an activity.")}</p>}
          {activities.map((activity, index) => {
            const id = `${prefix}-${activity.id}`
            return <fieldset key={activity.id} className="min-w-0 space-y-3 rounded-xl bg-muted/30 p-3">
              <legend className="text-xs font-medium">{copy("Atividade", "Activity")} {index + 1}</legend>
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor={`${id}-day`} className="mb-1 block text-xs font-medium">{copy("Dia", "Day")}</label><select id={`${id}-day`} ref={(element) => { if (element) dayRefs.current.set(activity.id, element); else dayRefs.current.delete(activity.id) }} value={activity.dayIndex} onChange={(event) => update(activity.id, { dayIndex: Number(event.target.value) })} className={inputClass}>{Array.from({ length: 7 }, (_, day) => <option key={day} value={day}>{copy("Dia", "Day")} {day + 1}</option>)}</select></div>
                <div><label htmlFor={`${id}-time`} className="mb-1 block text-xs font-medium">{copy("Horário", "Time")}</label><input id={`${id}-time`} type="time" required value={activity.time} onChange={(event) => update(activity.id, { time: event.target.value })} className={inputClass} /></div>
              </div>
              <div><label htmlFor={`${id}-description`} className="mb-1 block text-xs font-medium">{copy("Descrição da Atividade", "Activity Description")}</label><textarea id={`${id}-description`} ref={(element) => { if (element) descriptionRefs.current.set(activity.id, element); else descriptionRefs.current.delete(activity.id) }} rows={2} maxLength={3000} value={activity.description} onChange={(event) => update(activity.id, { description: event.target.value })} placeholder={copy("Ex.: Ler por dez minutos depois do café.", "e.g. Read for ten minutes after breakfast.")} className={inputClass} /></div>
              <div className="flex flex-wrap items-center justify-between gap-3"><label htmlFor={`${id}-counts`} className="flex items-center gap-2 text-xs"><input id={`${id}-counts`} type="checkbox" checked={activity.countsTowardCompletion !== false} onChange={(event) => update(activity.id, { countsTowardCompletion: event.target.checked })} />{copy("Conta para a Conclusão da Semana", "Counts Toward Week Completion")}</label><button type="button" onClick={() => remove(activity.id, dayIndex)} className="icon-button text-muted-foreground hover:text-destructive" aria-label={`${copy("Remover Atividade", "Remove Activity")}: ${activity.description || `${copy("Dia", "Day")} ${dayIndex + 1}, ${index + 1}`}`}><Trash2 className="size-4" aria-hidden="true" /></button></div>
            </fieldset>
          })}
          <button ref={(element) => { if (element) addRefs.current.set(dayIndex, element); else addRefs.current.delete(dayIndex) }} type="button" onClick={() => add(dayIndex)} disabled={weeklyPlan.length >= MAX_ACTIVITIES} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm text-primary disabled:opacity-50"><Plus className="size-4" aria-hidden="true" />{copy("Adicionar Atividade", "Add Activity")} · {copy("Dia", "Day")} {dayIndex + 1}</button>
        </div>
      </details>
    })}
    {weeklyPlan.length >= MAX_ACTIVITIES && <p role="status" className="text-xs text-muted-foreground">{copy("Limite de 500 atividades padrão atingido.", "The limit of 500 default activities has been reached.")}</p>}
  </div>
}
