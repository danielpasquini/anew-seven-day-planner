"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Check, X } from "lucide-react"
import type { Section } from "@/lib/guide-data"
import { useStore } from "@/lib/store"
import { sectionsForWeek } from "@/lib/guide-revision"
import { GuideSectionEditor, validateGuideSections } from "@/components/guide-section-editor"
import { useModalAccessibility } from "@/components/modal-accessibility"

type EditWeekProps = { isOpen: boolean; onClose: () => void }

export function EditWeekSectionsModal({ isOpen, onClose }: EditWeekProps) {
  const { activeWeek, activeGuide, updateWeekSections, locale, storageReadOnly, starterIsPreview } = useStore()
  const prefix = useId()
  const [sections, setSections] = useState<Section[]>([])
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const dialogRef = useModalAccessibility(isOpen, onClose)
  const en = locale === "en-US"
  const copy = (pt: string, english: string) => en ? english : pt
  const sourceRef = useRef({ activeWeek, activeGuide })
  sourceRef.current = { activeWeek, activeGuide }
  useEffect(() => {
    if (!isOpen) return
    const source = sourceRef.current
    setEditingWeekId(source.activeWeek?.id ?? null)
    setSections(JSON.parse(JSON.stringify(source.activeWeek ? sectionsForWeek(source.activeWeek, source.activeGuide) : [])))
    setError(null)
  }, [isOpen, activeWeek?.id])
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])
  if (!isOpen) return null
  const completed = activeWeek?.status === "completed"
  const blocked = storageReadOnly || starterIsPreview || !activeWeek || activeWeek.id !== editingWeekId || completed
  const save = () => {
    if (blocked || !editingWeekId) return
    const issue = validateGuideSections(sections, en)
    if (issue) { setError(issue); return }
    if (!updateWeekSections(editingWeekId, sections)) { setError(copy("Não foi possível salvar as seções. Verifique os campos e o armazenamento.", "Could not save the sections. Check the fields and storage.")); return }
    onClose()
  }
  return <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={`${prefix}-title`} className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5">
    <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
    <div className="relative flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-border p-5"><div><p className="eyebrow text-primary">{copy("ESTA SEMANA", "THIS WEEK")}</p><h2 id={`${prefix}-title`} className="mt-1 font-serif text-xl">{copy("Editar Seções da Semana", "Edit Week Sections")}</h2></div><button type="button" onClick={onClose} className="icon-button" aria-label={copy("Fechar", "Close")}><X className="size-5" aria-hidden="true" /></button></header>
      <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
        {error && <p ref={errorRef} tabIndex={-1} role="alert" className="mb-4 rounded-xl bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{copy("Personalize as seções e os campos desta semana. Suas anotações existentes são preservadas; outras semanas ficam iguais.", "Customize this week’s sections and fields. Existing notes are preserved; other weeks stay unchanged.")}</p>
        {blocked && <p className="mb-4 rounded-xl bg-muted p-4 text-sm">{!activeWeek ? copy("Escolha uma semana antes de editar.", "Choose a week before editing.") : starterIsPreview ? copy("Escolha Usar Esta Semana antes de editar o exemplo.", "Choose Use This Week before editing the sample.") : completed ? copy("Reabra esta semana antes de alterar suas seções.", "Reopen this week before changing its sections.") : copy("Recupere o armazenamento antes de editar.", "Recover storage before editing.")}</p>}
        <fieldset disabled={blocked} className="min-w-0"><GuideSectionEditor key={`${editingWeekId}-${isOpen}`} sections={sections} onChange={(next) => { setSections(next); setError(null) }} en={en} /></fieldset>
      </div>
      <footer className="flex flex-wrap justify-end gap-3 border-t border-border p-4"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-border px-4 text-sm">{copy("Cancelar", "Cancel")}</button><button type="button" onClick={save} disabled={blocked} className="primary-button disabled:opacity-50"><Check className="size-4" aria-hidden="true" />{copy("Salvar Seções da Semana", "Save Week Sections")}</button></footer>
    </div>
  </div>
}

/** Compatibility for callers being migrated to the week-only editor. */
export function EditGuideSectionsModal({ isOpen, onClose }: EditWeekProps & { guideId?: string }) {
  return <EditWeekSectionsModal isOpen={isOpen} onClose={onClose} />
}
