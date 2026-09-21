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
  Loader2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import type { GuideTemplate, Section } from "@/lib/guide-data"

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
  const { t, locale, bibleVersion, saveAndActivateGuide } = useStore()
  const [step, setStep] = useState<"form" | "review" | "preview">("form")
  const [formData, setFormData] = useState<GuideDraftData>(INITIAL_DRAFT)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generatedGuide, setGeneratedGuide] = useState<GuideTemplate | null>(null)
  const [profileSummary, setProfileSummary] = useState<string>("")
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null)

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
    if (window.confirm(t.createGuide.resetDraftConfirm)) {
      setFormData(INITIAL_DRAFT)
      try {
        localStorage.removeItem(STORAGE_KEY_GUIDE_DRAFT)
      } catch {
        // ignore
      }
      setErrors({})
      setStep("form")
      setGeneratedGuide(null)
    }
  }

  // Deterministic calculation of theology status
  const theologyEnabled = Boolean(
    formData.theologyCosmovision && formData.theologyCosmovision.trim().length > 0
  )

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = t.createGuide.errorName
    }
    if (!formData.focus.trim()) {
      newErrors.focus = t.createGuide.errorFocus
    }
    if (!formData.currentDifficulties.trim()) {
      newErrors.currentDifficulties = t.createGuide.errorDifficulties
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProceedToReview = () => {
    if (validateForm()) {
      setStep("review")
      setSaveSuccessMsg(null)
    }
  }

  // Call Gemini API to generate the Guide Template
  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationError(null)
    try {
      const intensityCode =
        formData.intensity === "muito leve"
          ? "very_light"
          : formData.intensity === "moderada"
          ? "moderate"
          : "light"

      const payload = {
        name: formData.name,
        focus: formData.focus,
        schemas: formData.schemas,
        traumaSummary: formData.traumaExperiences,
        currentDifficulties: formData.currentDifficulties,
        priorityAreas: formData.priorityAreas,
        psychologyApproaches: formData.psychologyLines,
        theologyCosmovision: formData.theologyCosmovision,
        routine: formData.routineSchedule,
        whatHelps: formData.whatHelps,
        thingsToAvoid: formData.thingsToAvoid,
        intensity: intensityCode,
        additionalNotes: formData.additionalNotes,
        contentLocale: locale,
        bibleVersion: theologyEnabled ? bibleVersion : null,
      }

      const res = await fetch("/api/generate-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.guideTemplate) {
        throw new Error(data.error || "Não foi possível gerar o guia.")
      }

      setGeneratedGuide(data.guideTemplate)
      setProfileSummary(data.profileSummary || "")
      setStep("preview")
      if (data.guideTemplate.sections?.length > 0) {
        setExpandedSectionId(data.guideTemplate.sections[0].id)
      }
    } catch (err: any) {
      console.error("Erro ao gerar guia:", err)
      setGenerationError(err.message || "Erro de conexão ao gerar guia com IA.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Save generated guide and make active
  const handleSaveAndActivate = () => {
    if (!generatedGuide) return
    saveAndActivateGuide(generatedGuide)
    try {
      localStorage.removeItem(STORAGE_KEY_GUIDE_DRAFT)
    } catch {}
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-guide-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3.5 sm:px-6 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {step === "preview" ? (
                <Sparkles className="size-4" aria-hidden="true" />
              ) : (
                <BookOpen className="size-4" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h2 id="create-guide-modal-title" className="font-serif text-base font-bold text-foreground truncate">
                {step === "preview"
                  ? t.createGuide.previewTitle
                  : step === "review"
                  ? t.createGuide.reviewSectionTitle
                  : t.createGuide.title}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {step === "preview"
                  ? t.createGuide.previewSubtitle
                  : step === "review"
                  ? t.createGuide.reviewSummaryDesc
                  : t.createGuide.step1Subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {step === "form" && (
              <button
                type="button"
                onClick={handleResetDraft}
                title={t.createGuide.resetDraft}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition touch-manipulation"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition touch-manipulation"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">
          {/* STEP 1: FORMULÁRIO */}
          {step === "form" && (
            <div className="space-y-6">
              {/* Informative banner */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4 text-xs text-foreground/90 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <Shield className="size-4 shrink-0" aria-hidden="true" />
                  <span>{t.createGuide.title}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {t.createGuide.step1Subtitle}
                </p>
              </div>

              {/* Form Sections */}
              <div className="space-y-5">
                {/* 1. Identificação & Foco */}
                <div className="rounded-xl border border-border p-4 bg-card/60 space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                    <Compass className="size-4 text-primary" aria-hidden="true" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t.createGuide.section1Title}
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {t.createGuide.fieldName} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t.createGuide.fieldNamePlaceholder}
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={cn(
                        "w-full rounded-lg border bg-card px-3.5 py-2.5 text-base font-medium text-foreground transition focus:outline-none focus:ring-2",
                        errors.name
                          ? "border-red-500 focus:ring-red-500/30"
                          : "border-input focus:border-primary focus:ring-ring/30"
                      )}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="size-3" aria-hidden="true" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {t.createGuide.fieldFocus} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder={t.createGuide.fieldFocusPlaceholder}
                      value={formData.focus}
                      onChange={(e) => updateField("focus", e.target.value)}
                      className={cn(
                        "w-full rounded-lg border bg-card px-3.5 py-2.5 text-base font-medium text-foreground transition focus:outline-none focus:ring-2",
                        errors.focus
                          ? "border-red-500 focus:ring-red-500/30"
                          : "border-input focus:border-primary focus:ring-ring/30"
                      )}
                    />
                    {errors.focus && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="size-3" aria-hidden="true" />
                        {errors.focus}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {t.createGuide.fieldPriorityAreas}
                    </label>
                    <input
                      type="text"
                      placeholder={t.createGuide.fieldPriorityAreasPlaceholder}
                      value={formData.priorityAreas}
                      onChange={(e) => updateField("priorityAreas", e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                </div>

                {/* 2. Esquemas & Dificuldades */}
                <div className="rounded-xl border border-border p-4 bg-card/60 space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                    <Brain className="size-4 text-primary" aria-hidden="true" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t.createGuide.section2Title}
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {t.createGuide.fieldDifficulties} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder={t.createGuide.fieldDifficultiesPlaceholder}
                      value={formData.currentDifficulties}
                      onChange={(e) => updateField("currentDifficulties", e.target.value)}
                      className={cn(
                        "w-full rounded-lg border bg-card px-3.5 py-2.5 text-base font-medium text-foreground transition focus:outline-none focus:ring-2",
                        errors.currentDifficulties
                          ? "border-red-500 focus:ring-red-500/30"
                          : "border-input focus:border-primary focus:ring-ring/30"
                      )}
                    />
                    {errors.currentDifficulties && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="size-3" aria-hidden="true" />
                        {errors.currentDifficulties}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {t.createGuide.fieldSchemas}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={t.createGuide.fieldSchemasPlaceholder}
                      value={formData.schemas}
                      onChange={(e) => updateField("schemas", e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {t.createGuide.fieldTrauma}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={t.createGuide.fieldTraumaPlaceholder}
                      value={formData.traumaExperiences}
                      onChange={(e) => updateField("traumaExperiences", e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                </div>

                {/* 3. Abordagens & Teologia */}
                <div className="rounded-xl border border-border p-4 bg-card/60 space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                    <Heart className="size-4 text-primary" aria-hidden="true" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t.createGuide.section3Title}
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {t.createGuide.fieldPsychologyLines}
                    </label>
                    <input
                      type="text"
                      placeholder={t.createGuide.fieldPsychologyLinesPlaceholder}
                      value={formData.psychologyLines}
                      onChange={(e) => updateField("psychologyLines", e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-foreground">
                        {t.createGuide.fieldTheology}
                      </label>
                      <span
                        className={cn(
                          "text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                          theologyEnabled
                            ? "bg-gold/20 text-gold-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {theologyEnabled
                          ? t.createGuide.theologyActiveBadge
                          : t.createGuide.theologyInactiveBadge}
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      placeholder={t.createGuide.fieldTheologyPlaceholder}
                      value={formData.theologyCosmovision}
                      onChange={(e) => updateField("theologyCosmovision", e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                    <p className="mt-1 text-[0.7rem] text-muted-foreground">
                      {theologyEnabled
                        ? t.createGuide.theologyActiveNote
                        : t.createGuide.theologyInactiveNote}
                    </p>
                  </div>
                </div>

                {/* 4. Rotina & Intensidade */}
                <div className="rounded-xl border border-border p-4 bg-card/60 space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                    <Clock className="size-4 text-primary" aria-hidden="true" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t.createGuide.section4Title}
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {t.createGuide.fieldRoutine}
                    </label>
                    <input
                      type="text"
                      placeholder={t.createGuide.fieldRoutinePlaceholder}
                      value={formData.routineSchedule}
                      onChange={(e) => updateField("routineSchedule", e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        {t.createGuide.fieldWhatHelps}
                      </label>
                      <input
                        type="text"
                        placeholder={t.createGuide.fieldWhatHelpsPlaceholder}
                        value={formData.whatHelps}
                        onChange={(e) => updateField("whatHelps", e.target.value)}
                        className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        {t.createGuide.fieldThingsToAvoid}
                      </label>
                      <input
                        type="text"
                        placeholder={t.createGuide.fieldThingsToAvoidPlaceholder}
                        value={formData.thingsToAvoid}
                        onChange={(e) => updateField("thingsToAvoid", e.target.value)}
                        className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t.createGuide.intensityLabel}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => updateField("intensity", "muito leve")}
                        className={cn(
                          "flex flex-col gap-1 rounded-xl border p-3 text-left transition touch-manipulation",
                          formData.intensity === "muito leve"
                            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                            : "border-border bg-card hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{t.createGuide.intensityVeryLight}</span>
                          {formData.intensity === "muito leve" && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                        </div>
                        <span className="text-[0.7rem] text-muted-foreground">{t.createGuide.intensityVeryLightDesc}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateField("intensity", "leve")}
                        className={cn(
                          "flex flex-col gap-1 rounded-xl border p-3 text-left transition touch-manipulation",
                          formData.intensity === "leve"
                            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                            : "border-border bg-card hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{t.createGuide.intensityLight}</span>
                          {formData.intensity === "leve" && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                        </div>
                        <span className="text-[0.7rem] text-muted-foreground">{t.createGuide.intensityLightDesc}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateField("intensity", "moderada")}
                        className={cn(
                          "flex flex-col gap-1 rounded-xl border p-3 text-left transition touch-manipulation",
                          formData.intensity === "moderada"
                            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                            : "border-border bg-card hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{t.createGuide.intensityModerate}</span>
                          {formData.intensity === "moderada" && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                        </div>
                        <span className="text-[0.7rem] text-muted-foreground">{t.createGuide.intensityModerateDesc}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {t.createGuide.fieldNotes}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={t.createGuide.fieldNotesPlaceholder}
                      value={formData.additionalNotes}
                      onChange={(e) => updateField("additionalNotes", e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REVISÃO */}
          {step === "review" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1">
                <h3 className="font-serif text-base font-semibold text-primary">
                  {t.createGuide.reviewSectionTitle}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t.createGuide.reviewSummaryDesc}
                </p>
              </div>

              {generationError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
                  <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-bold">{t.createGuide.generationErrorTitle}</p>
                    <p className="leading-relaxed">{generationError}</p>
                  </div>
                </div>
              )}

              {saveSuccessMsg && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Summary Cards */}
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-border p-4 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-muted-foreground">1. Identificação</span>
                    <span className="font-semibold text-primary text-sm">{formData.name}</span>
                  </div>
                  <div className="text-foreground/90 space-y-1">
                    <p><strong>Foco:</strong> {formData.focus}</p>
                    {formData.priorityAreas && <p><strong>Áreas prioritárias:</strong> {formData.priorityAreas}</p>}
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4 bg-card space-y-2">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground block">2. Esquemas & Dificuldades</span>
                  <div className="text-foreground/90 space-y-1">
                    <p><strong>Dificuldades atuais:</strong> {formData.currentDifficulties}</p>
                    {formData.schemas && <p><strong>Esquemas:</strong> {formData.schemas}</p>}
                    {formData.traumaExperiences && <p><strong>Traumas/experiências:</strong> {formData.traumaExperiences}</p>}
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-muted-foreground">3. Abordagens & Teologia</span>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[0.65rem] font-bold",
                        theologyEnabled ? "bg-gold/20 text-gold-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {theologyEnabled ? t.createGuide.theologyActiveBadge : t.createGuide.theologyInactiveBadge}
                    </span>
                  </div>
                  <div className="text-foreground/90 space-y-1">
                    {formData.psychologyLines && <p><strong>Linhas da psicologia:</strong> {formData.psychologyLines}</p>}
                    {formData.theologyCosmovision ? (
                      <p><strong>Cosmovisão:</strong> {formData.theologyCosmovision}</p>
                    ) : (
                      <p className="text-muted-foreground italic">{t.createGuide.theologyInactiveNotice}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-muted-foreground">4. Rotina & Intensidade</span>
                    <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[0.65rem] font-bold capitalize">
                      {formData.intensity}
                    </span>
                  </div>
                  <div className="text-foreground/90 space-y-1">
                    {formData.routineSchedule && <p><strong>Rotina:</strong> {formData.routineSchedule}</p>}
                    {formData.whatHelps && <p><strong>O que ajuda:</strong> {formData.whatHelps}</p>}
                    {formData.thingsToAvoid && <p><strong>Limites/Evitar:</strong> {formData.thingsToAvoid}</p>}
                    {formData.additionalNotes && <p><strong>Observações:</strong> {formData.additionalNotes}</p>}
                  </div>
                </div>
              </div>

              {/* Ready notice for AI generation */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <Sparkles className="size-4" aria-hidden="true" />
                  <span>{t.createGuide.nextStepTitle}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t.createGuide.nextStepDesc}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW DO GUIA GERADO */}
          {step === "preview" && generatedGuide && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header Card */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <span className="rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-xs font-bold">
                    {generatedGuide.config?.category || "Retomada"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-muted px-2 py-0.5 text-[0.65rem] font-bold text-muted-foreground">
                      {generatedGuide.contentLocale}
                    </span>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[0.65rem] font-bold",
                        generatedGuide.theologyEnabled
                          ? "bg-gold/20 text-gold-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {generatedGuide.theologyEnabled
                        ? t.createGuide.theologyActiveBadge
                        : t.createGuide.theologyInactiveBadge}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-bold text-foreground">
                    {generatedGuide.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {generatedGuide.description}
                  </p>
                </div>

                {profileSummary && (
                  <div className="rounded-xl border border-border/80 bg-card p-3 text-xs space-y-1 text-foreground/90">
                    <span className="font-bold text-primary block">{t.createGuide.profileSummaryLabel}</span>
                    <p className="leading-relaxed">{profileSummary}</p>
                  </div>
                )}
              </div>

              {/* Sections Accordion */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers className="size-4 text-primary" aria-hidden="true" />
                    <span>{t.createGuide.sectionsGeneratedLabel} ({generatedGuide.sections?.length || 0})</span>
                  </h4>
                </div>

                <div className="space-y-2">
                  {generatedGuide.sections?.map((sec, idx) => {
                    const isExpanded = expandedSectionId === sec.id
                    return (
                      <div
                        key={sec.id}
                        className="rounded-xl border border-border bg-card overflow-hidden transition"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedSectionId(isExpanded ? null : sec.id)}
                          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-muted/40 transition touch-manipulation"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-serif text-xs font-bold text-primary shrink-0">
                              {sec.number}
                            </span>
                            <div className="min-w-0">
                              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground block">
                                {sec.kicker}
                              </span>
                              <span className="text-xs font-semibold text-foreground truncate block">
                                {sec.title}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {sec.scripture && (
                              <span className="text-[0.65rem] bg-gold/15 text-gold-foreground rounded px-1.5 py-0.5 font-bold">
                                {sec.scripture.verses?.length || 1} ref
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="size-4 text-muted-foreground" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-border/60 p-4 bg-muted/20 text-xs space-y-3 animate-in fade-in duration-150">
                            {sec.blocks?.map((b, bIdx) => (
                              <div key={bIdx} className="text-foreground/85 leading-relaxed">
                                {b.type === "lead" && <p className="font-semibold text-foreground italic">{b.text}</p>}
                                {b.type === "p" && <p>{b.text}</p>}
                                {b.type === "h" && <h5 className="font-bold text-foreground mt-2">{b.text}</h5>}
                                {b.type === "list" && (
                                  <ul className="list-disc list-inside space-y-1 pl-1">
                                    {b.items?.map((it, iIdx) => <li key={iIdx}>{it}</li>)}
                                  </ul>
                                )}
                                {b.type === "note" && (
                                  <div className="rounded-lg bg-primary/10 border-l-2 border-primary p-2 text-[0.75rem]">
                                    {b.label && <strong className="block text-primary">{b.label}</strong>}
                                    <span>{b.text}</span>
                                  </div>
                                )}
                              </div>
                            ))}

                            {sec.scripture && (
                              <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-xs space-y-1 text-gold-foreground">
                                <span className="font-bold block">
                                  {sec.scripture.verses?.map((v) => v.ref).join(" • ")}
                                </span>
                                {sec.scripture.comentario && (
                                  <p className="text-foreground/80 italic">{sec.scripture.comentario}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Weekly Plan (7 Days) Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-4 text-primary" aria-hidden="true" />
                  <span>{t.createGuide.weeklyPlanLabel}</span>
                </h4>

                <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                      const dayTasks = (generatedGuide.weeklyPlan || []).filter((t) => t.dayIndex === dayIdx)
                      return (
                        <div
                          key={dayIdx}
                          className="rounded-lg border border-border/80 bg-muted/30 p-2.5 flex flex-col justify-between space-y-1"
                        >
                          <span className="font-bold text-primary text-[0.7rem] uppercase">
                            {t.schedule.days[dayIdx]}
                          </span>
                          <span className="text-[0.65rem] text-muted-foreground">
                            {dayTasks.length} {t.common.tasks}
                          </span>
                          <div className="space-y-1 pt-1 border-t border-border/40">
                            {dayTasks.slice(0, 2).map((t, tIdx) => (
                              <p key={tIdx} className="text-[0.65rem] text-foreground/90 truncate" title={t.description}>
                                <strong className="text-primary/90">{t.time}</strong> {t.description}
                              </p>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Quick Sheets & Safety Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {generatedGuide.quickSheets && generatedGuide.quickSheets.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <span className="font-bold uppercase tracking-wider text-muted-foreground block">
                      {t.createGuide.quickSheetsLabel}
                    </span>
                    <ul className="space-y-1.5">
                      {generatedGuide.quickSheets.map((qs, i) => (
                        <li key={i} className="text-foreground/90">
                          <strong className="text-primary">{qs.title}:</strong> {qs.summary}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {generatedGuide.safetyNotes && generatedGuide.safetyNotes.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <span className="font-bold uppercase tracking-wider text-muted-foreground block">
                      {t.createGuide.safetyNotesLabel}
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-foreground/90">
                      {generatedGuide.safetyNotes.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3 sm:px-6 shrink-0">
          {step === "form" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent transition touch-manipulation min-h-[2.5rem]"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleProceedToReview}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition touch-manipulation min-h-[2.5rem]"
              >
                <span>{t.createGuide.btnReview}</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </button>
            </>
          )}

          {step === "review" && (
            <>
              <button
                type="button"
                onClick={() => setStep("form")}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent transition touch-manipulation min-h-[2.5rem] disabled:opacity-50"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                <span>{t.createGuide.btnEdit}</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSaveSuccessMsg(t.createGuide.saveDraftSuccess)
                  }}
                  disabled={isGenerating}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition touch-manipulation min-h-[2.5rem] disabled:opacity-50"
                >
                  <Check className="size-3.5" aria-hidden="true" />
                  <span>{t.createGuide.btnSaveDraft}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition touch-manipulation min-h-[2.5rem] shadow-xs disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      <span>{t.createGuide.generatingTitle}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      <span>{t.createGuide.btnGenerate}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === "preview" && (
            <div className="flex flex-col sm:flex-row w-full sm:items-center justify-between gap-2.5">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent transition touch-manipulation min-h-[2.5rem]"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                  <span>{t.createGuide.btnEdit}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent transition touch-manipulation min-h-[2.5rem] disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                  )}
                  <span>{t.createGuide.btnRegenerate}</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent transition touch-manipulation min-h-[2.5rem]"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndActivate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition touch-manipulation min-h-[2.5rem] shadow-xs"
                >
                  <Check className="size-3.5" aria-hidden="true" />
                  <span>{t.createGuide.btnSaveAndActivate}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
