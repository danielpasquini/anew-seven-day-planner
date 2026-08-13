"use client"

import { useState, useEffect } from "react"
import {
  BookOpen,
  Sparkles,
  X,
  Shield,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  AlertCircle,
  FileText,
  Clock,
  Heart,
  Brain,
  Compass,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type GuideIntensity = "muito leve" | "leve" | "moderada"

export interface GuideDraftData {
  name: string
  focus: string
  schemas: string
  traumaExperiences: string
  currentDifficulties: string
  priorityAreas: string
  psychologyLines: string
  theologyCosmovision: string
  routineSchedule: string
  whatHelps: string
  thingsToAvoid: string
  intensity: GuideIntensity
  additionalNotes: string
}

const STORAGE_KEY_GUIDE_DRAFT = "guia-novo-draft"

const INITIAL_DRAFT: GuideDraftData = {
  name: "",
  focus: "",
  schemas: "",
  traumaExperiences: "",
  currentDifficulties: "",
  priorityAreas: "",
  psychologyLines: "",
  theologyCosmovision: "",
  routineSchedule: "",
  whatHelps: "",
  thingsToAvoid: "",
  intensity: "leve",
  additionalNotes: "",
}

interface CreateGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateGuideModal({ isOpen, onClose }: CreateGuideModalProps) {
  const [step, setStep] = useState<"form" | "review">("form")
  const [formData, setFormData] = useState<GuideDraftData>(INITIAL_DRAFT)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  // Load draft from localStorage on mount/open
  useEffect(() => {
    if (!isOpen) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY_GUIDE_DRAFT)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === "object") {
          setFormData({ ...INITIAL_DRAFT, ...parsed })
        }
      }
    } catch {
      // ignore
    }
  }, [isOpen])

  // Auto-save draft on changes
  const updateField = (field: keyof GuideDraftData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      try {
        localStorage.setItem(STORAGE_KEY_GUIDE_DRAFT, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // Clear draft
  const handleResetDraft = () => {
    if (window.confirm("Deseja limpar todo o rascunho preenchido?")) {
      setFormData(INITIAL_DRAFT)
      try {
        localStorage.removeItem(STORAGE_KEY_GUIDE_DRAFT)
      } catch {
        // ignore
      }
      setErrors({})
      setStep("form")
    }
  }

  // Pure TypeScript rule: theologyEnabled is true if and only if theologyCosmovision has text
  const theologyEnabled = Boolean(formData.theologyCosmovision && formData.theologyCosmovision.trim().length > 0)

  // Validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!formData.name.trim()) {
      errs.name = "Informe um nome para o seu guia."
    }
    if (!formData.focus.trim()) {
      errs.focus = "Descreva o que você deseja trabalhar agora."
    }
    if (!formData.currentDifficulties.trim()) {
      errs.currentDifficulties = "Descreva suas principais dificuldades atuais."
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleProceedToReview = () => {
    if (validateForm()) {
      setStep("review")
      setSaveSuccessMsg(null)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-2.5 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-guide-title"
    >
      <div className="relative flex w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3.5 sm:px-6 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Sparkles className="size-4.5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="create-guide-title" className="font-serif text-base sm:text-lg font-semibold text-foreground">
                Criar Novo Guia Personalizado
              </h2>
              <p className="text-[0.7rem] sm:text-xs text-muted-foreground">
                {step === "form" ? "Passo 1 de 2: Preenchimento das diretrizes" : "Passo 2 de 2: Revisão das informações"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition touch-manipulation"
            aria-label="Fechar modal"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {step === "form" ? (
            /* STEP 1: FORMULÁRIO */
            <div className="space-y-6">
              {/* Top Banner with Auto-Save Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground">
                <div className="flex items-start gap-2">
                  <FileText className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Rascunho salvo automaticamente no seu navegador. Preencha com calma e no seu próprio ritmo.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetDraft}
                  className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-muted-foreground hover:text-destructive transition touch-manipulation self-end sm:self-auto shrink-0"
                >
                  <RotateCcw className="size-3" aria-hidden="true" />
                  <span>Limpar rascunho</span>
                </button>
              </div>

              {/* SEÇÃO 1: IDENTIFICAÇÃO E FOCO */}
              <div className="space-y-4">
                <h3 className="font-serif text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border pb-1.5">
                  <Compass className="size-4 text-primary" aria-hidden="true" />
                  1. Identificação & Foco Principal
                </h3>

                <div>
                  <label htmlFor="field-name" className="block text-xs font-semibold text-foreground mb-1">
                    Nome do Guia <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="field-name"
                    type="text"
                    placeholder="Ex: Guia de Superação da Evitação e Foco"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className={cn(
                      "w-full rounded-lg border bg-background px-3.5 py-2.5 text-base font-normal text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring min-h-[2.75rem]",
                      errors.name ? "border-destructive bg-destructive/5" : "border-input"
                    )}
                  />
                  {errors.name && (
                    <p className="mt-1 text-[0.7rem] text-destructive font-medium flex items-center gap-1">
                      <AlertCircle className="size-3" aria-hidden="true" /> {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-focus" className="block text-xs font-semibold text-foreground mb-1">
                    O que quero trabalhar agora? <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="field-focus"
                    rows={3}
                    placeholder="Ex: Reduzir a procrastinação no trabalho, conseguir manter uma rotina de caminhadas e retomar a leitura com constância."
                    value={formData.focus}
                    onChange={(e) => updateField("focus", e.target.value)}
                    className={cn(
                      "w-full rounded-lg border bg-background px-3.5 py-2.5 text-base font-normal text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[5rem]",
                      errors.focus ? "border-destructive bg-destructive/5" : "border-input"
                    )}
                  />
                  {errors.focus && (
                    <p className="mt-1 text-[0.7rem] text-destructive font-medium flex items-center gap-1">
                      <AlertCircle className="size-3" aria-hidden="true" /> {errors.focus}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-priorityAreas" className="block text-xs font-semibold text-foreground mb-1">
                    Áreas prioritárias
                  </label>
                  <input
                    id="field-priorityAreas"
                    type="text"
                    placeholder="Ex: Trabalho, sono, exercício físico, vida devocional, relacionamentos"
                    value={formData.priorityAreas}
                    onChange={(e) => updateField("priorityAreas", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-base font-normal text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring min-h-[2.75rem]"
                  />
                </div>
              </div>

              {/* SEÇÃO 2: ESQUEMAS, TRAUMAS & DIFICULDADES */}
              <div className="space-y-4">
                <h3 className="font-serif text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border pb-1.5">
                  <Brain className="size-4 text-primary" aria-hidden="true" />
                  2. Esquemas, Traumas & Dificuldades
                </h3>

                <div>
                  <label htmlFor="field-schemas" className="block text-xs font-semibold text-foreground mb-1">
                    Meus esquemas (se conhecidos)
                  </label>
                  <textarea
                    id="field-schemas"
                    rows={2}
                    placeholder="Ex: Fracasso, Padrões Inflexíveis/Postura Crítica, Autossacrifício, Defectividade/Vergonha."
                    value={formData.schemas}
                    onChange={(e) => updateField("schemas", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-base font-normal text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[4rem]"
                  />
                </div>

                <div>
                  <label htmlFor="field-difficulties" className="block text-xs font-semibold text-foreground mb-1">
                    Dificuldades atuais <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="field-difficulties"
                    rows={3}
                    placeholder="Ex: Ansiedade ao abrir o e-mail de manhã, sensação de paralisia diante de tarefas complexas, desânimo ao final da tarde."
                    value={formData.currentDifficulties}
                    onChange={(e) => updateField("currentDifficulties", e.target.value)}
                    className={cn(
                      "w-full rounded-lg border bg-background px-3.5 py-2.5 text-base font-normal text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[5rem]",
                      errors.currentDifficulties ? "border-destructive bg-destructive/5" : "border-input"
                    )}
                  />
                  {errors.currentDifficulties && (
                    <p className="mt-1 text-[0.7rem] text-destructive font-medium flex items-center gap-1">
                      <AlertCircle className="size-3" aria-hidden="true" /> {errors.currentDifficulties}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-traumaExperiences" className="block text-xs font-semibold text-foreground mb-1">
                    Traumas ou experiências relevantes, em resumo
                  </label>
                  <textarea
                    id="field-traumaExperiences"
                    rows={2}
                    placeholder="Ex: Burnout em 2023 após projeto exaustivo; ambiente familiar de cobrança perfeccionista na infância."
                    value={formData.traumaExperiences}
                    onChange={(e) => updateField("traumaExperiences", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-base font-normal text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[4rem]"
                  />
                </div>
              </div>

              {/* SEÇÃO 3: LINHAS DA PSICOLOGIA & TEOLOGIA */}
              <div className="space-y-4">
                <h3 className="font-serif text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border pb-1.5">
                  <Heart className="size-4 text-primary" aria-hidden="true" />
                  3. Linhas da Psicologia & Teologia/Cosmovisão
                </h3>

                <div>
                  <label htmlFor="field-psychologyLines" className="block text-xs font-semibold text-foreground mb-1">
                    Linhas da psicologia preferidas
                  </label>
                  <input
                    id="field-psychologyLines"
                    type="text"
                    placeholder="Ex: Terapia do Esquema, TCC (Terapia Cognitivo-Comportamental), ACT, Ativação Comportamental"
                    value={formData.psychologyLines}
                    onChange={(e) => updateField("psychologyLines", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-base font-normal text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring min-h-[2.75rem]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="field-theologyCosmovision" className="block text-xs font-semibold text-foreground">
                      Teologia / Cosmovisão <span className="text-muted-foreground font-normal">(Opcional)</span>
                    </label>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[0.65rem] font-bold transition",
                        theologyEnabled
                          ? "bg-gold/15 text-gold border border-gold/30"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {theologyEnabled ? "✓ Teologia Ativada" : "Comportamental / Sem Teologia"}
                    </span>
                  </div>
                  <textarea
                    id="field-theologyCosmovision"
                    rows={3}
                    placeholder="Se preenchido, o guia integrará Escritura, salmos e reflexões cristãs. Se deixado vazio, o guia será estritamente psicológico e comportamental."
                    value={formData.theologyCosmovision}
                    onChange={(e) => updateField("theologyCosmovision", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-base font-normal text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[4.5rem]"
                  />
                  <p className="mt-1 text-[0.7rem] text-muted-foreground">
                    {theologyEnabled
                      ? "O campo está preenchido: o guia e a análise semanal incluirão a dimensão teológica."
                      : "Campo vazio: o guia será gerado sem elementos teológicos ou religiosos."}
                  </p>
                </div>
              </div>

              {/* SEÇÃO 4: ROTINA, LIMITES & INTENSIDADE */}
              <div className="space-y-4">
                <h3 className="font-serif text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border pb-1.5">
                  <Clock className="size-4 text-primary" aria-hidden="true" />
                  4. Rotina, Limites & Intensidade
                </h3>

                <div>
                  <label htmlFor="field-routineSchedule" className="block text-xs font-semibold text-foreground mb-1">
                    Rotina e horários disponíveis
                  </label>
                  <textarea
                    id="field-routineSchedule"
                    rows={2}
                    placeholder="Ex: Dias úteis: livre das 6h30 às 8h e após as 19h30. Finais de semana: manhãs livres."
                    value={formData.routineSchedule}
                    onChange={(e) => updateField("routineSchedule", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-base font-normal text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[4rem]"
                  />
                </div>

                <div>
                  <label htmlFor="field-whatHelps" className="block text-xs font-semibold text-foreground mb-1">
                    O que costuma ajudar você?
                  </label>
                  <textarea
                    id="field-whatHelps"
                    rows={2}
                    placeholder="Ex: Listas curtas de 3 itens, pausas para café ao ar livre, oração matinal, timer de 15 minutos."
                    value={formData.whatHelps}
                    onChange={(e) => updateField("whatHelps", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-base font-normal text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[4rem]"
                  />
                </div>

                <div>
                  <label htmlFor="field-thingsToAvoid" className="block text-xs font-semibold text-foreground mb-1">
                    Coisas que quero evitar / Limites
                  </label>
                  <textarea
                    id="field-thingsToAvoid"
                    rows={2}
                    placeholder="Ex: Metas inatingíveis, ficar no celular antes de dormir, se cobrar produtividade máxima todos os dias."
                    value={formData.thingsToAvoid}
                    onChange={(e) => updateField("thingsToAvoid", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-base font-normal text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[4rem]"
                  />
                </div>

                {/* Intensidade Segmented Selection */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Intensidade desejada para os ciclos semanais
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(
                      [
                        { id: "muito leve", title: "Muito Leve", desc: "Passos mínimos de 5-10 min, foco em descompressão." },
                        { id: "leve", title: "Leve", desc: "Rotinas de 15-20 min, equilíbrio e constância gradual." },
                        { id: "moderada", title: "Moderada", desc: "Rotinas estruturadas de 30 min com metas definidas." },
                      ] as const
                    ).map((lvl) => {
                      const isSelected = formData.intensity === lvl.id
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => updateField("intensity", lvl.id)}
                          className={cn(
                            "flex flex-col text-left p-3 rounded-xl border transition touch-manipulation min-h-[3.25rem]",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-xs"
                              : "border-border bg-card hover:bg-accent/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-serif text-xs font-semibold text-foreground">
                              {lvl.title}
                            </span>
                            {isSelected && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                          </div>
                          <span className="text-[0.7rem] text-muted-foreground mt-1 leading-snug">
                            {lvl.desc}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="field-additionalNotes" className="block text-xs font-semibold text-foreground mb-1">
                    Observações adicionais
                  </label>
                  <textarea
                    id="field-additionalNotes"
                    rows={2}
                    placeholder="Ex: Estou passando por mudança de emprego; prefiro textos diretos e sem jargões acadêmicos."
                    value={formData.additionalNotes}
                    onChange={(e) => updateField("additionalNotes", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-base font-normal text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[4rem]"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: REVISÃO DE INFORMAÇÕES */
            <div className="space-y-6">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-serif text-base font-semibold text-foreground">
                    {formData.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[0.7rem] font-medium text-secondary-foreground capitalize">
                      Intensidade: {formData.intensity}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold border",
                        theologyEnabled
                          ? "bg-gold/15 text-gold border-gold/30"
                          : "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {theologyEnabled ? "Teologia Ativa" : "Comportamental"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Confira as informações que guiarão a geração do seu Guia Template.
                </p>
              </div>

              {/* Review Cards Grid */}
              <div className="grid grid-cols-1 gap-4 text-xs">
                <div className="rounded-lg border border-border bg-card p-4 space-y-1.5">
                  <span className="font-semibold text-foreground block">🎯 Foco Principal:</span>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{formData.focus}</p>
                </div>

                {formData.priorityAreas && (
                  <div className="rounded-lg border border-border bg-card p-4 space-y-1.5">
                    <span className="font-semibold text-foreground block">📍 Áreas Prioritárias:</span>
                    <p className="text-muted-foreground leading-relaxed">{formData.priorityAreas}</p>
                  </div>
                )}

                {(formData.schemas || formData.currentDifficulties || formData.traumaExperiences) && (
                  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <span className="font-semibold text-foreground block">🧠 Esquemas & Dificuldades:</span>
                    {formData.schemas && (
                      <div>
                        <span className="text-[0.7rem] font-semibold uppercase text-muted-foreground block">Esquemas:</span>
                        <p className="text-muted-foreground mt-0.5">{formData.schemas}</p>
                      </div>
                    )}
                    {formData.currentDifficulties && (
                      <div>
                        <span className="text-[0.7rem] font-semibold uppercase text-muted-foreground block">Dificuldades:</span>
                        <p className="text-muted-foreground mt-0.5">{formData.currentDifficulties}</p>
                      </div>
                    )}
                    {formData.traumaExperiences && (
                      <div>
                        <span className="text-[0.7rem] font-semibold uppercase text-muted-foreground block">Experiências Relevantes:</span>
                        <p className="text-muted-foreground mt-0.5">{formData.traumaExperiences}</p>
                      </div>
                    )}
                  </div>
                )}

                {(formData.psychologyLines || formData.theologyCosmovision) && (
                  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <span className="font-semibold text-foreground block">📖 Abordagem Teórica & Cosmovisão:</span>
                    {formData.psychologyLines && (
                      <div>
                        <span className="text-[0.7rem] font-semibold uppercase text-muted-foreground block">Linhas da Psicologia:</span>
                        <p className="text-muted-foreground mt-0.5">{formData.psychologyLines}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-[0.7rem] font-semibold uppercase text-muted-foreground block">Teologia / Cosmovisão:</span>
                      <p className="text-muted-foreground mt-0.5">
                        {formData.theologyCosmovision || "(Nenhuma - Guia 100% comportamental/psicológico)"}
                      </p>
                    </div>
                  </div>
                )}

                {(formData.routineSchedule || formData.whatHelps || formData.thingsToAvoid || formData.additionalNotes) && (
                  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <span className="font-semibold text-foreground block">⏰ Rotina & Limites Práticos:</span>
                    {formData.routineSchedule && (
                      <div>
                        <span className="text-[0.7rem] font-semibold uppercase text-muted-foreground block">Rotina:</span>
                        <p className="text-muted-foreground mt-0.5">{formData.routineSchedule}</p>
                      </div>
                    )}
                    {formData.whatHelps && (
                      <div>
                        <span className="text-[0.7rem] font-semibold uppercase text-muted-foreground block">O que Ajuda:</span>
                        <p className="text-muted-foreground mt-0.5">{formData.whatHelps}</p>
                      </div>
                    )}
                    {formData.thingsToAvoid && (
                      <div>
                        <span className="text-[0.7rem] font-semibold uppercase text-muted-foreground block">Coisas a Evitar:</span>
                        <p className="text-muted-foreground mt-0.5">{formData.thingsToAvoid}</p>
                      </div>
                    )}
                    {formData.additionalNotes && (
                      <div>
                        <span className="text-[0.7rem] font-semibold uppercase text-muted-foreground block">Observações:</span>
                        <p className="text-muted-foreground mt-0.5">{formData.additionalNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {saveSuccessMsg && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Information Notice for Next Phase */}
              <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                  Próxima Etapa: Geração do Guia via Gemini AI
                </p>
                <p>
                  Suas diretrizes e preferências foram validadas e salvas em rascunho com sucesso. Na próxima etapa, o motor Gemini gerará a estrutura completa de seções, exercícios e cronograma de 7 dias baseado exatamente nestes parâmetros.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3 sm:px-6 shrink-0 gap-2">
          {step === "form" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition touch-manipulation min-h-[2.5rem]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProceedToReview}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition touch-manipulation min-h-[2.5rem]"
              >
                <span>Revisar Informações</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition touch-manipulation min-h-[2.5rem]"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                <span>Editar Informações</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSaveSuccessMsg("Rascunho do guia salvo com sucesso! Pronto para geração com IA na próxima etapa.")
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition touch-manipulation min-h-[2.5rem]"
              >
                <Check className="size-3.5" aria-hidden="true" />
                <span>Salvar Rascunho</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
