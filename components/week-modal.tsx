"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Calendar, AlertTriangle, Check, Loader2, Sparkles, X } from "lucide-react"
import { titleCase } from "@/lib/title-case"
import { calculateInclusiveEndDate, formatDateRangeLocale, getNextDayDate, getTodayFormatted } from "@/lib/date-utils"
import { useStore, type WeekInstance } from "@/lib/store"
import { getPlannerPresets } from "@/lib/planner"
import { setupFromPreviousWeek } from "@/lib/week-planning"
import { isValidWeekSetup, WEEK_SETUP_LIMITS, type WeekSetup } from "@/lib/week-setup"
import { getWeekOptions, selectedSpiritualPreference, selectedWeekPreference, type WeekOptionGroup } from "@/lib/week-options"
import { useDemo } from "@/lib/demo"
import { useAuth } from "@/lib/auth/client"
import { getAuthToken } from "@/lib/auth/firebase-client"
import { apiUrl } from "@/lib/api-url"
import { useModalAccessibility } from "@/components/modal-accessibility"
import { isValidDate } from "@/lib/backup-validation"

type CreateModalProps = { isOpen: boolean; onClose: () => void }
type SetupTextField = keyof typeof WEEK_SETUP_LIMITS
const SUGGESTION_FIELDS = ["name", "focus", "routineSchedule", "whatHelps", "thingsToAvoid", "additionalNotes"] as const
type Suggestions = Record<typeof SUGGESTION_FIELDS[number], string>
const inputClass = "w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2.5 text-base text-foreground placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"

export function CreateWeekModal({ isOpen, onClose }: CreateModalProps) {
  const { weeks, guides, activeWeek, activeGuide, createPlannedWeek, locale, t, storageReadOnly, starterIsPreview } = useStore()
  const demo = useDemo()
  const { user, status: authStatus, legalAccepted } = useAuth()
  const en = locale === "en-US"
  const copy = (pt: string, english: string) => en ? english : pt
  const prefix = useId()
  const [setup, setSetup] = useState<WeekSetup>({ pattern: "gentle", expectation: "" })
  const [startDate, setStartDate] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [aiConsent, setAIConsent] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
  const [appliedCount, setAppliedCount] = useState<number | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const optionsSummaryRef = useRef<HTMLElement>(null)
  const geminiButtonRef = useRef<HTMLButtonElement>(null)
  const shareRef = useRef<HTMLDivElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const sourceRef = useRef({ weeks, guides, activeWeek, activeGuide, starterIsPreview })
  sourceRef.current = { weeks, guides, activeWeek, activeGuide, starterIsPreview }
  const close = () => { requestRef.current?.abort(); onClose() }
  const dialogRef = useModalAccessibility(isOpen, close)
  const blocked = storageReadOnly
  const accountCanUseAI = authStatus === "authenticated" && Boolean(user?.emailVerified) && legalAccepted
  const validStart = isValidDate(startDate)
  const endDate = validStart ? calculateInclusiveEndDate(startDate) : ""
  const validDates = validStart && isValidDate(endDate)
  const noteCount = Object.values(activeWeek?.data.text ?? {}).filter((value) => value.length > 0).length
  const presets = getPlannerPresets(locale)

  useEffect(() => {
    if (!isOpen) { requestRef.current?.abort(); return }
    const source = sourceRef.current
    const owningGuide = source.guides.find((guide) => guide.id === (source.activeWeek?.guideId || source.activeWeek?.templateId)) ?? source.activeGuide
    setSetup(setupFromPreviousWeek(source.activeWeek, owningGuide))
    const latestEnd = source.weeks.map((week) => week.endDate).filter(isValidDate).sort().at(-1)
    const nextDate = source.starterIsPreview ? getTodayFormatted() : latestEnd ? getNextDayDate(latestEnd) : getTodayFormatted()
    setStartDate(isValidDate(nextDate) && isValidDate(calculateInclusiveEndDate(nextDate)) ? nextDate : getTodayFormatted())
    setError(null); setShareOpen(false); setAIConsent(false); setIsGenerating(false); setSuggestions(null); setAppliedCount(null)
    if (detailsRef.current) detailsRef.current.open = false
    if (demo.enabled) { setAvailable(false); return }
    const controller = new AbortController()
    setAvailable(null)
    const url = apiUrl("/api/ai-status")
    if (!url) setAvailable(false)
    else fetch(url, { signal: controller.signal }).then((response) => response.ok ? response.json() : null)
      .then((result) => { if (!controller.signal.aborted) setAvailable(result?.available === true) })
      .catch(() => { if (!controller.signal.aborted) setAvailable(false) })
    return () => { controller.abort(); requestRef.current?.abort() }
  }, [isOpen, activeWeek?.id, demo.enabled, starterIsPreview])
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])
  useEffect(() => { if (shareOpen) shareRef.current?.focus() }, [shareOpen])
  useEffect(() => { if (suggestions) suggestionsRef.current?.focus() }, [suggestions])
  useEffect(() => { if (appliedCount !== null) optionsSummaryRef.current?.focus() }, [appliedCount])

  const editSetup = (update: (current: WeekSetup) => WeekSetup) => {
    requestRef.current?.abort()
    setIsGenerating(false); setSuggestions(null); setAIConsent(false); setAppliedCount(null); setError(null)
    setSetup(update)
  }
  const updateField = (field: SetupTextField, value: string) => editSetup((current) => ({ ...current, [field]: value }))
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (blocked || isGenerating) return
    if (!validDates) {
      if (detailsRef.current) detailsRef.current.open = true
      setError(copy("Escolha uma data válida que comporte os sete dias.", "Choose a valid start date that allows all seven days.")); return
    }
    if (!isValidWeekSetup(setup) || !createPlannedWeek(setup, setup.name?.trim() || undefined, startDate)) {
      setError(copy("Não foi possível adicionar a semana. Verifique os campos e o armazenamento.", "Could not add the week. Check the fields and storage.")); return
    }
    close()
  }
  const askGemini = async () => {
    if (!setup.expectation.trim() || !aiConsent || isGenerating || demo.enabled || blocked || available !== true || !accountCanUseAI) return
    const controller = new AbortController()
    requestRef.current?.abort(); requestRef.current = controller
    setIsGenerating(true); setError(null); setSuggestions(null); setAppliedCount(null)
    const submittedSetup = { ...setup }
    try {
      const url = apiUrl("/api/generate-guide")
      if (!url) throw new Error(copy("Gemini está indisponível. Você pode adicionar a semana sem IA.", "Gemini is unavailable. You can add the week without AI."))
      const token = await getAuthToken()
      if (controller.signal.aborted) return
      if (!token) throw new Error(copy("Entre em uma conta verificada para usar Gemini.", "Sign in with a verified account to use Gemini."))
      const response = await fetch(url, {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mode: "assist", weekPattern: submittedSetup.pattern, name: submittedSetup.name || "", focus: submittedSetup.expectation,
          routineSchedule: submittedSetup.routine || "", whatHelps: submittedSetup.whatHelps || "",
          thingsToAvoid: submittedSetup.thingsToAvoid || "", additionalNotes: submittedSetup.additionalNotes || "",
          currentDifficulties: selectedProfile.currentDifficulties, priorityAreas: selectedProfile.priorityAreas,
          psychologyApproaches: selectedProfile.psychologyApproaches,
          intensity: submittedSetup.intensity || "very_light", contentLocale: locale,
          theologyEnabled: submittedSetup.spirituality === true, theologyCosmovision: selectedProfile.theologyCosmovision,
          bibleVersion: null, aiConsent: true,
        }),
      })
      const result = await response.json()
      if (controller.signal.aborted) return
      if (!response.ok) throw new Error(result.error || copy("Não foi possível preparar sugestões. Tente novamente.", "Could not prepare suggestions. Try again."))
      const raw: unknown = result.draftSuggestions
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error(copy("Nenhuma sugestão válida foi recebida.", "No valid suggestions were received."))
      const values = raw as Record<string, unknown>
      if (Object.keys(values).length !== SUGGESTION_FIELDS.length || Object.keys(values).some((key) => !SUGGESTION_FIELDS.includes(key as typeof SUGGESTION_FIELDS[number])) || !SUGGESTION_FIELDS.every((key) => typeof values[key] === "string" && (values[key] as string).length <= (key === "name" ? 100 : 1200)) || !Object.values(values).some((value) => typeof value === "string" && value.trim())) throw new Error(copy("Nenhuma sugestão válida foi recebida.", "No valid suggestions were received."))
      setSuggestions(values as Suggestions); setShareOpen(false)
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : copy("Não foi possível conectar. Tente novamente.", "Could not connect. Try again."))
    } finally {
      if (!controller.signal.aborted) { setIsGenerating(false); setAIConsent(false) }
    }
  }
  const applySuggestions = () => {
    if (!suggestions) return
    const mapping = { name: "name", focus: "expectation", routineSchedule: "routine", whatHelps: "whatHelps", thingsToAvoid: "thingsToAvoid", additionalNotes: "additionalNotes" } as const
    const next = { ...setup }
    let count = 0
    for (const field of SUGGESTION_FIELDS) {
      const target = mapping[field]
      if (!next[target]?.trim() && suggestions[field].trim()) { next[target] = suggestions[field]; count++ }
    }
    setSetup(next); setSuggestions(null); setAppliedCount(count); setAIConsent(false)
    if (count && detailsRef.current) detailsRef.current.open = true
  }
  const optionalFields: { key: "routine" | "whatHelps" | "thingsToAvoid" | "additionalNotes"; label: string; placeholder: string }[] = [
    { key: "routine", label: copy("Tempo e Rotina", "Time and Routine"), placeholder: copy("Ex.: Tenho dez minutos livres depois do café.", "e.g. I have ten free minutes after breakfast.") },
    { key: "whatHelps", label: copy("O Que Ajuda", "What Helps"), placeholder: copy("Ex.: Uma lista curta e uma pausa tranquila.", "e.g. A short list and a quiet break.") },
    { key: "thingsToAvoid", label: copy("O Que Evitar ou Adaptar", "What to Avoid or Adapt"), placeholder: copy("Ex.: Evite tarefas de manhã cedo; prefiro atividades sentadas.", "e.g. Avoid early mornings; I prefer seated activities.") },
    { key: "additionalNotes", label: copy("Outras Preferências", "Other Preferences"), placeholder: copy("Ex.: Deixe sábado livre e use instruções breves.", "e.g. Leave Saturday open and use brief instructions.") },
  ]
  const selectedProfile = {
    currentDifficulties: selectedWeekPreference("burdens", setup.burdens, setup.burdensOther, locale),
    priorityAreas: selectedWeekPreference("discipline", setup.discipline, setup.disciplineOther, locale),
    psychologyApproaches: selectedWeekPreference("psychology", setup.psychology, setup.psychologyOther, locale),
    theologyCosmovision: selectedSpiritualPreference(setup.spirituality, setup.theology, setup.theologyOther, locale),
  }
  const preferenceGroups: { group: WeekOptionGroup; label: string; placeholder: string }[] = [
    { group: "burdens", label: copy("O Que Pesa no Dia a Dia", "Everyday Burdens"), placeholder: copy("Ex.: Estou lidando com muitas responsabilidades em casa.", "e.g. I am juggling many responsibilities at home.") },
    { group: "discipline", label: copy("Hábitos e Disciplina", "Habits and Discipline"), placeholder: copy("Ex.: Quero reservar um tempo curto para cuidar das plantas.", "e.g. I want a short time to care for my plants.") },
    { group: "psychology", label: copy("Preferência de Psicologia", "Psychology Preference"), placeholder: copy("Ex.: Prefiro uma abordagem baseada em autocompaixão.", "e.g. I prefer an approach based on self-compassion.") },
    { group: "theology", label: copy("Preferência de Teologia ou Espiritualidade", "Theology or Spirituality Preference"), placeholder: copy("Ex.: Prefiro reflexões da minha tradição, sem citações.", "e.g. I prefer reflections from my tradition, without quotations.") },
  ]
  const preferenceChoices = (group: WeekOptionGroup, label: string, placeholder: string) => {
    const multiple = group === "burdens" || group === "discipline"
    const selection = setup[group]
    const selected = Array.isArray(selection) ? selection : [selection || "none"]
    const otherField = `${group}Other` as "burdensOther" | "disciplineOther" | "psychologyOther" | "theologyOther"
    return <fieldset key={group} className="min-w-0 space-y-3">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">{getWeekOptions(group, locale).map((option) => <label key={option.id} className={`flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs ${selected.includes(option.id) ? "border-primary bg-primary/5" : "border-border"}`}>
        <input type={multiple ? "checkbox" : "radio"} name={`${prefix}-${group}`} checked={selected.includes(option.id)} onChange={(event) => {
          const checked = event.target.checked
          editSetup((current) => {
            if (group === "burdens" || group === "discipline") {
              const values = current[group] || []
              return { ...current, [group]: checked ? [...values.filter((value) => value !== option.id), option.id] : values.filter((value) => value !== option.id) }
            }
            return { ...current, [group]: option.id }
          })
        }} className="shrink-0 accent-primary" /><span className="min-w-0 break-words">{option.label}</span>
      </label>)}</div>
      {selected.includes("other") && <div><label htmlFor={`${prefix}-${otherField}`} className="mb-2 block text-sm font-medium">{copy("Outro:", "Other:")}</label><input id={`${prefix}-${otherField}`} value={setup[otherField] || ""} maxLength={1200} onChange={(event) => updateField(otherField, event.target.value)} placeholder={placeholder} className={inputClass} /></div>}
    </fieldset>
  }
  const sharedFields = [
    { label: copy("Ritmo da Semana", "Week Pattern"), value: presets.find((preset) => preset.id === setup.pattern)?.title },
    { label: copy("Nome da Semana", "Week Name"), value: setup.name },
    { label: copy("Expectativa", "Expectation"), value: setup.expectation },
    ...optionalFields.map((field) => ({ label: field.label, value: setup[field.key] })),
    { label: preferenceGroups[0].label, value: selectedProfile.currentDifficulties },
    { label: preferenceGroups[1].label, value: selectedProfile.priorityAreas },
    { label: preferenceGroups[2].label, value: selectedProfile.psychologyApproaches },
    { label: preferenceGroups[3].label, value: selectedProfile.theologyCosmovision },
  ].filter((field) => field.value?.trim())

  if (!isOpen) return null
  return <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={`${prefix}-title`} className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-5">
    <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={close} aria-hidden="true" />
    <div className="relative flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl">
      <header className="flex items-center justify-between gap-3 border-b border-border p-5"><div className="flex items-center gap-3"><Calendar className="size-5 text-primary" aria-hidden="true" /><h2 id={`${prefix}-title`} className="font-serif text-xl">{copy("Adicionar Semana", "Add Week")}</h2></div><button type="button" onClick={close} className="icon-button" aria-label={t.common.close}><X className="size-5" aria-hidden="true" /></button></header>
      <form id={`${prefix}-form`} onSubmit={submit} noValidate className="min-h-0 overflow-y-auto p-5 sm:p-6">
        <div className="space-y-5">
          {error && <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          {blocked && <p role="status" className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">{copy("Recupere o armazenamento antes de adicionar uma semana.", "Recover storage before adding a week.")}</p>}
          <fieldset disabled={blocked || isGenerating} className="min-w-0 space-y-5">
            <div><label htmlFor={`${prefix}-expectation`} className="mb-2 block text-sm font-medium">{copy("O que você espera para esta semana?", "What do you expect for this week?")}</label><textarea id={`${prefix}-expectation`} rows={2} maxLength={WEEK_SETUP_LIMITS.expectation} value={setup.expectation} onChange={(event) => updateField("expectation", event.target.value)} placeholder={copy("Descansar mais e abrir um pequeno espaço para leitura.", "Rest more and make a little room for reading.")} className={inputClass} /><p className="mt-1 text-xs text-muted-foreground">{copy("Opcional. Você pode começar apenas escolhendo um ritmo.", "Optional. You can start by choosing a pattern.")}</p></div>
            <fieldset className="min-w-0"><legend className="mb-2 text-sm font-medium">{copy("Escolha o Ritmo da Semana", "Choose a Week Pattern")}</legend><div className="grid grid-cols-2 gap-2">{presets.map((preset) => <label key={preset.id} className={`flex min-w-0 cursor-pointer gap-2 rounded-xl border p-3 ${setup.pattern === preset.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"}`}><input type="radio" name={`${prefix}-pattern`} value={preset.id} checked={setup.pattern === preset.id} onChange={() => editSetup((current) => ({ ...current, pattern: preset.id }))} className="mt-0.5 shrink-0 accent-primary" /><span className="min-w-0"><span className="block break-words text-sm font-medium">{preset.title}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{preset.description}</span></span></label>)}</div><p className="mt-2 text-xs text-muted-foreground">{copy("Nada aumenta automaticamente. Descanso e uma semana vazia são escolhas válidas.", "Nothing increases automatically. Rest and a blank week are available choices.")}</p></fieldset>
            <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer text-sm font-medium">{copy("Personalizar Esta Semana · Opcional", "Personalize This Week · Optional")}</summary><div className="mt-4 space-y-5">
              <p className="text-xs text-muted-foreground">{copy("Escolha somente as preferências que deseja incluir.", "Choose only the preferences you want to include.")}</p>
              {preferenceGroups.filter((item) => item.group !== "theology").map((item) => preferenceChoices(item.group, item.label, item.placeholder))}
              <div className="space-y-4"><label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={setup.spirituality === true} onChange={(event) => { const checked = event.target.checked; editSetup((current) => ({ ...current, spirituality: checked })) }} className="accent-primary" />{copy("Incluir Espiritualidade", "Include Spirituality")}</label>
                {setup.spirituality && preferenceChoices("theology", preferenceGroups[3].label, preferenceGroups[3].placeholder)}
              </div>
            </div></details>
            <details ref={detailsRef} className="rounded-xl border border-border p-4"><summary ref={optionsSummaryRef} className="cursor-pointer text-sm font-medium">{copy("Mais Opções · Opcional", "More Options · Optional")}</summary><div className="mt-4 space-y-4">
              <div><label htmlFor={`${prefix}-name`} className="mb-2 block text-sm font-medium">{copy("Nome da Semana · Opcional", "Week Name · Optional")}</label><input id={`${prefix}-name`} maxLength={WEEK_SETUP_LIMITS.name} value={setup.name || ""} onChange={(event) => updateField("name", event.target.value)} placeholder={copy("Ex.: Uma Semana Com Mais Espaço", "e.g. A Week With More Room")} className={inputClass} /></div>
              <div><label htmlFor={`${prefix}-date`} className="mb-2 block text-sm font-medium">{t.week.startDateLabel}</label><input id={`${prefix}-date`} type="date" required min="0100-01-01" max="9999-12-25" value={startDate} onChange={(event) => { setStartDate(event.target.value); setError(null) }} className={inputClass} />{validDates && <p className="mt-1 text-xs text-muted-foreground">{formatDateRangeLocale(startDate, endDate, locale)}</p>}</div>
              <fieldset><legend className="mb-2 text-sm font-medium">{copy("Tamanho dos Passos · Opcional", "Step Size · Optional")}</legend><div className="flex flex-wrap gap-2">{([
                ["very_light", copy("Mais Leve", "Lighter")], ["light", copy("Leve", "Light")], ["moderate", copy("Mais Ativo", "More Active")],
              ] as const).map(([value, label]) => <label key={value} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm"><input type="radio" name={`${prefix}-intensity`} checked={(setup.intensity || "very_light") === value} onChange={() => editSetup((current) => ({ ...current, intensity: value }))} className="accent-primary" />{label}</label>)}</div><p className="mt-1 text-xs text-muted-foreground">{copy("Aplica-se às sugestões que usam uma duração. Você pode editar todas as atividades depois.", "Applies to suggestions that use a duration. You can edit every activity afterward.")}</p></fieldset>
              {optionalFields.map((field) => <div key={field.key}><label htmlFor={`${prefix}-${field.key}`} className="mb-2 block text-sm font-medium">{field.label} · {copy("Opcional", "Optional")}</label><textarea id={`${prefix}-${field.key}`} rows={2} maxLength={WEEK_SETUP_LIMITS[field.key]} value={setup[field.key] || ""} onChange={(event) => updateField(field.key, event.target.value)} placeholder={field.placeholder} className={inputClass} /></div>)}
            </div></details>
          </fieldset>
          {activeWeek && <p className="text-xs leading-relaxed text-muted-foreground">{copy(`Suas escolhas e ${noteCount} valores de anotações salvas são copiados da semana atual. Manter o ritmo preserva suas atividades; outro ritmo troca as sugestões. As caixas de conclusão começam desmarcadas.`, `Your choices and ${noteCount} saved note values carry forward from the current week. Keeping its pattern preserves your activities; another pattern changes the suggestions. Completion boxes start unchecked.`)}</p>}
          <div className="space-y-3 border-t border-border pt-4">
            <button ref={geminiButtonRef} type="button" onClick={() => { setShareOpen((value) => !value); setAIConsent(false); setError(null) }} disabled={!setup.expectation.trim() || demo.enabled || blocked || isGenerating || available !== true || !accountCanUseAI} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm text-primary disabled:opacity-50"><Sparkles className="size-4" aria-hidden="true" />{copy("Sugestões Com Gemini · Opcional", "Gemini Suggestions · Optional")}</button>
            <p className="text-xs text-muted-foreground">{demo.enabled ? copy("Gemini fica desativado no demo. Os ritmos funcionam sem IA.", "Gemini is disabled in the demo. Week patterns work without AI.") : !accountCanUseAI ? copy("Gemini requer uma conta verificada. Você pode adicionar a semana sem IA.", "Gemini requires a verified account. You can add the week without AI.") : available === false ? copy("Gemini está indisponível. Os ritmos continuam disponíveis offline.", "Gemini is unavailable. Week patterns remain available offline.") : available === null ? copy("Verificando a disponibilidade do Gemini…", "Checking Gemini availability…") : !setup.expectation.trim() ? copy("Escreva uma expectativa para pedir sugestões.", "Enter an expectation to ask for suggestions.") : copy("Você revisa o que será enviado e escolhe se deseja aplicar as sugestões.", "Review what will be sent and choose whether to apply the suggestions.")}</p>
            {shareOpen && <div ref={shareRef} tabIndex={-1} className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><h3 className="text-sm font-medium">{copy("Revisar o Que Será Enviado", "Review What Will Be Sent")}</h3><dl className="space-y-2 text-xs">{sharedFields.map((field) => <div key={field.label}><dt className="font-medium">{field.label}</dt><dd className="mt-0.5 whitespace-pre-wrap break-words text-muted-foreground">{field.value}</dd></div>)}<div><dt className="font-medium">{copy("Tamanho dos Passos e Idioma", "Step Size and Language")}</dt><dd className="text-muted-foreground">{setup.intensity === "moderate" ? copy("Mais Ativo", "More Active") : setup.intensity === "light" ? copy("Leve", "Light") : copy("Mais Leve", "Lighter")} · {en ? "English" : "Português"}</dd></div></dl><p className="text-xs text-muted-foreground">{copy("Somente os campos acima vão para Gemini. Suas anotações diárias não são enviadas.", "Only the fields above are sent to Gemini. Your daily notes are excluded.")}</p><label className="flex items-start gap-2 text-xs leading-relaxed"><input type="checkbox" checked={aiConsent} disabled={isGenerating} onChange={(event) => setAIConsent(event.target.checked)} className="mt-0.5" />{copy("Concordo em enviar estes campos para receber sugestões opcionais.", "I agree to send these fields for optional suggestions.")}</label><button type="button" onClick={askGemini} disabled={!aiConsent || isGenerating || blocked} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">{isGenerating ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}{isGenerating ? copy("Preparando…", "Preparing…") : copy("Pedir Sugestões", "Ask for Suggestions")}</button></div>}
            {suggestions && <div ref={suggestionsRef} tabIndex={-1} className="space-y-3 rounded-xl border border-primary/20 p-4"><h3 className="text-sm font-medium">{copy("Revisar Sugestões", "Review Suggestions")}</h3><dl className="space-y-3 text-sm">{SUGGESTION_FIELDS.map((key) => <div key={key}><dt className="text-xs font-medium text-muted-foreground">{key === "name" ? copy("Nome da Semana", "Week Name") : key === "focus" ? copy("Expectativa", "Expectation") : key === "routineSchedule" ? copy("Tempo e Rotina", "Time and Routine") : optionalFields.find((field) => field.key === key)?.label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{suggestions[key] || copy("Sem sugestão.", "No suggestion.")}</dd></div>)}</dl><p className="text-xs text-muted-foreground">{copy("Aplicar preenche somente campos vazios. O que você já escreveu é preservado; a semana ainda não é salva.", "Apply fills only empty fields. What you already wrote is preserved; the week is still unsaved.")}</p><div className="flex flex-wrap gap-2"><button type="button" onClick={applySuggestions} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-3 text-sm text-primary-foreground"><Check className="size-4" aria-hidden="true" />{copy("Aplicar Sugestões", "Apply Suggestions")}</button><button type="button" onClick={() => { setSuggestions(null); geminiButtonRef.current?.focus() }} className="min-h-11 rounded-xl border border-border px-3 text-sm">{copy("Descartar", "Dismiss")}</button></div></div>}
            {appliedCount !== null && <p role="status" className="text-xs text-muted-foreground">{copy(`${appliedCount} campos vazios preenchidos. Revise em Mais Opções antes de adicionar a semana.`, `${appliedCount} empty fields filled. Review More Options before adding the week.`)}</p>}
          </div>
        </div>
      </form>
      <footer className="flex shrink-0 justify-end gap-2 border-t border-border p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}><button type="button" onClick={close} className="min-h-11 rounded-xl border border-border px-4 text-sm">{t.common.cancel}</button><button type="submit" form={`${prefix}-form`} disabled={blocked || isGenerating} className="primary-button disabled:opacity-50"><Calendar className="size-4" aria-hidden="true" />{copy("Adicionar Semana", "Add Week")}</button></footer>
    </div>
  </div>
}

type DeleteModalProps = {
  week: WeekInstance | null
  isOpen: boolean
  onClose: () => void
}

export function DeleteWeekModal({ week, isOpen, onClose }: DeleteModalProps) {
  const { deleteWeek, locale, t } = useStore()
  const dialogRef = useModalAccessibility(isOpen, onClose)

  if (!isOpen || !week) return null

  const rangeFormatted = formatDateRangeLocale(week.startDate, week.endDate, locale)

  const handleDelete = () => {
    deleteWeek(week.id)
    onClose()
  }

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-week-title"
    >
      <div
        className="fixed inset-0 bg-foreground/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xl"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 1.25rem))" }}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h3 id="delete-week-title" className="font-serif text-lg font-semibold text-foreground">
              {titleCase(t.week.deleteTitle)}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.week.deletePromptPrefix}{" "}
              <strong className="text-foreground">{week.title}</strong> ({rangeFormatted}).
            </p>
            <p className="mt-2 text-xs text-destructive font-medium">
              {t.week.deleteDesc}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition touch-manipulation"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground shadow-xs hover:bg-destructive/90 transition touch-manipulation"
          >
            {t.week.deleteConfirm}
          </button>
        </div>
      </div>
    </div>
  )
}
