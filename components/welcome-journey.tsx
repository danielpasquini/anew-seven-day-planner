"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Check, HeartHandshake, Leaf, MoveUpRight, NotebookPen, Sprout, Sun, Wind, Clock3, Compass, LayoutList, Sunrise, Footprints } from "lucide-react"
import { ONBOARDING_QUOTES } from "@/lib/onboarding-quotes"
import { QUESTIONS, buildPersonalizedGuide, hasOnboardingAnswers, getOnboardingSummary, type OnboardingAnswers } from "@/lib/onboarding"
import { createStarterGuide } from "@/lib/planner"
import { titleCase } from "@/lib/title-case"
import { isNativeApp, openExternalUrl } from "@/lib/platform"
import { BrandMark } from "@/components/brand-mark"
import { SoundControl } from "@/components/sound-control"
import styles from "./welcome-journey.module.css"

const STEP_ICONS = [Sprout, Wind, Sun, HeartHandshake, Compass, Clock3, NotebookPen, Sunrise, LayoutList, Footprints, Leaf]

export interface WelcomeJourneyProps {
  onComplete: (answers: OnboardingAnswers) => void
  onPreview: (answers: OnboardingAnswers) => void
  onSignIn?: () => void
}

/** Optional preferences stay in memory; a local guide can be previewed before account creation. */
export function WelcomeJourney({ onComplete, onPreview, onSignIn }: WelcomeJourneyProps) {
  const [step, setStep] = useState(0)
  const [personalizing, setPersonalizing] = useState(false)
  const [answers, setAnswers] = useState<OnboardingAnswers>({})
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [sourceError, setSourceError] = useState<string | null>(null)
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
        <button type="button" onClick={() => onPreview({ ...answers })} className={styles.quietLink}>Skip to preview <MoveUpRight size={14} aria-hidden="true" /></button>
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
          <p className={styles.artCaption}>Seven days.<br /><em>Small steps. Your pace.</em></p>
        </aside>

        <section className={styles.content} aria-labelledby="welcome-step-title">
          {!personalizing ? <div className={styles.step}>
            <span className={styles.stepIcon}><NotebookPen size={22} aria-hidden="true" /></span>
            <p className={styles.eyebrow}>Your seven-day planner</p>
            <h1 ref={headingRef} id="welcome-step-title" tabIndex={-1} className={styles.title}>A Small Step.<br /><em>A Week That Fits.</em></h1>
            <p className={styles.description}>Plan the next seven days with one small step at a time. Start with a ready-made week, adjust what you need, and leave room for rest.</p>
            <div className={styles.startingPoints} style={{ marginTop: 24 }}>
              <p className={styles.choiceHint}>A light beginning</p>
              <p><Check size={14} aria-hidden="true" />One manageable suggestion each day</p>
              <p><Check size={14} aria-hidden="true" />Ready-made weeks without AI</p>
              <p><Check size={14} aria-hidden="true" />Your own sections, notes, and choices</p>
            </div>
            <div className={styles.actions}><button type="button" className={styles.primary} onClick={() => onPreview({})}>Preview a Week <ArrowRight size={17} aria-hidden="true" /></button></div>
            <button type="button" className={styles.skipStep} onClick={() => setPersonalizing(true)}>Personalize My Week <ArrowRight size={14} aria-hidden="true" /></button>
            <p className={styles.privacyNote}>Personalization questions and AI are optional. Your preview stays on this device; you choose whether to use it.</p>
          </div> : <>
          <button type="button" className={styles.quietLink} onClick={() => setPersonalizing(false)}><ArrowLeft size={14} aria-hidden="true" /> Back to the simple start</button>
          <nav className={styles.progress} aria-label="Optional weekly preferences">
            <span className={styles.progressTrack}>{[...QUESTIONS.map((item) => item.label), "Your guide"].map((label, index) => <button type="button" key={label} onClick={() => moveTo(index)} aria-label={index === QUESTIONS.length ? "Your guide preview" : `${label}, question ${index + 1} of ${QUESTIONS.length}`} aria-current={step === index ? "step" : undefined} className={styles.progressButton}><span data-current={step === index} data-visited={index < step} /></button>)}</span>
            <span className={styles.stepCount} aria-hidden="true">{finalStep ? "Your guide" : `${String(step + 1).padStart(2, "0")} / ${QUESTIONS.length}`}</span>
          </nav>

          <div className={styles.step} key={step} data-step={step}>
            <span className={styles.stepIcon}><StepIcon size={22} strokeWidth={1.4} aria-hidden="true" /></span>
            <p className={styles.eyebrow}>{finalStep ? "Your first seven days" : question.eyebrow}</p>
            <h1 ref={headingRef} id="welcome-step-title" tabIndex={-1} className={styles.title}>{finalStep ? <>A Week Shaped<br /><em>Around You.</em></> : titleCase(question.title)}</h1>
            <p className={styles.description}>{finalStep ? chosenStartingPoints.length > 0 ? "Your first guide is ready to explore. It was assembled on this device from the preferences you chose. Every suggestion can be changed, skipped or left for another day." : "A gentle starting guide is ready to explore. You can make it your own later. Every suggestion can be changed, skipped or left for another day." : question.description}</p>

            {!finalStep && <fieldset className={styles.choices}><legend className={styles.choiceHint}>Choose one if you’d like. Every question is optional.</legend>{question.choices.map((choice) => <button type="button" key={choice.id} onClick={() => toggleChoice(choice.id)} aria-pressed={selected === choice.id} className={styles.choice} data-selected={selected === choice.id}><span className={styles.choiceCopy}><span className={styles.choiceTitle}>{choice.title}</span><span className={styles.choiceDetail}>{choice.detail}</span></span><span className={styles.choiceCheck} aria-hidden="true">{selected === choice.id && <Check size={14} strokeWidth={2} />}</span></button>)}</fieldset>}

            {finalStep && <div className={styles.invitation}>
              {quote && <details className={styles.preferenceSummary}><summary>An Optional Moment of Reflection</summary><div className={styles.reflection}>
                <blockquote><p>“{quote.text}”</p><footer><span>{quote.author}{quote.year && ` · ${quote.year}`}</span><a href={quote.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(event) => { if (isNativeApp()) { event.preventDefault(); void openExternalUrl(quote.sourceUrl).catch(() => setSourceError("The source could not be opened. Please try again.")) } }}><cite>{quote.sourceTitle}</cite> <MoveUpRight size={12} aria-hidden="true" /></a></footer></blockquote>
                <p className={styles.quoteContext}>{quote.context}</p>
                {ONBOARDING_QUOTES.length > 1 && <button type="button" className={styles.anotherReflection} onClick={() => { setQuoteIndex((previous) => (previous + 1) % ONBOARDING_QUOTES.length); setSourceError(null) }}>Another reflection <ArrowRight size={12} aria-hidden="true" /></button>}
                {sourceError && <p role="alert" className={styles.quoteContext}>{sourceError}</p>}
              </div></details>}
              {personalGuide && <div className={styles.startingPoints}><p className={styles.choiceHint}>Your locally prepared week</p><h2 className={styles.guideTitle}>{titleCase(personalGuide.title)}</h2><p className={styles.guideDescription}>Seven editable suggestions, with optional space for notes:</p>{personalGuide.sections.slice(0, 3).map((section) => <p key={section.id}><Check size={14} aria-hidden="true" />{section.title}</p>)}</div>}
              {chosenStartingPoints.length > 0 && <details className={styles.preferenceSummary}><summary>Review Your {chosenStartingPoints.length} {chosenStartingPoints.length === 1 ? "Preference" : "Preferences"}</summary><dl>{chosenStartingPoints.map((point) => <div key={point.label}><dt>{point.label}</dt><dd>{point.value}</dd></div>)}</dl></details>}
              <div className={styles.invitationCopy}><NotebookPen size={20} strokeWidth={1.5} aria-hidden="true" /><p>Preview your week without an account. After signing up and acknowledging the notices, verify your email to save a week, edit steps, and use your notes.</p></div>
              <p className={styles.careNote}>Educational self-care, with no psychological approach imposed. Spirituality is optional and off by default. This guide does not replace professional care.</p>
            </div>}

            <div className={styles.actions}>
              <button type="button" onClick={() => moveTo(Math.max(0, step - 1))} disabled={step === 0} className={styles.back}><ArrowLeft size={16} aria-hidden="true" /> Back</button>
              <button type="button" onClick={finalStep ? () => onComplete({ ...answers }) : () => moveTo(step + 1)} className={styles.primary}>{finalStep ? "Create my account" : "Continue"}<ArrowRight size={17} aria-hidden="true" /></button>
            </div>
            {!finalStep ? <button type="button" onClick={() => moveTo(step + 1)} className={styles.skipStep}>Skip this question</button> : <button type="button" onClick={() => onPreview({ ...answers })} className={styles.skipStep}>Explore my guide preview</button>}
            <p className={styles.privacyNote}>Your preferences stay in memory to prepare a guide locally. After signing up and acknowledging the notices, the derived guide can be saved on this device for your account. Verify your email to use it. Answers aren’t stored separately or sent to Firebase or AI.</p>
          </div></>}
        </section>
      </main>

      <footer className={styles.footer}><span>Seven days. Small steps. Your pace.</span><SoundControl label />{onSignIn && <button type="button" onClick={onSignIn}>I already have an account <ArrowRight size={14} aria-hidden="true" /></button>}</footer>
    </div>
  )
}
