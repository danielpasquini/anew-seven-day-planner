"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth/client"
import { BrandMark } from "@/components/brand-mark"
import { GuideApp } from "@/components/guide-app"
import { WelcomeJourney } from "@/components/welcome-journey"
import { StoreProvider } from "@/lib/store"
import { buildPersonalizedGuide, hasOnboardingAnswers, type OnboardingAnswers } from "@/lib/onboarding"
import { createStarterGuide } from "@/lib/planner"
import type { GuideTemplate } from "@/lib/guide-data"
import { stageOnboardingGuide } from "@/lib/onboarding-draft"
import { beginOpeningSound, stopOpeningSound } from "@/lib/sounds"
import { AudioEngine } from "@/lib/audio/AudioEngine"
import { useDemo } from "@/lib/demo"
import "./launch-experience.css"

const INTRO_SEEN = "anew-introduction-seen-v1"
const FIRST_OPEN = "anew-first-open-v1"

function GrowingBranch() {
  const leaves = [
    { x: 135, y: 214, angle: -73, delay: "1.1s" },
    { x: 139, y: 187, angle: 12, delay: "3.1s" },
    { x: 146, y: 151, angle: -67, delay: "4.8s" },
    { x: 147, y: 121, angle: 14, delay: "6.1s" },
    { x: 146, y: 88, angle: -59, delay: "7s" },
    { x: 140, y: 57, angle: 8, delay: "7.55s" },
  ]
  return <svg viewBox="0 0 280 300" className="anew-branch" fill="none" aria-hidden="true">
    <path className="anew-growing-stem" d="M111 276C136 236 127 208 143 166C154 132 147 88 137 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {leaves.map((leaf, index) => <g key={index} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})`}>
      <g className="anew-growing-leaf" style={{ animationDelay: leaf.delay, animationDuration: `${1.55 - index * .18}s` }}>
        <path d="M0 0C-8-24 8-46 42-51C48-19 28 7 0 0Z" fill="currentColor" fillOpacity={.12 + index * .025} stroke="currentColor" strokeWidth="1.6" />
        <path d="M0 0C13-15 18-29 34-42M15-21L14-34" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </g>)}
  </svg>
}

export function LaunchExperience() {
  const demo = useDemo()
  const { user: accountUser, status, legalAccepted } = useAuth()
  const user = demo.enabled ? null : accountUser
  const fullAccess = status === "authenticated" && user?.emailVerified && legalAccepted
  const [phase, setPhase] = useState<"opening" | "journey" | "app">(demo.scenario === "returning-user" ? "app" : "opening")
  const [firstVisit, setFirstVisit] = useState(true)
  const [introPending, setIntroPending] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [preview, setPreview] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [personalGuide, setPersonalGuide] = useState<GuideTemplate | null>(null)
  const personalOwnerRef = useRef<string | null>(null)
  useEffect(() => {
    try {
      const storage = demo.enabled ? demo.demoStorage : localStorage
      setFirstVisit(storage?.getItem(FIRST_OPEN) !== "seen")
      setIntroPending(storage?.getItem(INTRO_SEEN) !== "seen")
      storage?.setItem(FIRST_OPEN, "seen")
      const theme = storage?.getItem("guia-theme")
      document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches))
    } catch {
      // Storage unavailable (e.g. private mode)
    }
    setLoaded(true)
  }, [])
  const enter = (mode: "login" | "register" | "preview", answers?: OnboardingAnswers) => {
    try { (demo.enabled ? demo.demoStorage : localStorage)?.setItem(INTRO_SEEN, "seen") } catch {}
    setPreview(mode === "preview")
    setAuthMode(mode === "register" ? "register" : "login")
    personalOwnerRef.current = null
    setPersonalGuide(answers !== undefined ? hasOnboardingAnswers(answers) ? buildPersonalizedGuide(answers) : createStarterGuide() : null)
    setPhase("app")
  }
  useEffect(() => {
    if (!personalGuide || demo.enabled || personalGuide.id.startsWith("anew-starter-")) return
    const owner = personalOwnerRef.current
    if (owner && (status === "guest" || (user && user.uid !== owner))) {
      setPersonalGuide(null)
      personalOwnerRef.current = null
      return
    }
    if (!user || !legalAccepted) return
    personalOwnerRef.current ||= user.uid
    if (personalOwnerRef.current !== user.uid) return
    try {
      stageOnboardingGuide(localStorage, user.uid, personalGuide)
    } catch {
      // In-memory fallback if storage is restricted
    }
  }, [personalGuide, user, status, legalAccepted, demo.enabled])
  useEffect(() => {
    if (phase !== "opening" || !loaded) return
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      beginOpeningSound()
      AudioEngine.playOpening(firstVisit)
    }
    return stopOpeningSound
  }, [phase, loaded, firstVisit])
  useEffect(() => {
    if (!loaded || phase !== "opening") return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const timer = window.setTimeout(() => setPhase(introPending && !user ? "journey" : "app"), reduced ? 100 : firstVisit ? 9200 : 1400)
    return () => window.clearTimeout(timer)
  }, [loaded, firstVisit, introPending, user, phase])
  if (phase === "opening") {
    return (
      <main className="anew-opening" tabIndex={-1} aria-label="Anew is opening">
        <div className="anew-opening-paper">
          {loaded && (
            firstVisit ? (
              <GrowingBranch />
            ) : (
              <BrandMark paper className="anew-returning-leaf size-28 text-primary" />
            )
          )}
          <span className="anew-paper-corner" aria-hidden="true" />
        </div>
        <h1 className="mt-7 font-serif text-5xl font-medium tracking-[-.045em] text-primary">
          Anew<span className="text-gold">.</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {typeof window !== "undefined" && (localStorage.getItem("guia-locale") === "pt-BR" || (!localStorage.getItem("guia-locale") && navigator.language?.startsWith("pt")))
            ? "Sete dias. Pequenos passos. No seu ritmo."
            : "Seven days. Small steps. Your pace."}
        </p>
        <button
          className="mt-8 min-h-11 rounded-xl px-4 text-xs text-muted-foreground hover:bg-primary/5"
          onClick={() => setPhase(introPending && !user ? "journey" : "app")}
        >
          {typeof window !== "undefined" && (localStorage.getItem("guia-locale") === "pt-BR" || (!localStorage.getItem("guia-locale") && navigator.language?.startsWith("pt")))
            ? "Pular animação"
            : "Skip animation"}
        </button>
      </main>
    )
  }

  if (phase === "journey") {
    return (
      <WelcomeJourney
        testMode={demo.enabled}
        onComplete={(answers) => enter("register", answers)}
        onPreview={(answers) => enter("preview", answers)}
        onSignIn={() => (demo.enabled ? demo.startDemo() : enter("login"))}
      />
    )
  }

  const accountGuide = !personalOwnerRef.current || personalOwnerRef.current === user?.uid ? personalGuide : null

  return (
    <div className={demo.enabled ? undefined : "anew-screen-enter"}>
      <StoreProvider
        key={demo.enabled ? demo.sessionId : fullAccess ? user.uid : "preview"}
        initialGuide={accountGuide}
      >
        <GuideApp
          initialPreview={preview}
          initialAuthMode={authMode}
          previewGuide={accountGuide}
          onPersonalize={() => setPhase("journey")}
        />
      </StoreProvider>
    </div>
  )
}
