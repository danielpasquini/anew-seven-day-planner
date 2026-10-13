"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, Check, Loader2, RotateCcw, Sparkles, X } from "lucide-react"
import { useStore } from "@/lib/store"
import type { GuideTemplate } from "@/lib/guide-data"
import { buildPresetGuide, getPlannerPresets, type PlannerPresetId } from "@/lib/planner"
import { cn } from "@/lib/utils"
import { useModalAccessibility } from "@/components/modal-accessibility"
import { GuideSectionEditor, validateGuideSections } from "@/components/guide-section-editor"
import { useAuth } from "@/lib/auth/client"
import { useDemo } from "@/lib/demo"
import { getAuthToken } from "@/lib/auth/firebase-client"
import { apiUrl } from "@/lib/api-url"
import { titleCase } from "@/lib/title-case"
import { isValidGuide } from "@/lib/backup-validation"

export type GuideIntensity = "muito leve" | "leve" | "moderada"
export interface GuideDraftData { name: string; focus: string; currentDifficulties: string; psychologyLines: string; theologyCosmovision: string; routineSchedule: string; whatHelps: string; thingsToAvoid: string; intensity: GuideIntensity; additionalNotes: string }
const INITIAL_DRAFT: GuideDraftData = { name: "", focus: "", currentDifficulties: "", psychologyLines: "", theologyCosmovision: "", routineSchedule: "", whatHelps: "", thingsToAvoid: "", intensity: "muito leve", additionalNotes: "" }
type Suggestions = Partial<Record<"name" | "focus" | "routineSchedule" | "whatHelps" | "thingsToAvoid" | "additionalNotes", string>>

function DraftField({ field, label, hint, value, onChange, multiline = false }: { field: keyof GuideDraftData; label: string; hint?: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  const props = { id: `guide-draft-${field}`, value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value), maxLength: field === "name" ? 100 : 1200, "aria-describedby": hint ? `guide-draft-${field}-hint` : undefined, className: "w-full rounded-xl border border-input bg-background/50 px-3.5 py-3 text-base leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-ring/20" }
  return <div><label htmlFor={props.id} className="mb-2 block text-sm font-medium">{titleCase(label)}</label>{multiline ? <textarea {...props} rows={3} /> : <input {...props} type="text" />}{hint && <p id={`guide-draft-${field}-hint`} className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>}</div>
}

export function CreateGuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const demo = useDemo()
  const { locale, bibleVersion, saveAndActivateGuide, storageReadOnly, t } = useStore()
  const { user } = useAuth()
  const draftKey = `guia-novo-draft:${demo.enabled ? "demo" : user?.uid || "preview"}`
  const draftStorage = () => demo.enabled ? demo.demoStorage : localStorage
  const en = locale === "en-US"
  const copy = (pt: string, english: string) => en ? english : pt
  const [step, setStep] = useState<"form" | "share" | "preview">("form")
  const [draft, setDraft] = useState<GuideDraftData>(INITIAL_DRAFT)
  const [preset, setPreset] = useState<PlannerPresetId>("gentle")
  const [spiritualityEnabled, setSpiritualityEnabled] = useState(false)
  const [aiConsent, setAIConsent] = useState(false)
  const [aiPurpose, setAIPurpose] = useState<"assist" | "plan">("plan")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftError, setDraftError] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [generatedGuide, setGeneratedGuide] = useState<GuideTemplate | null>(null)
  const [guideSource, setGuideSource] = useState<"preset" | "ai">("preset")
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const close = () => { abortRef.current?.abort(); onClose() }
  const dialogRef = useModalAccessibility(isOpen, close)
  useEffect(() => () => abortRef.current?.abort(), [draftKey, isOpen])
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  useEffect(() => {
    if (!isOpen) { abortRef.current?.abort(); return }
    setStep("form"); setAIConsent(false); setError(null); setDraftError(false); setIsGenerating(false); setGeneratedGuide(null); setSuggestions(null); setSpiritualityEnabled(false); setPreset("gentle")
    try {
      const parsed: unknown = JSON.parse(draftStorage()?.getItem(draftKey) || "null")
      const restored = { ...INITIAL_DRAFT }
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const record = parsed as Record<string, unknown>
        for (const key of Object.keys(INITIAL_DRAFT) as (keyof GuideDraftData)[]) if (key !== "intensity" && typeof record[key] === "string") restored[key] = (record[key] as string).slice(0, key === "name" ? 100 : 1200)
        if (record.intensity === "muito leve" || record.intensity === "leve" || record.intensity === "moderada") restored.intensity = record.intensity
      }
      setDraft(restored)
    } catch { setDraft({ ...INITIAL_DRAFT }); setDraftError(true) }
    if (demo.enabled) { setAvailable(false); return }
    const controller = new AbortController(); setAvailable(null)
    const statusUrl = apiUrl("/api/ai-status")
    if (!statusUrl) setAvailable(false)
    else fetch(statusUrl, { signal: controller.signal }).then((response) => response.ok ? response.json() : null).then((result) => { if (!controller.signal.aborted) setAvailable(result?.available === true) }).catch(() => { if (!controller.signal.aborted) setAvailable(false) })
    return () => controller.abort()
  }, [isOpen, draftKey, demo.enabled, demo.demoStorage])

  const persistDraft = (next: GuideDraftData) => { try { draftStorage()?.setItem(draftKey, JSON.stringify(next)); setDraftError(false) } catch { setDraftError(true) } }
  const updateField = (field: keyof GuideDraftData, value: string) => { const next = { ...draft, [field]: value }; setDraft(next); persistDraft(next); setError(null); setAIConsent(false) }
  const previewLocal = () => {
    setGeneratedGuide(buildPresetGuide(preset, locale, { name: draft.name.trim(), goal: draft.focus.trim(), routine: draft.routineSchedule, thingsToAvoid: draft.thingsToAvoid, whatHelps: draft.whatHelps, additionalNotes: draft.additionalNotes }))
    setGuideSource("preset"); setError(null); setStep("preview")
  }
  const share = (purpose: "assist" | "plan") => { setAIPurpose(purpose); setAIConsent(false); setError(null); setStep("share") }
  const generate = async () => {
    if (!aiConsent || isGenerating || demo.enabled) return
    setIsGenerating(true); setError(null)
    const controller = new AbortController(); abortRef.current = controller
    try {
      const url = apiUrl("/api/generate-guide")
      if (!url) throw new Error(copy("A IA está indisponível. Você pode usar os modelos prontos.", "AI is unavailable. You can use a ready-made week."))
      const token = await getAuthToken()
      if (!token) throw new Error(copy("Entre em uma conta verificada para usar a IA.", "Sign in with a verified account to use AI."))
      if (controller.signal.aborted) return
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, signal: controller.signal, body: JSON.stringify({ mode: aiPurpose === "assist" ? "assist" : "generate", name: draft.name.trim() || copy("Minha Semana", "My Week"), focus: draft.focus, currentDifficulties: draft.currentDifficulties, psychologyApproaches: draft.psychologyLines, routine: draft.routineSchedule, whatHelps: draft.whatHelps, thingsToAvoid: draft.thingsToAvoid, additionalNotes: draft.additionalNotes, intensity: draft.intensity === "muito leve" ? "very_light" : draft.intensity === "moderada" ? "moderate" : "light", contentLocale: locale, theologyEnabled: spiritualityEnabled, theologyCosmovision: spiritualityEnabled ? draft.theologyCosmovision : "", bibleVersion: spiritualityEnabled ? bibleVersion : null, aiConsent: true }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || copy("Não foi possível preparar a proposta. Tente novamente.", "The proposal could not be prepared. Try again."))
      if (controller.signal.aborted) return
      if (aiPurpose === "assist") {
        const keys = ["name", "focus", "routineSchedule", "whatHelps", "thingsToAvoid", "additionalNotes"] as const
        const raw = result.draftSuggestions
        if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).some((key) => !keys.includes(key as typeof keys[number])) || !keys.every((key) => typeof raw[key] === "string" && raw[key].length <= (key === "name" ? 100 : 1200)) || !Object.values(raw).some((value) => typeof value === "string" && value.trim())) throw new Error(copy("Não foram recebidas sugestões válidas.", "No valid suggestions were received."))
        const next: Suggestions = {}
        for (const key of ["name", "focus", "routineSchedule", "whatHelps", "thingsToAvoid", "additionalNotes"] as const) if (typeof result.draftSuggestions[key] === "string") next[key] = result.draftSuggestions[key].slice(0, key === "name" ? 100 : 1200)
        setSuggestions(next); setStep("form")
      } else {
        if (!isValidGuide(result.guideTemplate)) throw new Error(copy("Não foi recebido um guia válido.", "No valid guide was received."))
        setGeneratedGuide(result.guideTemplate); setGuideSource("ai"); setStep("preview")
      }
    } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : copy("Não foi possível conectar. Tente novamente.", "Could not connect. Try again.")) }
    finally { if (!controller.signal.aborted) setIsGenerating(false); setAIConsent(false) }
  }
  const applySuggestions = () => {
    if (!suggestions) return
    const next = { ...draft, name: draft.name || suggestions.name || "", focus: draft.focus || suggestions.focus || "", routineSchedule: draft.routineSchedule || suggestions.routineSchedule || "", whatHelps: draft.whatHelps || suggestions.whatHelps || "", thingsToAvoid: draft.thingsToAvoid || suggestions.thingsToAvoid || "", additionalNotes: draft.additionalNotes || suggestions.additionalNotes || "" }
    setDraft(next); persistDraft(next); setSuggestions(null)
  }
  const save = () => {
    if (!generatedGuide || storageReadOnly) return
    const issue = validateGuideSections(generatedGuide.sections, en)
    if (issue) { setError(issue); return }
    if (!isValidGuide(generatedGuide)) { setError(copy("Não foi possível validar este guia. Revise os campos antes de salvar.", "This guide could not be validated. Review the fields before saving.")); return }
    saveAndActivateGuide(generatedGuide)
    try { draftStorage()?.removeItem(draftKey) } catch {}
    onClose()
  }
  const reset = () => { if (!window.confirm(t.createGuide.resetDraftConfirm)) return; setDraft({ ...INITIAL_DRAFT }); setPreset("gentle"); setSpiritualityEnabled(false); setAIConsent(false); setError(null); setSuggestions(null); try { draftStorage()?.removeItem(draftKey); setDraftError(false) } catch { setDraftError(true) } }
  if (!isOpen) return null
  const fields = [
    { key: "name", label: copy("Título", "Title"), value: draft.name || copy("Minha Semana", "My Week") }, { key: "focus", label: copy("Foco", "Focus"), value: draft.focus }, { key: "currentDifficulties", label: copy("Contexto", "Context"), value: draft.currentDifficulties }, { key: "routineSchedule", label: copy("Rotina", "Routine"), value: draft.routineSchedule }, { key: "whatHelps", label: copy("O Que Ajuda", "What Helps"), value: draft.whatHelps }, { key: "thingsToAvoid", label: copy("Limites", "Limits"), value: draft.thingsToAvoid }, { key: "psychologyApproaches", label: copy("Abordagens", "Preferred Approaches"), value: draft.psychologyLines }, { key: "additionalNotes", label: copy("Instruções", "Instructions"), value: draft.additionalNotes },
  ]
  const optionalFields: { field: keyof GuideDraftData; label: string; hint?: string }[] = [
    { field: "routineSchedule", label: copy("Tempo e Rotina", "Time and Routine") }, { field: "whatHelps", label: copy("O Que Costuma Ajudar?", "What Usually Helps?") }, { field: "thingsToAvoid", label: copy("O Que Evitar ou Adaptar?", "What Should Be Avoided or Adapted?") }, { field: "additionalNotes", label: copy("Suas Instruções", "Your Instructions"), hint: copy("Tom, temas, acessibilidade, formato ou qualquer preferência sua.", "Tone, themes, accessibility, format or any preference of your own.") },
  ]
  return <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="create-guide-title" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5">
    <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={close} aria-hidden="true" />
    <div className="relative flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-border bg-card shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-7"><div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="size-5" aria-hidden="true" /></span><div><p className="eyebrow text-primary">{copy("SETE DIAS, DO SEU JEITO", "SEVEN DAYS, YOUR WAY")}</p><h2 id="create-guide-title" className="mt-1 font-serif text-xl">{titleCase(step === "form" ? copy("Uma Semana Possível", "A Manageable Week") : step === "share" ? copy("Escolha o Que Compartilhar", "Choose What to Share") : copy("Sua Semana, do Seu Jeito", "Your Week, Your Way"))}</h2></div></div><button type="button" className="icon-button" onClick={close} aria-label={t.common.close}><X className="size-5" aria-hidden="true" /></button></header>
      <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
        {error && <p ref={errorRef} tabIndex={-1} role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}
        {draftError && <p role="status" className="mb-5 rounded-xl border border-border p-3 text-xs text-destructive">{copy("O rascunho não foi salvo. Mantenha esta janela aberta até terminar.", "The draft was not saved. Keep this window open until you finish.")}</p>}
        {step === "form" && <form id="guide-draft-form" onSubmit={(event) => { event.preventDefault(); previewLocal() }} className="space-y-6">
          <p className="text-sm leading-relaxed text-muted-foreground">{copy("Escolha uma semana pronta ou comece do zero. Os modelos funcionam sem IA; você pode mudar qualquer dia, seção ou campo.", "Choose a ready-made week or start from scratch. Presets work without AI; you can change any day, section or field.")}</p>
          <fieldset><legend className="mb-3 text-sm font-medium">{titleCase(copy("Como Quer Começar?", "How Would You Like to Start?"))}</legend><div className="grid gap-2 sm:grid-cols-2">{getPlannerPresets(locale).map((option) => <label key={option.id} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4", preset === option.id ? "border-primary bg-primary/5" : "border-border")}><input type="radio" name="planner-preset" checked={preset === option.id} onChange={() => setPreset(option.id)} className="mt-1 size-4 shrink-0" /><span><span className="block text-sm font-medium">{option.title}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{option.description}</span></span></label>)}</div></fieldset>
          <DraftField field="name" label={copy("Título da Semana · Opcional", "Week Title · Optional")} value={draft.name} onChange={(value) => updateField("name", value)} hint={copy("Por exemplo: Uma Semana Mais Leve. Deixe em branco para usar o título do modelo.", "For example: A Lighter Week. Leave blank to use the preset title.")} />
          <DraftField field="focus" label={copy("Um Foco Pequeno · Opcional", "One Small Focus · Optional")} value={draft.focus} onChange={(value) => updateField("focus", value)} hint={copy("Descansar melhor, voltar a estudar ou abrir espaço para uma caminhada.", "Rest a little more, return to studying or make room for a walk.")} />
          <details className="rounded-2xl border border-border p-4 sm:p-5"><summary className="cursor-pointer text-sm font-medium">{titleCase(copy("Mais Opções e Instruções · Tudo Opcional", "More Options and Instructions · All Optional"))}</summary><div className="mt-5 space-y-5">{optionalFields.map((field) => <DraftField key={field.field} {...field} value={draft[field.field]} onChange={(value) => updateField(field.field, value)} multiline />)}
            <fieldset><legend className="mb-2 text-sm font-medium">{titleCase(copy("Ritmo para as Sugestões da IA", "Pace for AI Suggestions"))}</legend><div className="flex flex-wrap gap-2">{([{ value: "muito leve", label: copy("Bem Leve", "Very Light") }, { value: "leve", label: copy("Leve", "Light") }, { value: "moderada", label: copy("Mais Estrutura", "More Structure") }] as const).map((option) => <label key={option.value} className={cn("flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm", draft.intensity === option.value ? "border-primary bg-primary/5" : "border-border")}><input type="radio" name="guide-intensity" checked={draft.intensity === option.value} onChange={() => updateField("intensity", option.value)} />{option.label}</label>)}</div></fieldset>
            <details className="rounded-xl bg-muted/30 p-4"><summary className="cursor-pointer text-sm text-muted-foreground">{titleCase(copy("Contexto Pessoal e Espiritualidade", "Personal Context and Spirituality"))}</summary><div className="mt-4 space-y-5"><DraftField field="currentDifficulties" label={copy("Contexto Que Deseja Incluir", "Context You Wish to Include")} value={draft.currentDifficulties} onChange={(value) => updateField("currentDifficulties", value)} multiline /><DraftField field="psychologyLines" label={copy("Abordagens Que Prefere", "Approaches You Prefer")} value={draft.psychologyLines} onChange={(value) => updateField("psychologyLines", value)} /><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={spiritualityEnabled} onChange={(event) => { setSpiritualityEnabled(event.target.checked); setAIConsent(false) }} className="mt-1 size-4" />{copy("Incluir minha espiritualidade nas sugestões da IA", "Include my spirituality in AI suggestions")}</label>{spiritualityEnabled && <DraftField field="theologyCosmovision" label={copy("Minha Preferência Espiritual", "My Spiritual Preference")} value={draft.theologyCosmovision} onChange={(value) => updateField("theologyCosmovision", value)} multiline />}</div></details>
            <p className="text-xs leading-relaxed text-muted-foreground">{copy("Sem IA, foco, rotina, limites e instruções viram anotações suas; não alteram automaticamente os passos. Ajuste os dias depois de salvar.", "Without AI, focus, routine, limits and instructions become your own notes; they do not automatically rewrite the steps. Adjust the days after saving.")}</p>
          </div></details>
          <div className="rounded-2xl border border-border p-4"><p className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-primary" aria-hidden="true" />{copy("Ajuda da IA · Opcional", "AI Assistance · Optional")}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{copy("Peça ideias para os campos ou um plano semanal. Você revisa antes de enviar e antes de salvar.", "Ask for ideas for the fields or a weekly plan. You review before sharing and before saving.")}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => share("assist")} disabled={available !== true} className="min-h-11 rounded-xl border border-border px-3 text-sm text-primary disabled:opacity-50">{copy("Ajudar a Preencher", "Help Fill the Fields")}</button><button type="button" onClick={() => share("plan")} disabled={available !== true} className="min-h-11 rounded-xl border border-border px-3 text-sm text-primary disabled:opacity-50">{copy("Criar Plano com IA", "Create a Plan with AI")}</button></div>{available !== true && <p role="status" className="mt-2 text-xs text-muted-foreground">{demo.enabled ? copy("A IA está desativada no demo. Todos os modelos funcionam.", "AI is off in the demo. Every preset still works.") : available === null ? copy("Verificando disponibilidade da IA…", "Checking AI availability…") : copy("A IA está indisponível. Continue com qualquer modelo pronto.", "AI is unavailable. Continue with any ready-made week.")}</p>}</div>
          {suggestions && <section aria-label={copy("Sugestões para Revisar", "Suggestions to Review")} className="rounded-2xl border border-primary/25 bg-primary/5 p-5"><h3 className="text-sm font-semibold">{titleCase(copy("Ideias da IA para Revisar", "AI Ideas to Review"))}</h3><dl className="mt-4 space-y-3">{Object.entries(suggestions).map(([key, value]) => <div key={key}><dt className="text-xs font-medium text-primary">{fields.find((field) => field.key === key)?.label || key}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{value}</dd></div>)}</dl><p className="mt-3 text-xs text-muted-foreground">{copy("As sugestões preenchem só campos vazios. Você pode editar todas.", "Suggestions fill empty fields only. You can edit every one.")}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={applySuggestions} className="primary-button">{copy("Usar nos Campos Vazios", "Use in Empty Fields")}</button><button type="button" onClick={() => setSuggestions(null)} className="min-h-11 rounded-xl px-3 text-sm text-muted-foreground hover:bg-accent">{copy("Descartar", "Dismiss")}</button></div></section>}
          <p className="text-xs text-muted-foreground">{copy("O rascunho fica neste navegador. Você decide se compartilha preferências com a IA.", "Your draft stays in this browser. You decide whether to share preferences with AI.")}</p>
        </form>}
        {step === "share" && <div className="space-y-5"><p className="text-sm text-muted-foreground">{aiPurpose === "assist" ? copy("A IA vai sugerir textos para os campos. Você escolhe quais usar.", "AI will suggest text for the fields. You decide what to use.") : copy("A IA vai propor seções e pequenos passos para sete dias.", "AI will propose sections and small steps for seven days.")}</p><dl className="space-y-4 rounded-2xl border border-border p-5">{fields.filter((field) => field.value.trim()).map((field) => <div key={field.key}><dt className="text-xs font-medium text-primary">{field.label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{field.value}</dd></div>)}<div><dt className="text-xs font-medium text-primary">{copy("Ritmo", "Pace")}</dt><dd className="mt-1 text-sm">{draft.intensity === "muito leve" ? copy("Bem Leve", "Very Light") : draft.intensity === "leve" ? copy("Leve", "Light") : copy("Mais Estrutura", "More Structure")}</dd></div>{spiritualityEnabled && <div><dt className="text-xs font-medium text-primary">{copy("Espiritualidade", "Spirituality")}</dt><dd className="mt-1 text-sm">{draft.theologyCosmovision || copy("Nenhuma preferência informada", "No preference entered")}</dd></div>}</dl><div className="rounded-2xl border border-primary/20 bg-primary/5 p-5"><p className="text-sm leading-relaxed text-muted-foreground">{copy("As preferências acima serão enviadas pelo servidor do app ao Google Gemini. Podem incluir saúde ou crenças. Evite nomes completos, contatos e relatos detalhados. As respostas podem conter erros e não substituem cuidados profissionais.", "The preferences above will be sent through the app’s server to Google Gemini. They may include health or beliefs. Avoid full names, contact details and detailed accounts. Responses can contain errors and do not replace professional care.")}</p><div className="mt-3 flex flex-wrap gap-4 text-xs"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">{copy("Privacidade Google ↗", "Google Privacy ↗")}</a><a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">{copy("Termos Gemini ↗", "Gemini Terms ↗")}</a></div><label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-primary/20 bg-card p-4"><input type="checkbox" checked={aiConsent} onChange={(event) => setAIConsent(event.target.checked)} disabled={isGenerating} className="mt-1 size-4 shrink-0" /><span className="text-sm leading-relaxed">{copy("Quero enviar essas preferências ao Google Gemini para esta proposta e entendo que a IA pode errar.", "I want to send these preferences to Google Gemini for this proposal and understand that AI can be wrong.")}</span></label></div>{isGenerating && <p role="status" aria-live="polite" className="flex items-center gap-3 text-sm"><Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />{copy("Preparando sugestões para revisar…", "Preparing suggestions for you to review…")}</p>}</div>}
        {step === "preview" && generatedGuide && <div className="space-y-5"><div className="rounded-2xl border border-primary/20 bg-primary/5 p-5"><p className="eyebrow text-primary">{guideSource === "ai" ? copy("PROPOSTA DA IA", "AI PROPOSAL") : copy("SEMANA PRONTA · SEM IA", "READY-MADE WEEK · NO AI")}</p><h3 className="mt-2 font-serif text-2xl">{titleCase(generatedGuide.title)}</h3><p className="mt-2 text-sm text-muted-foreground">{copy("Um pequeno passo por dia. Pode adaptar, pular ou descansar.", "One small step per day. You can adapt, skip or rest.")}</p></div><ol className="grid gap-2 sm:grid-cols-2">{Array.from({ length: 7 }, (_, dayIndex) => <li key={dayIndex} className="rounded-xl border border-border p-4"><p className="text-xs font-semibold text-primary">{copy("Dia", "Day")} {dayIndex + 1}</p><p className="mt-2 text-sm leading-relaxed">{generatedGuide.weeklyPlan.filter((activity) => activity.dayIndex === dayIndex).map((activity) => activity.description).join(" · ") || copy("Espaço livre. Acrescente um passo se quiser.", "Open space. Add a step if you wish.")}</p></li>)}</ol><details className="rounded-2xl border border-border p-4 sm:p-5"><summary className="cursor-pointer text-sm font-medium">{titleCase(copy("Personalizar Seções e Campos", "Customize Sections and Fields"))} · {generatedGuide.sections.length}</summary><div className="mt-5"><GuideSectionEditor sections={generatedGuide.sections} en={en} onChange={(sections) => { setGeneratedGuide({ ...generatedGuide, sections }); setError(null) }} /></div></details><p className="text-xs text-muted-foreground">{copy("Você pode editar os dias e continuar personalizando depois de salvar.", "You can edit the days and continue customizing after saving.")}</p></div>}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-7">{step === "form" ? <><button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-xs text-muted-foreground hover:bg-accent"><RotateCcw className="size-4" aria-hidden="true" />{copy("Limpar Rascunho", "Clear Draft")}</button><button type="submit" form="guide-draft-form" className="primary-button">{copy("Ver Minha Semana", "Preview My Week")}<ArrowRight className="size-4" aria-hidden="true" /></button></> : step === "share" ? <><button type="button" onClick={() => setStep("form")} disabled={isGenerating} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm hover:bg-accent"><ArrowLeft className="size-4" aria-hidden="true" />{copy("Voltar", "Back")}</button><button type="button" onClick={generate} disabled={!aiConsent || isGenerating || available !== true || demo.enabled} className="primary-button"><Sparkles className="size-4" aria-hidden="true" />{copy("Pedir Proposta à IA", "Ask AI for a Proposal")}</button></> : <><button type="button" onClick={() => setStep("form")} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm hover:bg-accent"><ArrowLeft className="size-4" aria-hidden="true" />{copy("Voltar", "Back")}</button><button type="button" onClick={save} disabled={storageReadOnly} className="primary-button"><Check className="size-4" aria-hidden="true" />{copy("Usar Esta Semana", "Use This Week")}</button></>}</footer>
    </div>
  </div>
}
