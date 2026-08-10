"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

const STORAGE_KEY = "guia-retomada-v1"

type Data = {
  text: Record<string, string>
  done: Record<string, boolean>
}

type StoreValue = {
  ready: boolean
  getText: (id: string) => string
  setText: (id: string, value: string) => void
  isDone: (id: string) => boolean
  toggleDone: (id: string, value?: boolean) => void
  doneCount: (ids: string[]) => number
  reset: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>({ text: {}, done: {} })
  const [ready, setReady] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Data>
        setData({ text: parsed.text ?? {}, done: parsed.done ?? {} })
      }
    } catch {
      // ignore corrupt storage
    }
    setReady(true)
  }, [])

  const persist = useCallback((next: Data) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore quota errors
      }
    }, 250)
  }, [])

  const getText = useCallback((id: string) => data.text[id] ?? "", [data.text])

  const setText = useCallback(
    (id: string, value: string) => {
      setData((prev) => {
        const next = { ...prev, text: { ...prev.text, [id]: value } }
        persist(next)
        return next
      })
    },
    [persist],
  )

  const isDone = useCallback((id: string) => Boolean(data.done[id]), [data.done])

  const toggleDone = useCallback(
    (id: string, value?: boolean) => {
      setData((prev) => {
        const nextVal = value ?? !prev.done[id]
        const next = { ...prev, done: { ...prev.done, [id]: nextVal } }
        persist(next)
        return next
      })
    },
    [persist],
  )

  const doneCount = useCallback(
    (ids: string[]) => ids.reduce((acc, id) => acc + (data.done[id] ? 1 : 0), 0),
    [data.done],
  )

  const reset = useCallback(() => {
    const empty: Data = { text: {}, done: {} }
    setData(empty)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const value = useMemo<StoreValue>(
    () => ({ ready, getText, setText, isDone, toggleDone, doneCount, reset }),
    [ready, getText, setText, isDone, toggleDone, doneCount, reset],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
