"use client"

import { titleCase } from "@/lib/title-case"

import { useEffect, useRef, useState } from "react"
import { Check, X } from "lucide-react"
import type { Section } from "@/lib/guide-data"
import { useStore } from "@/lib/store"
import { GuideSectionEditor, validateGuideSections } from "@/components/guide-section-editor"
import { useModalAccessibility } from "@/components/modal-accessibility"

export function EditGuideSectionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { activeGuide, activeWeek, updateGuideSections, locale, storageReadOnly, starterIsPreview } = useStore()
  const [sections, setSections] = useState<Section[]>([])
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const dialogRef = useModalAccessibility(isOpen, onClose)
  const en = locale === "en-US"
  const copy = (pt: string, english: string) => en ? english : pt
  useEffect(() => { if (isOpen) { setSections(JSON.parse(JSON.stringify(activeGuide.sections))); setError(null) } }, [isOpen, activeGuide.id])
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])
  if (!isOpen) return null
  const blocked = storageReadOnly || starterIsPreview || activeWeek?.status === "completed"
  const save = () => {
    const issue = validateGuideSections(sections, en)
    if (issue) { setError(issue); return }
    if (!updateGuideSections(sections)) { setError(copy("Não foi possível salvar. Verifique o armazenamento e se a semana está aberta.", "Could not save. Check storage and whether this week is open.")); return }
    onClose()
  }
  return <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="edit-sections-title" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5">
    <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
    <div className="relative flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-border p-5"><div><p className="eyebrow text-primary">{copy("SEU GUIA", "YOUR GUIDE")}</p><h2 id="edit-sections-title" className="mt-1 font-serif text-xl">{titleCase(copy("Seções e Campos", "Sections and Fields"))}</h2></div><button type="button" onClick={onClose} className="icon-button" aria-label={copy("Fechar", "Close")}><X className="size-5" aria-hidden="true" /></button></header>
      <div className="overflow-y-auto p-5 sm:p-7">
        {error && <p ref={errorRef} tabIndex={-1} role="alert" className="mb-4 rounded-xl bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
        {blocked && <p className="mb-4 rounded-xl bg-muted p-4 text-sm">{activeWeek?.status === "completed" ? copy("Reabra esta semana para editar suas seções.", "Reopen this week to edit its sections.") : starterIsPreview ? copy("Escolha Usar Esta Semana antes de editar o exemplo.", "Choose Use This Week before editing the example.") : copy("Recupere o armazenamento antes de editar.", "Recover storage before editing.")}</p>}
        <fieldset disabled={blocked}><GuideSectionEditor sections={sections} onChange={(next) => { setSections(next); setError(null) }} en={en} /></fieldset>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{copy("As alterações valem para esta semana aberta e as próximas. Outras semanas e respostas existentes são preservadas.", "Changes apply to this open week and future weeks. Other weeks and existing answers are preserved.")}</p>
      </div>
      <footer className="flex flex-wrap justify-end gap-3 border-t border-border p-4"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-border px-4 text-sm">{copy("Cancelar", "Cancel")}</button><button type="button" onClick={save} disabled={blocked} className="primary-button"><Check className="size-4" aria-hidden="true" />{copy("Salvar Seções", "Save Sections")}</button></footer>
    </div>
  </div>
}
