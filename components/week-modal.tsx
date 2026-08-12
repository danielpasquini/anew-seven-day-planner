"use client"

import { useEffect, useState } from "react"
import { Calendar, AlertTriangle, X } from "lucide-react"
import { calculateInclusiveEndDate, formatDateRangeBR, getNextDayDate, getTodayFormatted } from "@/lib/date-utils"
import { useStore, type WeekInstance } from "@/lib/store"

type CreateModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function CreateWeekModal({ isOpen, onClose }: CreateModalProps) {
  const { weeks, createWeek } = useStore()

  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState("")

  useEffect(() => {
    if (isOpen) {
      const sorted = [...weeks].sort((a, b) =>
        a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
      )
      if (sorted.length > 0) {
        const lastWeek = sorted[sorted.length - 1]
        setStartDate(getNextDayDate(lastWeek.endDate))
      } else {
        setStartDate(getTodayFormatted())
      }
      setTitle(`Semana ${weeks.length + 1}`)
    }
  }, [isOpen, weeks])

  if (!isOpen) return null

  const endDate = calculateInclusiveEndDate(startDate)
  const rangeFormatted = formatDateRangeBR(startDate, endDate)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate) return
    createWeek(title, startDate)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-foreground/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="size-4" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">Criar Nova Semana</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nome da Semana
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Semana 2 ou Semana Especial"
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data de Início
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          {startDate && (
            <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-xs leading-relaxed text-foreground/90">
              <span className="font-semibold text-gold-foreground">Período de 7 dias (inclusivo):</span>
              <p className="mt-0.5 font-medium text-foreground">{rangeFormatted}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition"
            >
              Criar Semana
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
  const { deleteWeek } = useStore()

  if (!isOpen || !week) return null

  const rangeFormatted = formatDateRangeBR(week.startDate, week.endDate)

  const handleDelete = () => {
    deleteWeek(week.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-foreground/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-foreground">Excluir Semana?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Você está prestes a excluir <strong className="text-foreground">{week.title}</strong> ({rangeFormatted}).
            </p>
            <p className="mt-2 text-xs text-destructive font-medium">
              Todas as respostas, reflexões e tarefas marcadas nesta semana serão apagadas permanentemente. Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md bg-destructive px-4 py-2 text-xs font-medium text-primary-foreground shadow-xs hover:bg-destructive/90 transition"
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  )
}
