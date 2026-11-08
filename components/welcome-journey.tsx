"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Check, HeartHandshake, Leaf, MoveUpRight, NotebookPen, Sprout, Sun, Wind, Clock3, Compass, LayoutList, Sunrise, Footprints } from "lucide-react"
import { ONBOARDING_QUOTES } from "@/lib/onboarding-quotes"
import { QUESTIONS, buildPersonalizedGuide, hasOnboardingAnswers, getOnboardingSummary, type OnboardingAnswers } from "@/lib/onboarding"
import { createStarterGuide } from "@/lib/planner"
import { titleCase } from "@/lib/title-case"
import { isNativeApp, openExternalUrl } from "@/lib/platform"
import { BrandMark } from "@/components/brand-mark"
import styles from "./welcome-journey.module.css"

const STEP_ICONS = [Sprout, Wind, Sun, HeartHandshake, Compass, Clock3, NotebookPen, Sunrise, LayoutList, Footprints, Leaf]

const PT_QUESTIONS: Record<string, { eyebrow: string; title: string; description: string; choices: Record<string, { title: string; detail: string }> }> = {
  intention: {
    eyebrow: "Um espaço para começar",
    title: "O que te traz aqui hoje?",
    description: "Não existe resposta certa. Observe o que seria mais útil ou apenas explore sem compromisso.",
    choices: {
      space: { title: "Mais espaço para respirar", detail: "Criar momentos para pausar e observar." },
      routine: { title: "Uma rotina mais constante", detail: "Pequenos passos que cabem na vida real." },
      meaning: { title: "Tempo para o que importa", detail: "Reconectar com o que faz sentido cuidar." },
      explore: { title: "Estou apenas explorando", detail: "Conhecer sem precisar decidir nada agora." },
    },
  },
  pace: {
    eyebrow: "Seu ritmo pertence a você",
    title: "Qual ritmo faz mais sentido para você?",
    description: "Sua energia e circunstâncias mudam. Um começo pequeno é muito bem-vindo aqui.",
    choices: {
      small: { title: "Um pequeno passo de cada vez", detail: "Manter as coisas leves e viáveis." },
      structure: { title: "Uma estrutura suave", detail: "Algumas ideias de apoio para me guiar." },
      flexible: { title: "Decidir dia a dia", detail: "Espaço para adaptar, pular ou descansar." },
    },
  },
  activity: {
    eyebrow: "Muitas formas de cuidar",
    title: "O que parece mais convidativo agora?",
    description: "São possibilidades cotidianas, não prescrições. Escolha apenas o que parecer confortável.",
    choices: {
      pause: { title: "Pausar e observar", detail: "Um momento calmo para checar como estou." },
      write: { title: "Escrever um pouco", detail: "Abrir espaço para um pensamento ou sentimento." },
      move: { title: "Mover-se suavemente", detail: "Um alongamento, caminhada ou movimento leve." },
      mix: { title: "Experimentar coisas diferentes", detail: "Testar e manter o que funcionar para mim." },
    },
  },
  support: {
    eyebrow: "O apoio pode vir de várias formas",
    title: "Como prefere fazer essa caminhada?",
    description: "O guia é um recurso entre vários. Você decide o tipo de apoio que faz sentido.",
    choices: {
      own: { title: "No meu próprio tempo", detail: "Um momento reservado para minhas reflexões." },
      trusted: { title: "Ao lado de alguém de confiança", detail: "Espaço para conversa e conexão." },
      professional: { title: "Com apoio profissional", detail: "Como complemento ao cuidado profissional qualificado." },
      undecided: { title: "Ainda estou avaliando", detail: "Sem necessidade de definir isso agora." },
    },
  },
  focus: {
    eyebrow: "Um lugar para dar atenção",
    title: "No que você gostaria de focar?",
    description: "Isso seleciona tópicos cotidianos, sem qualquer diagnóstico ou julgamento.",
    choices: {
      stress: { title: "Alívio em dias cheios", detail: "Identificar sobrecargas e colocar limites suaves." },
      rest: { title: "Descanso e autocuidado básico", detail: "Espaço para acolhimento e recomposição." },
      connection: { title: "Conexões com equilíbrio", detail: "Cultivar relações com limites saudáveis." },
      change: { title: "Navegar por uma transição", detail: "Dar passos possíveis em meio a mudanças." },
    },
  },
  time: {
    eyebrow: "Pouco tempo já é suficiente",
    title: "Quanto tempo por dia você tem disponível?",
    description: "Uma estimativa é suficiente. Você pode encurtar, pular ou mudar depois.",
    choices: {
      "5": { title: "Até 5 minutos", detail: "Micro-passos rápidos e sem peso." },
      "15": { title: "Cerca de 15 minutos", detail: "Um intervalo consciente no dia." },
      "30": { title: "30 minutos ou mais", detail: "Um bloco mais dedicado de dedicação." },
      variable: { title: "Varia a cada dia", detail: "Adaptável conforme minha energia." },
    },
  },
  anchor: {
    eyebrow: "Um momento do seu dia",
    title: "Em que momento prefere se dedicar?",
    description: "Ligar a prática a um momento do dia ajuda a torná-la natural.",
    choices: {
      morning: { title: "Pela manhã", detail: "Começar o dia com intenção e clareza." },
      afternoon: { title: "Durante a tarde", detail: "Uma pausa revigorante no meio do dia." },
      evening: { title: "À noite", detail: "Desacelerar e encerrar o dia com calma." },
      anytime: { title: "No momento que for possível", detail: "Sem horário fixo, conforme o fluxo do dia." },
    },
  },
  notes: {
    eyebrow: "Registros simples",
    title: "Como prefere registrar seus passos?",
    description: "Escolha como quer acompanhar sua semana.",
    choices: {
      check: { title: "Apenas marcar como feito", detail: "Simples, direto e sem anotações longas." },
      brief: { title: "Pequenas notas ou palavras-chave", detail: "Uma linha para registrar a sensação do dia." },
      journal: { title: "Reflexões mais detalhadas", detail: "Espaço livre para escrever como foi o dia." },
    },
  },
  spirituality: {
    eyebrow: "Reflexões opcionais",
    title: "Deseja incluir passagens ou reflexões espirituais?",
    description: "Totalmente opcional e desativado por padrão.",
    choices: {
      none: { title: "Não, prefiro foco secular", detail: "Apenas passos práticos e comportamentais." },
      gentle: { title: "Sim, versículos suaves de paz", detail: "Passagens reflexivas de encorajamento e esperança." },
      contemplative: { title: "Sim, leituras meditativas", detail: "Textos de contemplação e serenidade." },
    },
  },
  readiness: {
    eyebrow: "O ponto de partida",
    title: "Como se sente para começar esta semana?",
    description: "Respeitamos exatamente onde você está hoje.",
    choices: {
      gentle: { title: "Preciso ir com bastante calma", detail: "Começar do jeito mais leve possível." },
      ready: { title: "Pronto para tentar os pequenos passos", detail: "Disposto a seguir a sugestão de cada dia." },
      curious: { title: "Curioso para experimentar", detail: "Explorar sem autocobrança ou pressão." },
    },
  },
}

export interface WelcomeJourneyProps {
  onComplete: (answers: OnboardingAnswers) => void
  onPreview: (answers: OnboardingAnswers) => void
  onSignIn?: () => void
  testMode?: boolean
}

/** Optional preferences stay in memory; a local week can be previewed before account creation. */
export function WelcomeJourney({ onComplete, onPreview, onSignIn, testMode = false }: WelcomeJourneyProps) {
  const [step, setStep] = useState(0)
  const [personalizing, setPersonalizing] = useState(false)
  const [answers, setAnswers] = useState<OnboardingAnswers>({})
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [sourceError, setSourceError] = useState<string | null>(null)
  const [locale] = useState<"pt-BR" | "en-US">(() => {
    if (typeof window === "undefined") return "pt-BR"
    try {
      const saved = localStorage.getItem("guia-locale")
      if (saved === "en-US" || saved === "pt-BR") return saved
      if (navigator.language && !navigator.language.startsWith("pt")) return "en-US"
    } catch {}
    return "pt-BR"
  })
  const isPt = locale === "pt-BR"
  const quote = ONBOARDING_QUOTES[quoteIndex]
  const headingRef = useRef<HTMLHeadingElement>(null)
  const question = QUESTIONS[step]
  const finalStep = step === QUESTIONS.length
  const StepIcon = STEP_ICONS[step]
  const selected = question ? answers[question.id] : undefined
  const chosenStartingPoints = getOnboardingSummary(answers)
  const personalGuide = finalStep ? hasOnboardingAnswers(answers) ? buildPersonalizedGuide(answers) : createStarterGuide() : null

  useEffect(() => {
    const frame = requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(frame)
  }, [step, personalizing])

  const moveTo = (next: number) => { setStep(next); window.scrollTo({ top: 0, behavior: "auto" }) }
  const toggleChoice = (choice: string) => {
    if (!question) return
    setAnswers((previous) => ({ ...previous, [question.id]: previous[question.id] === choice ? "" : choice }))
  }

  return (
    <div className={styles.journey}>
      <header className={styles.header}>
        <div className={styles.brand} aria-label="Anew"><span className={styles.brandMark}><BrandMark className="size-5" /></span><span>Anew<span className={styles.brandDot}>.</span></span></div>
      </header>

      <main className={styles.layout}>
        <aside className={styles.artPanel} aria-hidden="true">
          <div className={styles.artCircle} />
          <div className={styles.artLines}><span /><span /><span /><span /></div>
          <svg viewBox="0 0 280 400" className={styles.branch} fill="none">
            <path d="M139 382C126 308 150 231 139 128C135 98 120 64 113 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M143 277C168 239 200 207 224 181M142 203C111 181 78 169 54 147M138 145C163 116 184 94 205 72" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M145 265C147 215 174 193 222 183C213 226 188 254 145 265Z" fill="currentColor" fillOpacity=".18" />
            <path d="M136 197C105 208 65 190 51 147C95 143 126 159 136 197Z" fill="currentColor" fillOpacity=".11" />
            <path d="M139 143C143 99 170 74 207 69C201 110 177 137 139 143Z" fill="currentColor" fillOpacity=".28" />
            <path d="M131 104C102 88 87 65 93 31C121 43 138 66 131 104Z" fill="currentColor" fillOpacity=".15" />
          </svg>
          <p className={styles.artCaption}>{isPt ? <>Sete dias.<br /><em>Pequenos passos. No seu ritmo.</em></> : <>Seven days.<br /><em>Small steps. Your pace.</em></>}</p>
        </aside>

        <section className={styles.content} aria-labelledby="welcome-step-title">
          {!personalizing ? <div className={styles.step}>
            <span className={styles.stepIcon}><NotebookPen size={22} aria-hidden="true" /></span>
            <p className={styles.eyebrow}>{isPt ? "Seu planejador de sete dias" : "Your seven-day planner"}</p>
            <h1 ref={headingRef} id="welcome-step-title" tabIndex={-1} className={styles.title}>
              {isPt ? <>Um Pequeno Passo.<br /><em>Uma Semana Sob Medida.</em></> : <>A Small Step.<br /><em>A Week That Fits.</em></>}
            </h1>
            <p className={styles.description}>
              {isPt
                ? "Planeje os próximos sete dias com um pequeno passo de cada vez. Comece com uma semana pronta, ajuste o que precisar e reserve espaço para descansar."
                : "Plan the next seven days with one small step at a time. Start with a ready-made week, adjust what you need, and leave room for rest."}
            </p>
            <div className={styles.startingPoints} style={{ marginTop: 24 }}>
              <p className={styles.choiceHint}>{isPt ? "Um começo leve" : "A light beginning"}</p>
              <p><Check size={14} aria-hidden="true" />{isPt ? "Uma sugestão prática para cada dia" : "One manageable suggestion each day"}</p>
              <p><Check size={14} aria-hidden="true" />{isPt ? "Semanas prontas sem necessidade de IA" : "Ready-made weeks without AI"}</p>
              <p><Check size={14} aria-hidden="true" />{isPt ? "Suas próprias seções, notas e escolhas" : "Your own sections, notes, and choices"}</p>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primary}
                onClick={() => setPersonalizing(true)}
              >
                {isPt ? "Começar o Quiz (10 Perguntas)" : "Start the Quiz (10 Questions)"} <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
            <p className={styles.privacyNote}>
              {isPt
                ? "Perguntas de personalização e IA são opcionais. Sua semana fica salva neste dispositivo."
                : "Personalization questions and AI are optional. Your preview stays on this device; you choose whether to use it."}
            </p>
          </div> : <>
          <button type="button" className={styles.quietLink} onClick={() => setPersonalizing(false)}>
            <ArrowLeft size={14} aria-hidden="true" /> {isPt ? "Voltar ao início" : "Back to the simple start"}
          </button>
          <nav className={styles.progress} aria-label={isPt ? "Preferências da semana" : "Optional weekly preferences"}>
            <span className={styles.progressTrack}>{[...QUESTIONS.map((item) => item.label), "Your week"].map((label, index) => <button type="button" key={label} onClick={() => moveTo(index)} aria-label={index === QUESTIONS.length ? (isPt ? "Sua semana" : "Your week preview") : `${label}, question ${index + 1} of ${QUESTIONS.length}`} aria-current={step === index ? "step" : undefined} className={styles.progressButton}><span data-current={step === index} data-visited={index < step} /></button>)}</span>
            <span className={styles.stepCount} aria-hidden="true">{finalStep ? (isPt ? "Sua semana" : "Your week") : `${String(step + 1).padStart(2, "0")} / ${QUESTIONS.length}`}</span>
          </nav>

          <div className={styles.step} key={step} data-step={step}>
            <span className={styles.stepIcon}><StepIcon size={22} strokeWidth={1.4} aria-hidden="true" /></span>
            <p className={styles.eyebrow}>
              {finalStep ? (isPt ? "Sua primeira semana" : "Your first seven days") : (isPt ? PT_QUESTIONS[question.id]?.eyebrow || question.eyebrow : question.eyebrow)}
            </p>
            <h1 ref={headingRef} id="welcome-step-title" tabIndex={-1} className={styles.title}>
              {finalStep ? (isPt ? <>Uma Semana Moldada<br /><em>Ao Seu Redor.</em></> : <>A Week Shaped<br /><em>Around You.</em></>) : (isPt ? PT_QUESTIONS[question.id]?.title || titleCase(question.title) : titleCase(question.title))}
            </h1>
            <p className={styles.description}>
              {finalStep
                ? (chosenStartingPoints.length > 0
                  ? (isPt ? "Sua primeira semana está pronta para explorar. Ela foi montada neste dispositivo a partir das suas preferências. Cada sugestão pode ser alterada, marcada como feita ou deixada para outro dia." : "Your first week is ready to explore. It was assembled on this device from the preferences you chose. Every suggestion can be changed, skipped or left for another day.")
                  : (isPt ? "Uma semana inicial suave está pronta para explorar. Você pode ajustá-la depois. Cada sugestão pode ser adaptada ao seu ritmo." : "A gentle starting week is ready to explore. You can make it your own later. Every suggestion can be changed, skipped or left for another day."))
                : (isPt ? PT_QUESTIONS[question.id]?.description || question.description : question.description)}
            </p>

            {!finalStep && <fieldset className={styles.choices}>
              <legend className={styles.choiceHint}>
                {isPt ? "Escolha uma opção se desejar. Cada pergunta é opcional." : "Choose one if you’d like. Every question is optional."}
              </legend>
              {question.choices.map((choice) => {
                const choicePt = isPt ? PT_QUESTIONS[question.id]?.choices[choice.id] : undefined
                const choiceTitle = choicePt?.title || choice.title
                const choiceDetail = choicePt?.detail || choice.detail
                return (
                  <button type="button" key={choice.id} onClick={() => toggleChoice(choice.id)} aria-pressed={selected === choice.id} className={styles.choice} data-selected={selected === choice.id}>
                    <span className={styles.choiceCopy}>
                      <span className={styles.choiceTitle}>{choiceTitle}</span>
                      <span className={styles.choiceDetail}>{choiceDetail}</span>
                    </span>
                    <span className={styles.choiceCheck} aria-hidden="true">{selected === choice.id && <Check size={14} strokeWidth={2} />}</span>
                  </button>
                )
              })}
            </fieldset>}

            {finalStep && <div className={styles.invitation}>
              {quote && <details className={styles.preferenceSummary}><summary>{isPt ? "Um Momento Opcional de Reflexão" : "An Optional Moment of Reflection"}</summary><div className={styles.reflection}>
                <blockquote><p>“{quote.text}”</p><footer><span>{quote.author}{quote.year && ` · ${quote.year}`}</span><a href={quote.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(event) => { if (isNativeApp()) { event.preventDefault(); void openExternalUrl(quote.sourceUrl).catch(() => setSourceError("The source could not be opened. Please try again.")) } }}><cite>{quote.sourceTitle}</cite> <MoveUpRight size={12} aria-hidden="true" /></a></footer></blockquote>
                <p className={styles.quoteContext}>{quote.context}</p>
                {ONBOARDING_QUOTES.length > 1 && <button type="button" className={styles.anotherReflection} onClick={() => { setQuoteIndex((previous) => (previous + 1) % ONBOARDING_QUOTES.length); setSourceError(null) }}>{isPt ? "Outra reflexão" : "Another reflection"} <ArrowRight size={12} aria-hidden="true" /></button>}
                {sourceError && <p role="alert" className={styles.quoteContext}>{sourceError}</p>}
              </div></details>}
              {personalGuide && <div className={styles.startingPoints}><p className={styles.choiceHint}>{isPt ? "Sua semana preparada localmente" : "Your locally prepared week"}</p><h2 className={styles.guideTitle}>{titleCase(personalGuide.title)}</h2><p className={styles.guideDescription}>{isPt ? "Sete sugestões editáveis com espaço para suas notas:" : "Seven editable suggestions, with optional space for notes:"}</p>{personalGuide.sections.slice(0, 3).map((section) => <p key={section.id}><Check size={14} aria-hidden="true" />{section.title}</p>)}</div>}
              {chosenStartingPoints.length > 0 && <details className={styles.preferenceSummary}><summary>{isPt ? `Revise Suas ${chosenStartingPoints.length} Escolhas` : `Review Your ${chosenStartingPoints.length} ${chosenStartingPoints.length === 1 ? "Preference" : "Preferences"}`}</summary><dl>{chosenStartingPoints.map((point) => <div key={point.label}><dt>{point.label}</dt><dd>{point.value}</dd></div>)}</dl></details>}
              <div className={styles.invitationCopy}><NotebookPen size={20} strokeWidth={1.5} aria-hidden="true" /><p>{isPt ? "Explore sua semana no seu ritmo. Você pode marcar tarefas, adicionar notas e personalizar cada dia livremente." : "Preview your week at your own pace. You can check off steps, add notes and adapt each day freely."}</p></div>
              <p className={styles.careNote}>{isPt ? "Autocuidado reflexivo e educacional. Espiritualidade é opcional e desativada por padrão. Este planejador não substitui acompanhamento profissional." : "Educational self-care, with no psychological approach imposed. Spirituality is optional and off by default. This planner does not replace professional care."}</p>
            </div>}

            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => moveTo(Math.max(0, step - 1))}
                disabled={step === 0}
                className={styles.back}
              >
                <ArrowLeft size={16} aria-hidden="true" /> {isPt ? "Voltar" : "Back"}
              </button>
              <button
                type="button"
                onClick={finalStep ? () => onComplete({ ...answers }) : () => moveTo(step + 1)}
                className={styles.primary}
              >
                {finalStep ? (testMode ? (isPt ? "Abrir Espaço de Teste" : "Start Test Workspace") : (isPt ? "Abrir Meu Planejador" : "Open My Planner")) : (isPt ? "Continuar" : "Continue")}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>

            {!finalStep ? (
              <button type="button" onClick={() => moveTo(step + 1)} className={styles.skipStep}>
                {isPt ? "Pular esta pergunta" : "Skip this question"}
              </button>
            ) : (
              <button type="button" onClick={() => onPreview({ ...answers })} className={styles.skipStep}>
                {isPt ? "Explorar semana inicial" : "Explore my week preview"}
              </button>
            )}

            <p className={styles.privacyNote}>
              {isPt
                ? "Suas respostas são usadas apenas para montar esta semana localmente. Nenhum dado é enviado para servidores externos."
                : "Your preferences stay in memory to prepare a week locally. Everything is kept on this device."}
            </p>
          </div></>}
        </section>
      </main>

      <footer className={styles.footer}>
        <span>{isPt ? "Sete dias. Pequenos passos. No seu ritmo." : "Seven days. Small steps. Your pace."}</span>
      </footer>
    </div>
  )
}
