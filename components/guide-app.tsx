"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Download, Loader2, MoreHorizontal, Plus, RotateCcw, Settings, ShieldCheck, Trash2, X } from "lucide-react"
import { type GuideTemplate } from "@/lib/guide-data"
import { buildPresetGuide, getPlannerPresets } from "@/lib/planner"
import { weekPreferenceNotes } from "@/lib/week-planning"
import { useStore, type WeekInstance } from "@/lib/store"
import { formatDateRangeLocale, getTodayFormatted, getWeekDays } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { titleCase } from "@/lib/title-case"
import { SectionCard } from "@/components/section-card"
import { InteractiveScheduleBlock } from "@/components/schedule-block"
import { CreateWeekModal, DeleteWeekModal } from "@/components/week-modal"
import { EditWeekSectionsModal } from "@/components/edit-guide-sections-modal"
import { PlannerTutorial, type PlannerTourStep } from "@/components/planner-tutorial"
import { SettingsModal } from "@/components/settings-modal"
import { CompleteWeekModal } from "@/components/complete-week-modal"
import { WeekReviewCard } from "@/components/week-review-card"
import { ResourceLibrary } from "@/components/resource-library"
import { PrivacyPanel } from "@/components/privacy-panel"
import { useModalAccessibility } from "@/components/modal-accessibility"
import { AuthDialog, AuthScreen } from "@/components/auth-screen"
import { BrandMark } from "@/components/brand-mark"
import { AccountDeletionNotice } from "@/components/account-deletion"
import { useAuth } from "@/lib/auth/client"
import { useDemo } from "@/lib/demo"

export function GuideApp({ initialPreview = false, initialAuthMode = "login", previewGuide, onPersonalize }: { initialPreview?: boolean; initialAuthMode?: "login" | "register"; previewGuide?: GuideTemplate | null; onPersonalize?: () => void }) {
  const demo = useDemo()
  const { status: authStatus, user, legalAccepted, signOut, deletionResult } = useAuth()
  const fullAccess = demo.enabled || (authStatus === "authenticated" && Boolean(user?.emailVerified) && legalAccepted)
  const [previewRequested, setPreviewRequested] = useState(initialPreview)
  const [authOpen, setAuthOpen] = useState(false)
  const { ready, weeks, activeWeek: storedWeek, activeGuide: storedGuide, selectWeek, hasPrevWeek, hasNextWeek, prevWeek, nextWeek, resetActiveWeek, locale, setLocale, t, saveStatus, retrySync, storageWarning, storageReadOnly, starterIsPreview, useStarterWeek } = useStore()
  const [weeksOpen, setWeeksOpen] = useState(false)
  const [createWeekOpen, setCreateWeekOpen] = useState(false)
  const [editWeekId, setEditWeekId] = useState<string | null>(null)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [sectionsOpen, setSectionsOpen] = useState(false)
  const [weekToDelete, setWeekToDelete] = useState<WeekInstance | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<"semanas" | "programacao" | "aparencia" | "exportacao">("aparencia")
  const [moreOpen, setMoreOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const en = locale === "en-US"
  const copy = (pt: string, english: string) => en ? english : pt
  const fallbackPreview = useMemo(() => buildPresetGuide("gentle", locale), [locale])
  const activeGuide = storedGuide || previewGuide || fallbackPreview
  const activeWeek = storedWeek
  const samplePreview = starterIsPreview && !storedWeek
  const readOnly = storageReadOnly
  const weekSections = (activeWeek?.guideSnapshot?.sections ?? activeGuide.sections).map((section) => ({ ...section, blocks: section.blocks.filter((block) => block.type !== "schedule") })).filter((section) => section.blocks.length > 0)
  const weekHistory = weeks
  const weekChoices = activeWeek?.setup ? weekPreferenceNotes(activeWeek.setup, locale) : []
  const patternLabel = getPlannerPresets(locale).find((pattern) => pattern.id === activeWeek?.setup?.pattern)?.title
  const activities = activeWeek?.programacao.activities || activeGuide.weeklyPlan
  const startDate = activeWeek?.startDate || getTodayFormatted()
  const days = getWeekDays(startDate, locale)
  const dateRange = activeWeek ? formatDateRangeLocale(activeWeek.startDate, activeWeek.endDate, locale) : samplePreview ? copy("Uma prévia para os próximos sete dias", "A preview for the next seven days") : copy("Escolha como deseja começar sua próxima semana", "Choose how to start your next week")
  const tourKey = `anew-planner-tour:${demo.enabled ? "demo" : user?.uid || "preview"}:v4`
  const tourStorage = () => demo.enabled ? demo.demoStorage : localStorage
  const closeTour = () => { try { tourStorage()?.setItem(tourKey, "seen") } catch { } setTourOpen(false) }
  const moreRef = useModalAccessibility(moreOpen, () => setMoreOpen(false))
  const weeksRef = useModalAccessibility(weeksOpen, () => setWeeksOpen(false))
  const tourSteps = useMemo(() => {
    const text = (pt: string, english: string) => en ? english : pt
    const steps: PlannerTourStep[] = [{
      target: '[data-planner-tour="new-week"]', title: text("Adicionar Semana", "Add Week"),
      text: text("Escolha descanso, um começo leve ou uma semana mais ativa. A nova semana traz suas escolhas e anotações anteriores; atividades concluídas começam desmarcadas.", "Choose rest, a gentle start, or a more active week. Your previous setup and notes carry forward; completed activities start unchecked."),
    }]
    if (storageReadOnly) steps.push({
      target: '[data-planner-tour="recovery"]', title: text("Recuperação e Backups", "Recovery and Backups"),
      text: text("A edição está pausada para preservar seus registros. Abra as opções para exportar ou restaurar um backup.", "Editing is paused to preserve your records. Open the options to export or restore a backup."),
    })
    else if (samplePreview) steps.push({
      target: '[data-planner-tour="use-week"]', title: text("Usar Esta Semana", "Use This Week"),
      text: fullAccess
        ? text("Use o exemplo quando quiser começar. Você também pode escolher outro padrão em Adicionar Semana.", "Use the sample when you want to begin. You can also choose another pattern with Add Week.")
        : text("Uma conta verificada permite salvar sua própria semana. A prévia continua disponível sem criar uma conta.", "A verified account lets you save your own week. The preview stays available without creating an account."),
    })
    else if (activeWeek) steps.push({
      target: '[data-planner-tour="routine"]', title: text("Editar Esta Semana", "Edit This Week"),
      text: text("Adicione, mude ou reorganize as atividades desta semana. Outras semanas ficam como estão; cada semana tem seus próprios registros.", "Add, change, or rearrange this week's activities. Other weeks stay as they are; each week has its own records."),
    })
    if (fullAccess && !readOnly && activeWeek?.status === "active") steps.push({
      target: '[data-planner-tour="choices"]', title: text("Editar Escolhas da Semana", "Edit Week Choices"),
      text: text("Revise a expectativa e as preferências desta semana. Manter o ritmo preserva atividades e conclusões; trocar o ritmo pede confirmação antes de substituí-las. Suas anotações e as outras semanas permanecem.", "Revise this week's expectation and preferences. Keeping the pattern preserves activities and checks; changing it asks for confirmation before replacing them. Your notes and other weeks remain."),
    })
    if (fullAccess && !readOnly && activeWeek?.status === "active") steps.push({
      target: '[data-planner-tour="sections"]', title: text("Personalizar Anotações", "Customize Notes"),
      text: text("Escolha os campos que ajudam nesta semana. Todos são opcionais. A próxima semana começa com essas escolhas e uma cópia das suas anotações.", "Choose the fields that help this week. Every field is optional. The next week starts with these choices and a copy of your notes."),
    })
    else if ((activeWeek || samplePreview) && weekSections.length > 0) steps.push({
      target: '[data-planner-tour="notes"] summary', title: text("Anotações Opcionais", "Optional Notes"),
      text: text("Abra somente o que ajudar. Suas anotações pertencem a esta semana; copiar para a próxima não altera a anterior.", "Open only what helps. Your notes belong to this week; copying them to the next one does not change the previous week."),
    })
    if (fullAccess && !starterIsPreview && activeWeek) steps.push({
      target: '[data-planner-tour="history"]', title: text("Suas Semanas", "Your Weeks"),
      text: text("Abra as semanas anteriores por este botão. Você pode voltar aos registros e comparar o que coube em cada semana, sem precisar seguir um ritmo fixo.", "Open previous weeks with this button. Return to your records and see what fit each week, without following a fixed pace."),
    })
    steps.push({
      target: '[data-planner-tour="more"]', title: text("Mais", "More"),
      text: text("Recursos, privacidade, configurações e a opção de rever este passeio ficam aqui. Essas opções são extras, à sua escolha.", "Resources, privacy, settings, and the option to replay this tour are here. These extras are yours to choose."),
    })
    if (!fullAccess) steps.push({
      target: '[data-planner-tour="sign-in"]', title: text("Entrar", "Sign In"),
      text: text("Entre para salvar sua semana. A prévia é livre, e o demo usa exemplos separados da sua conta.", "Sign in to save your week. The preview is open to everyone, and the demo uses samples separate from your account."),
    })
    return steps
  }, [en, fullAccess, samplePreview, readOnly, starterIsPreview, storageReadOnly, activeWeek?.status, weekSections.length])

  useEffect(() => {
    if (demo.scenario === "returning-user") return
    if (!ready || !fullAccess && !previewRequested) return
    try { if (tourStorage()?.getItem(tourKey) !== "seen") setTourOpen(true) } catch { setTourOpen(true) }
  }, [ready, fullAccess, previewRequested, tourKey, demo.demoStorage, demo.scenario])

  const requireAccount = (action: () => void) => { if (storageReadOnly) { setSettingsTab("exportacao"); setSettingsOpen(true) } else action() }
  const openNewWeek = () => requireAccount(() => {
    setEditWeekId(null)
    setSettingsOpen(false)
    setMoreOpen(false)
    requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>('[data-planner-tour="new-week"]')?.focus({ preventScroll: true })
      setCreateWeekOpen(true)
    })
  })
  const openWeekChoices = () => requireAccount(() => {
    if (readOnly || activeWeek?.status !== "active") return
    setCreateWeekOpen(false)
    setEditWeekId(activeWeek.id)
  })
  const replayTourFromMore = () => {
    setMoreOpen(false)
    requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>('[data-planner-tour="more"]')?.focus({ preventScroll: true })
      setTourOpen(true)
    })
  }
  const openSettings = (tab: typeof settingsTab) => { setSettingsTab(storageReadOnly ? "exportacao" : tab); setSettingsOpen(true) }
  const useSample = () => requireAccount(useStarterWeek)
  const startDemo = () => demo.startDemo(previewGuide || fallbackPreview)
  const leave = () => { setMoreOpen(false); if (demo.enabled) demo.exitDemo(); else void signOut().catch(() => setAuthOpen(true)) }
  const showExtra = (kind: "resources" | "privacy") => { setMoreOpen(false); if (kind === "resources") setResourcesOpen(true); else setPrivacyOpen(true); requestAnimationFrame(() => document.getElementById(kind === "resources" ? "additional-resources" : "additional-privacy")?.scrollIntoView({ behavior: "instant", block: "start" })); requestAnimationFrame(() => document.querySelector<HTMLDetailsElement>(kind === "resources" ? "#additional-resources > summary" : "#additional-privacy > summary")?.focus({ preventScroll: true })) }
  const weekList = <div className="space-y-2">{weekHistory.map((week) => <div key={week.id} className={cn("flex items-center gap-1 rounded-xl border p-1", week.id === activeWeek?.id ? "border-primary/30 bg-primary/5" : "border-border")}><button type="button" onClick={() => { selectWeek(week.id); setWeeksOpen(false) }} aria-pressed={week.id === activeWeek?.id} className="min-w-0 flex-1 rounded-lg px-3 py-3 text-left hover:bg-accent"><span className="flex items-center gap-2 text-sm font-medium">{week.title}{week.status === "completed" && <CheckCircle2 className="size-4 text-primary" aria-label={t.common.completed} />}</span><span className="mt-1 block text-xs text-muted-foreground">{formatDateRangeLocale(week.startDate, week.endDate, locale)}</span></button>{weekHistory.length > 1 && !storageReadOnly && <button type="button" onClick={() => setWeekToDelete(week)} className="icon-button text-muted-foreground hover:text-destructive" aria-label={`${copy("Excluir", "Delete")} ${week.title}`}><Trash2 className="size-4" aria-hidden="true" /></button>}</div>)}</div>

  return (
    <div className="app-shell min-h-screen text-foreground">
      {deletionResult && (
        <div className="mx-auto max-w-3xl p-4">
          <AccountDeletionNotice />
        </div>
      )}
      <a href="#conteudo" className="skip-link">
        {copy("Pular para o conteúdo", "Skip to content")}
      </a>

      <header className="app-header sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <a
            href="#topo"
            aria-label={copy("Anew, Início", "Anew, Home")}
            className="flex shrink-0 items-center gap-2 text-primary"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BrandMark className="size-6" />
            </span>
            <span className="font-serif text-xl font-semibold">
              Anew<span className="text-gold">.</span>
            </span>
          </a>

          <nav aria-label={copy("Navegação Principal", "Main Navigation")} className="hidden items-center gap-1 sm:flex">
            <a href="#conteudo" className="nav-link">
              <CalendarDays className="size-4" aria-hidden="true" />
              {copy("Minha Semana", "My Week")}
            </a>
            <button
              type="button"
              onClick={() => (fullAccess ? setWeeksOpen(true) : setAuthOpen(true))}
              className="nav-link"
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              {copy("Minhas Semanas", "My Weeks")}
            </button>
          </nav>

          <div className="flex items-center gap-1">
            <button
              data-planner-tour="more"
              type="button"
              onClick={() => setMoreOpen(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-muted-foreground hover:bg-accent"
              aria-haspopup="dialog"
            >
              <MoreHorizontal className="size-5" aria-hidden="true" />
              <span>{copy("Mais", "More")}</span>
            </button>
            {!fullAccess && (
              <button
                data-planner-tour="sign-in"
                type="button"
                onClick={() => setAuthOpen(true)}
                className="min-h-11 rounded-xl border border-border px-3 text-xs font-medium text-primary"
              >
                {copy("Entrar", "Sign In")}
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-8">
        {storageWarning && fullAccess && <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4"><p className="text-sm">{storageWarning}</p><button data-planner-tour="recovery" type="button" onClick={() => openSettings("exportacao")} className="min-h-11 rounded-xl border border-border px-3 text-xs text-primary">{copy("Recuperação e Backups", "Recovery and Backups")}</button></div>}
        <section id="topo" aria-labelledby="welcome-title" className="scroll-mt-24 border-b border-border py-5 sm:py-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-primary">{copy("SEU PLANEJADOR DE SETE DIAS", "YOUR SEVEN-DAY PLANNER")}</p>
              <h1 id="welcome-title" className="mt-1 font-serif text-2xl sm:text-3xl leading-tight tracking-tight">
                {titleCase(copy("Sete Dias.", "Seven Days."))} <span className="italic text-primary">{copy("Pequenos Passos.", "Small Steps.")}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => openNewWeek()} className="primary-button text-xs min-h-9 px-3">
                <Plus className="size-3.5" aria-hidden="true" />
                {copy("Adicionar Semana", "Add Week")}
              </button>
              <button type="button" onClick={() => openSettings("aparencia")} className="icon-button border border-border" aria-label={copy("Configurações", "Settings")}>
                <Settings className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
        <main id="conteudo" tabIndex={-1} className="min-w-0 scroll-mt-24 space-y-6 pt-6 outline-none">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex min-w-0 max-w-full items-center gap-2">{fullAccess && !starterIsPreview && <button type="button" onClick={prevWeek} disabled={!hasPrevWeek} className="icon-button border border-border" aria-label={copy("Semana Anterior", "Previous Week")}><ChevronLeft className="size-4" aria-hidden="true" /></button>}<button type="button" onClick={() => fullAccess && !starterIsPreview ? setWeeksOpen(true) : undefined} data-planner-tour="history" disabled={samplePreview || !activeWeek} aria-haspopup={fullAccess && !starterIsPreview ? "dialog" : undefined} className="min-w-0 rounded-xl px-2 py-1 text-left"><span className="eyebrow block text-muted-foreground">{copy("SEMANA SELECIONADA", "SELECTED WEEK")}</span><h2 className="mt-1 break-words font-serif text-xl sm:text-2xl">{activeWeek?.title || (samplePreview ? copy("Semana de Exemplo", "Sample Week") : copy("Ainda Sem Semana", "No Week Yet"))}</h2><span className="mt-1 block text-xs text-muted-foreground">{dateRange}{patternLabel && <span className="mt-1 block text-primary">{patternLabel}</span>}</span></button>{fullAccess && !starterIsPreview && <button type="button" onClick={nextWeek} disabled={!hasNextWeek} className="icon-button border border-border" aria-label={copy("Próxima Semana", "Next Week")}><ChevronRight className="size-4" aria-hidden="true" /></button>}</div>{<button data-planner-tour="new-week" type="button" onClick={() => openNewWeek()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm"><Plus className="size-4" aria-hidden="true" />{copy("Adicionar Semana", "Add Week")}</button>}</div>
          {samplePreview && <section aria-label={copy("Semana de Exemplo", "Sample Week")} className="flex flex-col justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-5 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-primary">{copy("Um Pequeno Começo · Prévia", "A Small Start · Preview")}</p><p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{copy("Um passo pequeno por dia, com uma seção opcional de anotações. Nada será registrado até você usar este exemplo ou adicionar sua própria semana.", "One small step each day, with an optional notes section. Nothing is recorded until you use this sample or add your own week.")}</p></div><button data-planner-tour="use-week" type="button" onClick={useSample} className="primary-button shrink-0">{copy("Usar Esta Semana", "Use This Week")}</button></section>}
          {!samplePreview && <div role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-muted-foreground">{saveStatus === "saving" ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Check className="size-3.5 text-primary" aria-hidden="true" />}{demo.enabled ? copy("Exemplos salvos só nesta sessão", "Samples saved for this session only") : storageWarning ? copy("Verifique o armazenamento", "Check storage") : saveStatus === "saving" ? t.sync.saving : saveStatus === "error" ? <button type="button" onClick={retrySync} className="text-destructive underline">{t.sync.error} · {t.sync.retry}</button> : saveStatus === "offline" ? copy("Salvo neste dispositivo · offline", "Saved on this device · offline") : copy("Salvo neste dispositivo", "Saved on this device")}</div>}
          {activeWeek && (activeWeek.setup?.expectation || weekChoices.length > 0 || !readOnly && activeWeek.status === "active") && <section aria-label={copy("Escolhas Desta Semana", "This Week's Choices")} className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
            {!readOnly && activeWeek.status === "active" && <button data-planner-tour="choices" type="button" onClick={openWeekChoices} className="min-h-11 rounded-xl border border-border px-3 text-sm text-primary">{copy("Editar Escolhas da Semana", "Edit Week Choices")}</button>}
            {activeWeek.setup?.expectation && <div><h3 className="text-sm font-medium">{copy("O Que Você Espera Desta Semana?", "What do you expect for this week?")}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{activeWeek.setup.expectation}</p></div>}
            {weekChoices.length > 0 && <details className={activeWeek.setup?.expectation ? "border-t border-border pt-4" : ""}><summary className="cursor-pointer text-sm text-primary">{copy("Rever Minhas Escolhas · Opcional", "Review My Choices · Optional")}</summary><dl className="mt-4 space-y-3">{weekChoices.map((choice) => <div key={choice.label}><dt className="text-xs font-medium">{choice.label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{choice.text}</dd></div>)}</dl></details>}
          </section>}
          {!activeWeek && !samplePreview && <section className="rounded-2xl border border-dashed border-border p-5"><h3 className="font-serif text-xl">{copy("Ainda Sem Semanas", "No Weeks Yet")}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy("Adicionar Semana oferece opções do descanso a um ritmo mais ativo. Escolha o que cabe agora; você pode mudar depois.", "Add Week offers options from rest to a more active pace. Choose what fits now; you can change it later.")}</p></section>}
          {(activeWeek || samplePreview) && <><section aria-labelledby="seven-days-title" className="rounded-2xl border border-border bg-card p-4 sm:p-6"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h3 id="seven-days-title" className="font-serif text-xl">{titleCase(copy("Seus Sete Dias", "Your Seven Days"))}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy("Pode mudar, pular ou descansar. Ajustes aqui valem só para esta semana; as anteriores permanecem como estão.", "You can change, skip or rest. Adjustments here apply only to this week; previous weeks stay as they are.")}</p></div>{!readOnly && activeWeek && <button data-planner-tour="routine" type="button" onClick={() => openSettings("programacao")} className="min-h-11 rounded-xl px-3 text-xs text-primary hover:bg-accent">{copy("Editar Esta Semana", "Edit This Week")}</button>}</div>
            {!readOnly ? <InteractiveScheduleBlock /> : <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{days.map((day) => <li key={day.dayIndex} className="rounded-xl border border-border bg-background/30 p-4"><p className="text-xs font-semibold text-primary">{day.dayNumberLabel}</p><p className="mt-1 text-xs text-muted-foreground">{day.formattedShort}</p><ul className="mt-3 space-y-3">{activities.filter((activity) => activity.dayIndex === day.dayIndex).map((activity) => <li key={activity.id} className="text-sm leading-relaxed">{activity.description}</li>)}</ul>{!activities.some((activity) => activity.dayIndex === day.dayIndex) && <p className="mt-3 text-sm text-muted-foreground">{copy("Espaço para o que você escolher.", "Room for whatever you choose.")}</p>}</li>)}</ol>}
          </section>
            <section aria-labelledby="optional-notes-title" className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 id="optional-notes-title" className="font-serif text-xl">{titleCase(copy("Um Espaço Opcional para Você", "Optional Room for You"))}</h3><p className="mt-1 text-xs text-muted-foreground">{copy("As anotações podem seguir como cópias para a próxima semana. Editar aqui não muda semanas anteriores; todos os campos são opcionais.", "Notes can carry forward as independent copies. Editing here leaves earlier weeks unchanged; every field is optional.")}</p></div>{fullAccess && !readOnly && activeWeek?.status === "active" && <button data-planner-tour="sections" type="button" onClick={() => setSectionsOpen(true)} className="min-h-11 rounded-xl border border-border px-3 text-xs text-primary">{copy("Personalizar Anotações", "Customize Notes")}</button>}</div><fieldset data-planner-tour="notes" disabled={readOnly} className="space-y-4" aria-label={copy("Seções Opcionais", "Optional Sections")}>{weekSections.map((section) => <SectionCard key={section.id} section={section} preview={readOnly} collapsed />)}</fieldset>{weekSections.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">{copy("Esta semana não tem campos de anotações. Personalize as anotações quando quiser incluir um campo.", "This week has no note fields. Customize notes whenever you want to add a field.")}</p>}</section>
          </>}
          {fullAccess && !readOnly && activeWeek && <WeekReviewCard />}
          {fullAccess && !readOnly && activeWeek?.status === "active" && <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center"><div><h3 className="font-serif text-xl">{titleCase(copy("Encerrar Quando Fizer Sentido", "Close Whenever It Makes Sense"))}</h3><p className="mt-1 text-sm text-muted-foreground">{t.review.formalCompletionDesc}</p></div><button type="button" onClick={() => setCompleteOpen(true)} className="primary-button shrink-0"><CheckCircle2 className="size-4" aria-hidden="true" />{t.review.actionCloseWeek}</button></div>}
        </main>
        <details id="additional-resources" open={resourcesOpen} onToggle={(event) => setResourcesOpen(event.currentTarget.open)} className="mt-10 scroll-mt-24 border-t border-border pt-5"><summary className="cursor-pointer text-xs font-medium text-muted-foreground">{titleCase(copy("Recursos de Apoio · Opcional", "Support Resources · Optional"))}</summary><div className="mt-6"><ResourceLibrary /></div></details>
        <details id="additional-privacy" open={privacyOpen} onToggle={(event) => setPrivacyOpen(event.currentTarget.open)} className="mt-5 scroll-mt-24 border-t border-border pt-5"><summary className="cursor-pointer text-xs font-medium text-muted-foreground">{titleCase(copy("Privacidade e Suas Escolhas", "Privacy and Your Choices"))}</summary><div className="mt-6"><PrivacyPanel /></div></details>
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border py-6"><a href="#topo" className="font-serif text-xl font-semibold text-primary">Anew.</a><p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{copy("Um planejador pessoal de sete dias. Pequenos passos, no seu ritmo.", "A personal seven-day planner. Small steps, at your own pace.")}</p><button data-planner-tour="replay" type="button" onClick={() => setTourOpen(true)} className="min-h-11 rounded-xl px-3 text-xs text-primary">{copy("Guia Rápido", "Quick Tour")}</button></footer>
      </div>
      {moreOpen && <div ref={moreRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="more-title" className="fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-5"><div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMoreOpen(false)} aria-hidden="true" /><div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 id="more-title" className="font-serif text-xl">{titleCase(copy("Mais Opções", "More Options"))}</h2><button type="button" onClick={() => setMoreOpen(false)} className="icon-button" aria-label={t.common.close}><X className="size-5" aria-hidden="true" /></button></div><div className="space-y-1"><button type="button" className="sidebar-action" onClick={() => setLocale(en ? "pt-BR" : "en-US")}>{en ? "Language: English → Português" : "Idioma: Português → English"}</button><button type="button" className="sidebar-action" onClick={() => { setMoreOpen(false); fullAccess ? setWeeksOpen(true) : setAuthOpen(true) }}><CalendarDays className="size-4" aria-hidden="true" />{copy("Minhas Semanas", "My Weeks")}</button><button type="button" className="sidebar-action" onClick={replayTourFromMore}><CircleHelp className="size-4" aria-hidden="true" />{copy("Rever Guia Rápido", "Replay Quick Tour")}</button><button type="button" className="sidebar-action" onClick={() => showExtra("resources")}><CircleHelp className="size-4" aria-hidden="true" />{copy("Recursos de Apoio", "Support Resources")}</button><button type="button" className="sidebar-action" onClick={() => showExtra("privacy")}><ShieldCheck className="size-4" aria-hidden="true" />{copy("Privacidade", "Privacy")}</button><button type="button" className="sidebar-action" onClick={() => { setMoreOpen(false); openSettings("aparencia") }}><Settings className="size-4" aria-hidden="true" />{copy("Configurações", "Settings")}</button>{fullAccess && <><button type="button" className="sidebar-action" onClick={() => { setMoreOpen(false); openSettings("exportacao") }}><Download className="size-4" aria-hidden="true" />{copy("Exportar e Fazer Backup", "Export and Back Up")}</button>{!readOnly && <button type="button" className="sidebar-action" onClick={() => { if (window.confirm(t.hero.resetWeekConfirm)) { resetActiveWeek(); setMoreOpen(false) } }}><RotateCcw className="size-4" aria-hidden="true" />{copy("Limpar Respostas da Semana", "Clear Week Answers")}</button>}<button type="button" className="sidebar-action" onClick={leave}>{demo.enabled ? copy("Sair do Demo", "Exit Demo") : copy("Sair da Conta", "Sign Out")}</button></>}</div></div></div>}
      {weeksOpen && <div ref={weeksRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="weeks-title" className="fixed inset-0 z-50 flex justify-end"><div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setWeeksOpen(false)} aria-hidden="true" /><div className="relative h-dvh w-full max-w-sm overflow-y-auto border-l border-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><h2 id="weeks-title" className="font-serif text-xl">{titleCase(copy("Minhas Semanas", "My Weeks"))}</h2><button type="button" onClick={() => setWeeksOpen(false)} className="icon-button" aria-label={t.common.close}><X className="size-5" aria-hidden="true" /></button></div>{weekList}</div></div>}
      <AuthDialog isOpen={authOpen} onClose={() => setAuthOpen(false)} onGuest={() => { setPreviewRequested(true); setAuthOpen(false) }} onDemo={demo.available ? startDemo : undefined} />
      <CreateWeekModal isOpen={createWeekOpen || editWeekId !== null} editWeekId={editWeekId} onClose={() => { setCreateWeekOpen(false); setEditWeekId(null) }} />
      <EditWeekSectionsModal isOpen={sectionsOpen} onClose={() => setSectionsOpen(false)} />
      <DeleteWeekModal week={weekToDelete} isOpen={Boolean(weekToDelete)} onClose={() => setWeekToDelete(null)} />
      <CompleteWeekModal isOpen={completeOpen} onClose={() => setCompleteOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} initialTab={settingsTab} onCreateWeek={openNewWeek} />
      <PlannerTutorial isOpen={tourOpen} onClose={closeTour} en={en} steps={tourSteps} />
    </div>
  )
}
