"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowDown, ArrowUp, Plus, Trash2, Undo2 } from "lucide-react"
import type { Field, Section } from "@/lib/guide-data"
import { plannerId } from "@/lib/planner"
import { titleCase } from "@/lib/title-case"

const newId = plannerId
const inputClass = "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"

function changeFieldKind(field: Field, kind: Field["kind"]): Field {
  const label = field.kind === "static" ? field.text : field.label
  const id = "id" in field && typeof field.id === "string" ? field.id : newId("field")
  // A static field retains its original ID so switching back keeps earlier answers.
  if (kind === "static") return { kind, text: label, id } as Field
  return { kind, id, label, ...(kind === "scale" ? { max: field.kind === "scale" ? field.max || 10 : 10 } : {}) }
}

export function validateGuideSections(sections: Section[], en: boolean): string | null {
  if (sections.some((section) => !section.title.trim())) return en ? "Give each section a title before saving." : "Dê um título a cada seção antes de salvar."
  if (sections.some((section) => section.blocks.some((block) => block.type === "fields" && block.fields.some((field) => field.kind === "static" ? !field.text.trim() : !field.label.trim())))) return en ? "Give each field a label, or remove any empty fields." : "Dê um nome a cada campo ou remova os campos vazios."
  return null
}

/** Edits a draft only. Existing IDs stay intact so saved answers remain attached. */
export function GuideSectionEditor({ sections, onChange, en = true }: { sections: Section[]; onChange: (sections: Section[]) => void; en?: boolean }) {
  const [removedSections, setRemovedSections] = useState<{ section: Section; index: number }[]>([])
  const undoRef = useRef<HTMLButtonElement>(null)
  const sectionRefs = useRef(new Map<string, HTMLDetailsElement>())
  useEffect(() => { if (removedSections.length) undoRef.current?.focus() }, [removedSections.length])
  const copy = (pt: string, english: string) => en ? english : pt
  const setSections = (next: Section[]) => onChange(next.map((section, index) => ({ ...section, number: String(index + 1).padStart(2, "0") })))
  const updateSection = (id: string, changes: Partial<Section>) => setSections(sections.map((section) => section.id === id ? { ...section, ...changes } : section))
  const moveSection = (index: number, direction: -1 | 1) => {
    const next = [...sections]
    ;[next[index], next[index + direction]] = [next[index + direction], next[index]]
    setSections(next)
  }
  const removeSection = (section: Section, index: number) => {
    setRemovedSections((previous) => [...previous, { section, index }])
    setSections(sections.filter((item) => item.id !== section.id))
  }
  const undoRemoval = () => {
    const removed = removedSections.at(-1)
    if (!removed || sections.length >= 60 || sections.some((section) => section.id === removed.section.id)) return
    const restored = [...sections]
    restored.splice(Math.min(removed.index, restored.length), 0, removed.section)
    setSections(restored)
    setRemovedSections((previous) => previous.slice(0, -1))
    requestAnimationFrame(() => sectionRefs.current.get(removed.section.id)?.querySelector("summary")?.focus())
  }
  const updateField = (section: Section, blockIndex: number, fieldIndex: number, nextField: Field | null) => {
    updateSection(section.id, { blocks: section.blocks.map((block, index) => index === blockIndex && block.type === "fields" ? { ...block, fields: block.fields.flatMap((field, index) => index === fieldIndex ? nextField ? [nextField] : [] : [field]) } : block) })
  }
  const addField = (section: Section) => {
    const field: Field = { kind: "textarea", id: newId("field"), label: "" }
    const fieldsIndex = section.blocks.findIndex((block) => block.type === "fields")
    const fieldsBlock = section.blocks[fieldsIndex]
    if (fieldsIndex < 0 && section.blocks.length >= 150 || fieldsBlock?.type === "fields" && fieldsBlock.fields.length >= 150) return
    updateSection(section.id, { blocks: fieldsIndex < 0 ? [...section.blocks, { type: "fields", fields: [field] }] : section.blocks.map((block, index) => index === fieldsIndex && block.type === "fields" ? { ...block, fields: [...block.fields, field] } : block) })
  }
  return <div className="space-y-4">
    <p className="text-sm leading-relaxed text-muted-foreground">{copy("Escolha seus títulos e campos. Tudo é opcional; use só o que ajudar nesta semana.", "Choose your own titles and fields. Everything is optional; keep only what helps this week.")}</p>
    {removedSections.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><p role="status" className="text-sm leading-relaxed">{copy("Seção removida deste rascunho. As respostas são preservadas; salve para aplicar.", "Section removed from this draft. Answers are preserved; save to apply.")}</p><button ref={undoRef} type="button" onClick={undoRemoval} disabled={sections.length >= 60 || sections.some((section) => section.id === removedSections.at(-1)?.section.id)} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-primary disabled:opacity-50"><Undo2 className="size-4" aria-hidden="true" />{copy("Desfazer Remoção", "Undo Removal")}</button></div>}
    {sections.map((section, sectionIndex) => <details key={section.id} ref={(element) => { if (element) sectionRefs.current.set(section.id, element); else sectionRefs.current.delete(section.id) }} open={sectionIndex === 0} className="rounded-2xl border border-border p-4 sm:p-5">
      <summary className="cursor-pointer break-words font-medium">{section.number} · {titleCase(section.title || copy("Nova Seção", "New Section"))}</summary>
      <div className="mt-5 space-y-4">
        <div className="flex flex-wrap justify-end gap-1">
          <button type="button" onClick={() => moveSection(sectionIndex, -1)} disabled={sectionIndex === 0} className="icon-button disabled:opacity-30" aria-label={`${copy("Mover para cima", "Move up")}: ${section.title}`}><ArrowUp className="size-4" aria-hidden="true" /></button>
          <button type="button" onClick={() => moveSection(sectionIndex, 1)} disabled={sectionIndex === sections.length - 1} className="icon-button disabled:opacity-30" aria-label={`${copy("Mover para baixo", "Move down")}: ${section.title}`}><ArrowDown className="size-4" aria-hidden="true" /></button>
          <button type="button" onClick={() => removeSection(section, sectionIndex)} className="icon-button text-muted-foreground hover:text-destructive" aria-label={`${copy("Remover seção", "Remove section")}: ${section.title}`}><Trash2 className="size-4" aria-hidden="true" /></button>
        </div>
        <div><label htmlFor={`edit-title-${section.id}`} className="mb-2 block text-sm font-medium">{copy("Título da Seção", "Section Title")}</label><input id={`edit-title-${section.id}`} value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value })} maxLength={500} className={inputClass} /></div>
        <details className="rounded-xl border border-border p-3"><summary className="cursor-pointer text-sm text-muted-foreground">{titleCase(copy("Descrição e Conteúdo · Opcional", "Description and Content · Optional"))}</summary><div className="mt-4 space-y-3">
          <label className="block text-sm">{copy("Etiqueta da Seção", "Section Label")}<input value={section.kicker} onChange={(event) => updateSection(section.id, { kicker: event.target.value })} maxLength={500} className={`${inputClass} mt-2`} /></label>
          {section.blocks.map((block, blockIndex) => (block.type === "p" || block.type === "lead" || block.type === "h" || block.type === "note") ? <label key={blockIndex} className="block text-sm">{copy("Texto", "Text")} {blockIndex + 1}<textarea value={block.text} onChange={(event) => updateSection(section.id, { blocks: section.blocks.map((item, index) => index === blockIndex ? { ...block, text: event.target.value } : item) })} maxLength={20000} rows={3} className={`${inputClass} mt-2`} /></label> : null)}
          <button type="button" disabled={section.blocks.length >= 150} onClick={() => updateSection(section.id, { blocks: [...section.blocks, { type: "p", text: "" }] })} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-primary hover:bg-accent"><Plus className="size-4" aria-hidden="true" />{copy("Adicionar Texto", "Add Text")}</button>
        </div></details>
        {section.blocks.map((block, blockIndex) => block.type === "fields" ? <div key={blockIndex} className="space-y-3">{block.fields.map((field, fieldIndex) => <div key={field.kind === "static" ? `static-${fieldIndex}` : field.id} className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-medium text-muted-foreground">{copy("Campo", "Field")} {fieldIndex + 1}</p><button type="button" className="icon-button text-muted-foreground hover:text-destructive" aria-label={copy("Remover campo", "Remove field")} onClick={() => updateField(section, blockIndex, fieldIndex, null)}><Trash2 className="size-4" aria-hidden="true" /></button></div>
          <div className="grid gap-3 sm:grid-cols-[1fr_170px]"><label className="block text-sm">{field.kind === "static" ? copy("Texto", "Text") : copy("Nome ou Pergunta", "Label or Question")}<input value={field.kind === "static" ? field.text : field.label} onChange={(event) => updateField(section, blockIndex, fieldIndex, field.kind === "static" ? { ...field, text: event.target.value } : { ...field, label: event.target.value })} maxLength={20000} className={`${inputClass} mt-2`} /></label><label className="block text-sm">{copy("Tipo de Campo", "Field Type")}<select value={field.kind} className={`${inputClass} mt-2`} onChange={(event) => updateField(section, blockIndex, fieldIndex, changeFieldKind(field, event.target.value as Field["kind"]))}><option value="text">{copy("Resposta Curta", "Short Answer")}</option><option value="textarea">{copy("Resposta Longa", "Long Answer")}</option><option value="scale">{copy("Escala", "Scale")}</option><option value="static">{copy("Somente Texto", "Text Only")}</option></select></label></div>
          {field.kind === "scale" && <label className="mt-3 block text-sm">{copy("Máximo da Escala (1–100)", "Scale Maximum (1–100)")}<input type="number" min={1} max={100} value={field.max || 10} onChange={(event) => updateField(section, blockIndex, fieldIndex, { ...field, max: Math.min(100, Math.max(1, Number(event.target.value) || 1)) })} className={`${inputClass} mt-2 max-w-32`} /></label>}
        </div>)}</div> : null)}
        <button type="button" onClick={() => addField(section)} disabled={section.blocks.some((block) => block.type === "fields" && block.fields.length >= 150) || !section.blocks.some((block) => block.type === "fields") && section.blocks.length >= 150} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-border px-4 text-sm text-primary hover:bg-accent"><Plus className="size-4" aria-hidden="true" />{copy("Adicionar Campo", "Add Field")}</button>
      </div>
    </details>)}
    {sections.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">{copy("Um planejador pode funcionar só com os sete dias. Adicione seções quando quiser.", "Your planner can work with just the seven days. Add sections whenever you wish.")}</p>}
    <button type="button" disabled={sections.length >= 60} onClick={() => setSections([...sections, { id: newId("section"), number: "", kicker: copy("OPCIONAL", "OPTIONAL"), title: copy("Minha Seção", "My Section"), blocks: [{ type: "fields", fields: [] }] }])} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-primary hover:bg-accent"><Plus className="size-4" aria-hidden="true" />{copy("Adicionar Seção", "Add Section")}</button>
  </div>
}
