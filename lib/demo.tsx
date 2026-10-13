"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import type { GuideTemplate } from "./guide-data"
import { DemoSessionController, type DemoScenario, type DemoSession, type MemoryDemoStorage } from "./demo-data"
import { useAuth } from "./auth/client"

type DemoValue = {
  available: boolean
  enabled: boolean
  sessionId: string | null
  storageKey: string | null
  demoStorage: MemoryDemoStorage | null
  scenario: DemoScenario | null
  accessError: string | null
  startDemo: (guide?: GuideTemplate) => boolean
  startFirstVisit: () => boolean
  exitDemo: () => void
  resetDemo: () => void
}

const DemoContext = createContext<DemoValue>({ available: false, enabled: false, sessionId: null, storageKey: null, demoStorage: null, scenario: null, accessError: null, startDemo: () => false, startFirstVisit: () => false, exitDemo: () => {}, resetDemo: () => {} })

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const accountRef = useRef(user)
  accountRef.current = user
  const controllerRef = useRef<DemoSessionController | null>(null)
  if (!controllerRef.current) controllerRef.current = new DemoSessionController(process.env.NEXT_PUBLIC_ENABLE_DEMO === "true", () => {
    const account = accountRef.current
    return !account || window.dispatchEvent(new CustomEvent("retomada:before-sign-out", { detail: account.uid, cancelable: true }))
  })
  const controller = controllerRef.current
  const [session, setSession] = useState<DemoSession | null>(null)
  const [accessError, setAccessError] = useState<string | null>(null)
  const start = useCallback((guide?: GuideTemplate, scenario: DemoScenario = "returning-user") => {
    const next = controller.start(guide, scenario)
    if (!next) {
      setAccessError("Your latest edits could not be saved. Download a backup or retry saving before opening test mode.")
      return false
    }
    setAccessError(null); setSession(next)
    return true
  }, [controller])
  const startDemo = useCallback((guide?: GuideTemplate) => start(guide), [start])
  const startFirstVisit = useCallback(() => start(undefined, "first-visit"), [start])
  const exitDemo = useCallback(() => { controller.exit(); setSession(null); setAccessError(null) }, [controller])
  const resetDemo = useCallback(() => { setSession(controller.reset()) }, [controller])
  const value = useMemo<DemoValue>(() => ({
    available: controller.available, enabled: session !== null, sessionId: session?.id ?? null,
    storageKey: session?.storageKey ?? null, demoStorage: session?.storage ?? null,
    scenario: session?.scenario ?? null, accessError, startDemo, startFirstVisit, exitDemo, resetDemo,
  }), [controller, session, accessError, startDemo, startFirstVisit, exitDemo, resetDemo])
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export const useDemo = () => useContext(DemoContext)
