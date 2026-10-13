"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import type { GuideTemplate } from "./guide-data"
import { DemoSessionController, type DemoSession, type MemoryDemoStorage } from "./demo-data"

type DemoValue = {
  available: boolean
  enabled: boolean
  sessionId: string | null
  storageKey: string | null
  demoStorage: MemoryDemoStorage | null
  startDemo: (guide?: GuideTemplate) => void
  exitDemo: () => void
  resetDemo: () => void
}

const DemoContext = createContext<DemoValue>({ available: false, enabled: false, sessionId: null, storageKey: null, demoStorage: null, startDemo: () => {}, exitDemo: () => {}, resetDemo: () => {} })

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const controllerRef = useRef<DemoSessionController | null>(null)
  if (!controllerRef.current) controllerRef.current = new DemoSessionController(process.env.NEXT_PUBLIC_ENABLE_DEMO === "true")
  const controller = controllerRef.current
  const [session, setSession] = useState<DemoSession | null>(null)
  const startDemo = useCallback((guide?: GuideTemplate) => { setSession(controller.start(guide)) }, [controller])
  const exitDemo = useCallback(() => { controller.exit(); setSession(null) }, [controller])
  const resetDemo = useCallback(() => { setSession(controller.reset()) }, [controller])
  const value = useMemo<DemoValue>(() => ({
    available: controller.available, enabled: session !== null, sessionId: session?.id ?? null,
    storageKey: session?.storageKey ?? null, demoStorage: session?.storage ?? null,
    startDemo, exitDemo, resetDemo,
  }), [controller, session, startDemo, exitDemo, resetDemo])
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export const useDemo = () => useContext(DemoContext)
