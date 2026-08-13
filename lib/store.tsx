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
import { DEFAULT_GUIDE_TEMPLATE, sections } from "@/lib/guide-data"
import { calculateInclusiveEndDate, getNextDayDate, getTodayFormatted, getWeekDays, formatDateRangeBR } from "@/lib/date-utils"

const STORAGE_KEY_V2 = "guia-retomada-v2"
const STORAGE_KEY_V1 = "guia-retomada-v1"

export type ThemeMode = "light" | "dark" | "system"
export type ColorPalette = "sage" | "terracotta" | "blue" | "graphite" | "olive"

export const PALETTES = [
  {
    id: "sage" as const,
    name: "Original (Pinho Sálvia)",
    subtitle: "Pinho & Papel Quente",
    colorHex: "#285238",
    colorHexDark: "#3eb875",
    bgHex: "#f7f6f0",
    cardHex: "#fefefe",
    primaryHex: "#285238",
    goldHex: "#a88132",
    description: "Visual original do aplicativo. Equilíbrio, serenidade e papel aquecido.",
  },
  {
    id: "terracotta" as const,
    name: "Terracota Editorial",
    subtitle: "Argila & Barro Quente",
    colorHex: "#8d3c1b",
    colorHexDark: "#e26f43",
    bgHex: "#f9f5f0",
    cardHex: "#ffffff",
    primaryHex: "#8d3c1b",
    goldHex: "#b87333",
    description: "Cores quentes e orgânicas com tom de barro e aterramento.",
  },
  {
    id: "blue" as const,
    name: "Sábia Editorial",
    subtitle: "Azul Marinho & Índigo",
    colorHex: "#1e4d79",
    colorHexDark: "#4d98d8",
    bgHex: "#f4f6f9",
    cardHex: "#ffffff",
    primaryHex: "#1e4d79",
    goldHex: "#4a7bb0",
    description: "Serenidade oceânica, clareza mental e estrutura sóbria.",
  },
  {
    id: "graphite" as const,
    name: "Grafite Elefante",
    subtitle: "Carvão Monocromático",
    colorHex: "#2b2f33",
    colorHexDark: "#c0c5ca",
    bgHex: "#f5f5f5",
    cardHex: "#ffffff",
    primaryHex: "#2b2f33",
    goldHex: "#686f77",
    description: "Minimalismo contemporâneo e sóbrio em escala neutra.",
  },
  {
    id: "olive" as const,
    name: "Oliva Editorial",
    subtitle: "Verde Oliva & Amêndoa",
    colorHex: "#455026",
    colorHexDark: "#8da348",
    bgHex: "#f6f7f2",
    cardHex: "#ffffff",
    primaryHex: "#455026",
    goldHex: "#808f43",
    description: "Tons botânicos de oliva e terra com leiturabilidade acolhedora.",
  },
] as const

export type WeekData = {
  text: Record<string, string>
  done: Record<string, boolean>
}

export type WeekProgress = {
  total: number
  concluidas: number
  percentual: number
}

export type ScheduleActivity = {
  id: string
  dayIndex: number // 0 to 6 (representing Dia 1 to Dia 7)
  time: string // e.g., "16:30"
  description: string
  order: number
  countsTowardCompletion?: boolean // defaults to true
}

export type WeekStatus = "active" | "completed"

export type TaskResultItem = {
  id: string
  description: string
  time?: string
  dayIndex: number
  done: boolean
  countsTowardCompletion: boolean
}

export type CompletionSnapshot = {
  totalTasks: number
  completedTasks: number
  completionPercentage: number
  taskResults: TaskResultItem[]
  completedAt: string
}

export type AIReview = {
  verdict: string
  summary: string
  whatWorked: string[]
  difficulties: string[]
  observedPatterns: string[]
  nextWeekSuggestions: string[]
  generatedAt: string
  analysisVersion: number
}

export function getDefaultScheduleActivities(): ScheduleActivity[] {
  return [
    { id: "act-0-1", dayIndex: 0, time: "16:30", description: "Preparar caderno + duas escadas / Ativação 15 min", order: 0, countsTowardCompletion: true },
    { id: "act-0-2", dayIndex: 0, time: "17:00", description: "Saída: degrau 1", order: 1, countsTowardCompletion: true },
    { id: "act-0-3", dayIndex: 0, time: "21:30", description: "Escrita livre 5 min", order: 2, countsTowardCompletion: true },
    { id: "act-1-1", dayIndex: 1, time: "16:30", description: "Trabalho: pista externa nível 1", order: 0, countsTowardCompletion: true },
    { id: "act-1-2", dayIndex: 1, time: "17:00", description: "Repetir saída", order: 1, countsTowardCompletion: true },
    { id: "act-2-1", dayIndex: 2, time: "16:30", description: "Julgamento proporcional", order: 0, countsTowardCompletion: true },
    { id: "act-2-2", dayIndex: 2, time: "21:30", description: "Escrita livre 5 min", order: 1, countsTowardCompletion: true },
    { id: "act-3-1", dayIndex: 3, time: "16:30", description: "Relacionamento: 4 colunas", order: 0, countsTowardCompletion: true },
    { id: "act-3-2", dayIndex: 3, time: "17:00", description: "Saída: mesmo/pequeno avanço", order: 1, countsTowardCompletion: true },
    { id: "act-4-1", dayIndex: 4, time: "16:30", description: "Discriminação de ameaça", order: 0, countsTowardCompletion: true },
    { id: "act-5-1", dayIndex: 5, time: "16:30", description: "Vínculo + competência", order: 0, countsTowardCompletion: true },
    { id: "act-5-2", dayIndex: 5, time: "17:00", description: "Saída", order: 1, countsTowardCompletion: true },
    { id: "act-5-3", dayIndex: 5, time: "21:30", description: "Escrita livre 5 min", order: 2, countsTowardCompletion: true },
    { id: "act-6-1", dayIndex: 6, time: "16:30", description: "Revisão semanal 30 min", order: 0, countsTowardCompletion: true },
  ]
}

export type WeekInstance = {
  id: string
  guideId: string
  templateId: string
  title: string
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD (7th day inclusive)
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  status: WeekStatus
  completedAt?: string | null
  completionSnapshot?: CompletionSnapshot | null
  aiReview?: AIReview | null
  aiReviewVersion?: number
  aiReviewOutdated?: boolean
  data: WeekData
  programacao: {
    dias: number
    activities: ScheduleActivity[]
  }
  progresso: WeekProgress
}

type StoreDataV3 = {
  schemaVersion: number
  weeks: WeekInstance[]
  activeWeekId: string
}

type StoreValue = {
  ready: boolean
  weeks: WeekInstance[]
  activeWeek: WeekInstance | null
  activeWeekId: string | null
  selectWeek: (id: string) => void
  createWeek: (customTitle?: string, customStartDate?: string, templateId?: string) => void
  deleteWeek: (id: string) => void
  updateWeekMeta: (id: string, updates: { title?: string; startDate?: string }) => void
  completeWeek: (id: string) => Promise<void>
  reopenWeek: (id: string) => void
  generateAIReview: (id: string) => Promise<void>
  isGeneratingAI: boolean
  aiError: string | null
  prevWeek: () => void
  nextWeek: () => void
  hasPrevWeek: boolean
  hasNextWeek: boolean
  getText: (id: string) => string
  setText: (id: string, value: string) => void
  isDone: (id: string) => boolean
  toggleDone: (id: string, value?: boolean) => void
  doneCount: (ids: string[]) => number
  resetActiveWeek: () => void
  addScheduleActivity: (dayIndex: number, time: string, description: string, countsTowardCompletion?: boolean) => void
  updateScheduleActivity: (
    id: string,
    updates: { dayIndex?: number; time?: string; description?: string; order?: number; countsTowardCompletion?: boolean }
  ) => void
  deleteScheduleActivity: (id: string) => void
  moveScheduleActivity: (id: string, direction: "up" | "down") => void
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  palette: ColorPalette
  setPalette: (palette: ColorPalette) => void
  exportToMarkdown: () => void
  exportWeekJSON: () => void
  exportToJSON: () => void
  importFromJSON: (jsonData: string) => boolean
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [weeks, setWeeks] = useState<WeekInstance[]>([])
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null)
  const [theme, setThemeState] = useState<ThemeMode>("light")
  const [palette, setPaletteState] = useState<ColorPalette>("sage")
  const [ready, setReady] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load theme and palette on client side
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("guia-theme") as ThemeMode | null
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        setThemeState(savedTheme)
      }
      const savedPalette = localStorage.getItem("guia-palette") as ColorPalette | null
      if (savedPalette && ["sage", "terracotta", "blue", "graphite", "olive"].includes(savedPalette)) {
        setPaletteState(savedPalette)
      }
    } catch {}
  }, [])

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement
    const applyTheme = (mode: ThemeMode) => {
      let isDark = mode === "dark"
      if (mode === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      }
      if (isDark) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }

    applyTheme(theme)

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => applyTheme("system")
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme])

  // Apply data-palette to <html>
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-palette", palette)
  }, [palette])

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme)
    try {
      localStorage.setItem("guia-theme", nextTheme)
    } catch {}
  }, [])

  const setPalette = useCallback((nextPalette: ColorPalette) => {
    setPaletteState(nextPalette)
    try {
      localStorage.setItem("guia-palette", nextPalette)
    } catch {}
  }, [])

  const persist = useCallback((nextWeeks: WeekInstance[], nextActiveId: string | null) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY_V2,
          JSON.stringify({
            schemaVersion: 3,
            weeks: nextWeeks,
            activeWeekId: nextActiveId,
          })
        )
      } catch {
        // ignore quota error
      }
    }, 150)
  }, [])

  const computeProgress = useCallback((data: WeekData, activities?: ScheduleActivity[]): WeekProgress => {
    const acts = (activities ?? []).filter((a) => a.countsTowardCompletion !== false)
    const total = acts.length
    const concluidas = acts.reduce((acc, act) => acc + (data.done[act.id] ? 1 : 0), 0)
    const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0
    return { total, concluidas, percentual }
  }, [])

  const createSnapshot = useCallback((w: WeekInstance): CompletionSnapshot => {
    const activities = w.programacao?.activities || []
    const taskResults: TaskResultItem[] = activities.map((a) => ({
      id: a.id,
      description: a.description,
      time: a.time,
      dayIndex: a.dayIndex,
      done: Boolean(w.data.done[a.id]),
      countsTowardCompletion: a.countsTowardCompletion !== false,
    }))

    const countable = taskResults.filter((t) => t.countsTowardCompletion)
    const totalTasks = countable.length
    const completedTasks = countable.filter((t) => t.done).length
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const nowIso = new Date().toISOString()

    return {
      totalTasks,
      completedTasks,
      completionPercentage,
      taskResults,
      completedAt: nowIso,
    }
  }, [])

  // Initialize and load from localStorage with migration to schema v3
  useEffect(() => {
    try {
      const rawV2 = localStorage.getItem(STORAGE_KEY_V2)
      if (rawV2) {
        const parsed = JSON.parse(rawV2) as StoreDataV3
        if (parsed.weeks && parsed.weeks.length > 0) {
          const formattedWeeks = parsed.weeks.map((w) => {
            const data = w.data ?? { text: {}, done: {} }
            const rawActs =
              w.programacao?.activities && w.programacao.activities.length > 0
                ? w.programacao.activities
                : getDefaultScheduleActivities()

            const acts = rawActs.map((a) => ({
              ...a,
              countsTowardCompletion: a.countsTowardCompletion !== false,
            }))

            return {
              ...w,
              guideId: w.guideId || w.templateId || DEFAULT_GUIDE_TEMPLATE.id,
              templateId: w.templateId || w.guideId || DEFAULT_GUIDE_TEMPLATE.id,
              updatedAt: w.updatedAt || w.createdAt || new Date().toISOString(),
              status: w.status || "active",
              completedAt: w.completedAt || null,
              completionSnapshot: w.completionSnapshot || null,
              aiReview: w.aiReview || null,
              aiReviewVersion: w.aiReviewVersion || 1,
              aiReviewOutdated: Boolean(w.aiReviewOutdated),
              programacao: {
                dias: 7,
                activities: acts,
              },
              progresso: computeProgress(data, acts),
            }
          })
          const sorted = [...formattedWeeks].sort((a, b) =>
            a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
          )
          setWeeks(sorted)
          const validActive = sorted.some((w) => w.id === parsed.activeWeekId)
            ? parsed.activeWeekId
            : sorted[0].id
          setActiveWeekId(validActive)
          setReady(true)
          return
        }
      }

      // Migration from v1 or initial creation
      let legacyData: WeekData = { text: {}, done: {} }
      try {
        const rawV1 = localStorage.getItem(STORAGE_KEY_V1)
        if (rawV1) {
          const parsedV1 = JSON.parse(rawV1)
          if (parsedV1.text || parsedV1.done) {
            legacyData = { text: parsedV1.text ?? {}, done: parsedV1.done ?? {} }
          }
        }
      } catch {
        // ignore
      }

      const today = getTodayFormatted()
      const nowIso = new Date().toISOString()
      const defaultActs = getDefaultScheduleActivities()
      const initialWeek: WeekInstance = {
        id: "week-1",
        guideId: DEFAULT_GUIDE_TEMPLATE.id,
        templateId: DEFAULT_GUIDE_TEMPLATE.id,
        title: "Semana 1",
        startDate: today,
        endDate: calculateInclusiveEndDate(today),
        createdAt: nowIso,
        updatedAt: nowIso,
        status: "active",
        completedAt: null,
        completionSnapshot: null,
        aiReview: null,
        aiReviewVersion: 1,
        aiReviewOutdated: false,
        data: legacyData,
        programacao: {
          dias: 7,
          activities: defaultActs,
        },
        progresso: computeProgress(legacyData, defaultActs),
      }

      setWeeks([initialWeek])
      setActiveWeekId("week-1")
      localStorage.setItem(
        STORAGE_KEY_V2,
        JSON.stringify({
          schemaVersion: 3,
          weeks: [initialWeek],
          activeWeekId: "week-1",
        })
      )
    } catch {
      // fallback
    }
    setReady(true)
  }, [computeProgress])

  // Sorted weeks chronologically
  const sortedWeeks = useMemo(() => {
    return [...weeks].sort((a, b) =>
      a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
    )
  }, [weeks])

  const activeWeek = useMemo(() => {
    if (!activeWeekId) return sortedWeeks[0] ?? null
    return sortedWeeks.find((w) => w.id === activeWeekId) ?? sortedWeeks[0] ?? null
  }, [sortedWeeks, activeWeekId])

  const selectWeek = useCallback(
    (id: string) => {
      setActiveWeekId(id)
      setWeeks((prev) => {
        persist(prev, id)
        return prev
      })
    },
    [persist]
  )

  const createWeek = useCallback(
    (customTitle?: string, customStartDate?: string, templateId = DEFAULT_GUIDE_TEMPLATE.id) => {
      let startDate = customStartDate?.trim() || ""

      setWeeks((prevWeeks) => {
        const sorted = [...prevWeeks].sort((a, b) =>
          a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
        )

        if (!startDate) {
          if (sorted.length > 0) {
            const lastWeek = sorted[sorted.length - 1]
            startDate = getNextDayDate(lastWeek.endDate)
          } else {
            startDate = getTodayFormatted()
          }
        }

        const endDate = calculateInclusiveEndDate(startDate)
        const weekNumber = sorted.length + 1
        const title = customTitle?.trim() || `Semana ${weekNumber}`
        const newId = `week-${Date.now()}`
        const nowIso = new Date().toISOString()
        const initialData = { text: {}, done: {} }
        const defaultActs = getDefaultScheduleActivities()

        const newWeek: WeekInstance = {
          id: newId,
          guideId: templateId,
          templateId,
          title,
          startDate,
          endDate,
          createdAt: nowIso,
          updatedAt: nowIso,
          status: "active",
          completedAt: null,
          completionSnapshot: null,
          aiReview: null,
          aiReviewVersion: 1,
          aiReviewOutdated: false,
          data: initialData,
          programacao: {
            dias: 7,
            activities: defaultActs,
          },
          progresso: computeProgress(initialData, defaultActs),
        }

        const updatedWeeks = [...prevWeeks, newWeek].sort((a, b) =>
          a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
        )

        setActiveWeekId(newId)
        persist(updatedWeeks, newId)
        return updatedWeeks
      })
    },
    [computeProgress, persist]
  )

  const deleteWeek = useCallback(
    (id: string) => {
      setWeeks((prevWeeks) => {
        const remaining = prevWeeks.filter((w) => w.id !== id)
        if (remaining.length === 0) {
          const today = getTodayFormatted()
          const nowIso = new Date().toISOString()
          const emptyData = { text: {}, done: {} }
          const defaultActs = getDefaultScheduleActivities()
          const defaultWeek: WeekInstance = {
            id: `week-${Date.now()}`,
            guideId: DEFAULT_GUIDE_TEMPLATE.id,
            templateId: DEFAULT_GUIDE_TEMPLATE.id,
            title: "Semana 1",
            startDate: today,
            endDate: calculateInclusiveEndDate(today),
            createdAt: nowIso,
            updatedAt: nowIso,
            status: "active",
            completedAt: null,
            completionSnapshot: null,
            aiReview: null,
            aiReviewVersion: 1,
            aiReviewOutdated: false,
            data: emptyData,
            programacao: {
              dias: 7,
              activities: defaultActs,
            },
            progresso: computeProgress(emptyData, defaultActs),
          }
          setActiveWeekId(defaultWeek.id)
          persist([defaultWeek], defaultWeek.id)
          return [defaultWeek]
        }

        const sortedRemaining = [...remaining].sort((a, b) =>
          a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
        )

        setActiveWeekId((currentActive) => {
          const nextActiveId = currentActive === id ? sortedRemaining[0].id : currentActive
          persist(sortedRemaining, nextActiveId)
          return nextActiveId
        })

        return sortedRemaining
      })
    },
    [computeProgress, persist]
  )

  const updateWeekMeta = useCallback(
    (id: string, updates: { title?: string; startDate?: string }) => {
      setWeeks((prev) => {
        const nowIso = new Date().toISOString()
        const next = prev.map((w) => {
          if (w.id !== id) return w
          const newStartDate = updates.startDate ? updates.startDate : w.startDate
          const newEndDate = updates.startDate ? calculateInclusiveEndDate(updates.startDate) : w.endDate
          const newTitle = updates.title !== undefined ? updates.title : w.title
          return {
            ...w,
            title: newTitle,
            startDate: newStartDate,
            endDate: newEndDate,
            updatedAt: nowIso,
          }
        })
        const sorted = [...next].sort((a, b) =>
          a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
        )
        persist(sorted, activeWeekId)
        return sorted
      })
    },
    [activeWeekId, persist]
  )

  // AI Review Generator Function (calls server-side API)
  const generateAIReview = useCallback(
    async (weekId: string) => {
      const targetWeek = weeks.find((w) => w.id === weekId)
      if (!targetWeek || !targetWeek.completionSnapshot) return

      setIsGeneratingAI(true)
      setAiError(null)

      try {
        const res = await fetch("/api/analyze-week", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            weekTitle: targetWeek.title,
            startDate: targetWeek.startDate,
            endDate: targetWeek.endDate,
            snapshot: targetWeek.completionSnapshot,
            textAnswers: targetWeek.data.text,
            theologyEnabled: true, // Default guide template uses theology
          }),
        })

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}))
          throw new Error(errJson.error || "Falha na comunicação com o servidor para análise inteligência.")
        }

        const reviewData: AIReview = await res.json()

        setWeeks((prev) => {
          const nowIso = new Date().toISOString()
          const next = prev.map((w) => {
            if (w.id !== weekId) return w
            return {
              ...w,
              updatedAt: nowIso,
              aiReview: reviewData,
              aiReviewVersion: (w.aiReviewVersion || 1) + 1,
              aiReviewOutdated: false,
            }
          })
          persist(next, activeWeekId)
          return next
        })
      } catch (err: any) {
        console.error("AI Review Generation Error:", err)
        setAiError(err?.message || "Análise indisponível no momento.")
      } finally {
        setIsGeneratingAI(false)
      }
    },
    [weeks, activeWeekId, persist]
  )

  // Complete Week Handler
  const completeWeek = useCallback(
    async (id: string) => {
      let snapshotToUse: CompletionSnapshot | null = null

      setWeeks((prev) => {
        const nowIso = new Date().toISOString()
        const next = prev.map((w) => {
          if (w.id !== id) return w
          const snapshot = createSnapshot(w)
          snapshotToUse = snapshot
          return {
            ...w,
            status: "completed" as WeekStatus,
            completedAt: snapshot.completedAt,
            completionSnapshot: snapshot,
            aiReviewOutdated: false,
            updatedAt: nowIso,
          }
        })
        persist(next, activeWeekId)
        return next
      })

      // Trigger AI review asynchronously; failure does not affect completion status
      if (snapshotToUse) {
        await generateAIReview(id)
      }
    },
    [createSnapshot, generateAIReview, activeWeekId, persist]
  )

  // Reopen Completed Week
  const reopenWeek = useCallback(
    (id: string) => {
      setWeeks((prev) => {
        const nowIso = new Date().toISOString()
        const next = prev.map((w) => {
          if (w.id !== id) return w
          return {
            ...w,
            status: "active" as WeekStatus,
            updatedAt: nowIso,
          }
        })
        persist(next, activeWeekId)
        return next
      })
    },
    [activeWeekId, persist]
  )

  const activeIndex = useMemo(() => {
    if (!activeWeek) return -1
    return sortedWeeks.findIndex((w) => w.id === activeWeek.id)
  }, [sortedWeeks, activeWeek])

  const hasPrevWeek = activeIndex > 0
  const hasNextWeek = activeIndex >= 0 && activeIndex < sortedWeeks.length - 1

  const prevWeek = useCallback(() => {
    if (hasPrevWeek) {
      const prevId = sortedWeeks[activeIndex - 1].id
      selectWeek(prevId)
    }
  }, [hasPrevWeek, sortedWeeks, activeIndex, selectWeek])

  const nextWeek = useCallback(() => {
    if (hasNextWeek) {
      const nextId = sortedWeeks[activeIndex + 1].id
      selectWeek(nextId)
    }
  }, [hasNextWeek, sortedWeeks, activeIndex, selectWeek])

  const getText = useCallback(
    (fieldId: string) => {
      if (!activeWeek) return ""
      return activeWeek.data.text[fieldId] ?? ""
    },
    [activeWeek]
  )

  const setText = useCallback(
    (fieldId: string, value: string) => {
      if (!activeWeek) return
      const currentWeekId = activeWeek.id
      setWeeks((prevWeeks) => {
        const nowIso = new Date().toISOString()
        const nextWeeks = prevWeeks.map((w) => {
          if (w.id !== currentWeekId) return w
          const nextData = {
            ...w.data,
            text: {
              ...w.data.text,
              [fieldId]: value,
            },
          }
          return {
            ...w,
            updatedAt: nowIso,
            data: nextData,
            aiReviewOutdated: w.status === "completed" ? true : w.aiReviewOutdated,
            progresso: computeProgress(nextData, w.programacao.activities),
          }
        })
        persist(nextWeeks, currentWeekId)
        return nextWeeks
      })
    },
    [activeWeek, computeProgress, persist]
  )

  const isDone = useCallback(
    (taskId: string) => {
      if (!activeWeek) return false
      return Boolean(activeWeek.data.done[taskId])
    },
    [activeWeek]
  )

  const toggleDone = useCallback(
    (taskId: string, value?: boolean) => {
      if (!activeWeek) return
      const currentWeekId = activeWeek.id
      setWeeks((prevWeeks) => {
        const nowIso = new Date().toISOString()
        const nextWeeks = prevWeeks.map((w) => {
          if (w.id !== currentWeekId) return w
          const currentVal = Boolean(w.data.done[taskId])
          const nextVal = value ?? !currentVal
          const nextData = {
            ...w.data,
            done: {
              ...w.data.done,
              [taskId]: nextVal,
            },
          }
          return {
            ...w,
            updatedAt: nowIso,
            data: nextData,
            aiReviewOutdated: w.status === "completed" ? true : w.aiReviewOutdated,
            progresso: computeProgress(nextData, w.programacao.activities),
          }
        })
        persist(nextWeeks, currentWeekId)
        return nextWeeks
      })
    },
    [activeWeek, computeProgress, persist]
  )

  const addScheduleActivity = useCallback(
    (dayIndex: number, time: string, description: string, countsTowardCompletion = true) => {
      if (!activeWeek) return
      const currentWeekId = activeWeek.id
      setWeeks((prevWeeks) => {
        const nowIso = new Date().toISOString()
        const nextWeeks = prevWeeks.map((w) => {
          if (w.id !== currentWeekId) return w
          const currentActivities = w.programacao?.activities || []
          const sameDayActivities = currentActivities.filter((a) => a.dayIndex === dayIndex)
          const nextOrder = sameDayActivities.length

          const newActivity: ScheduleActivity = {
            id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            dayIndex,
            time: time.trim() || "12:00",
            description: description.trim(),
            order: nextOrder,
            countsTowardCompletion,
          }

          const newActivities = [...currentActivities, newActivity]
          const updatedProgramacao = {
            ...w.programacao,
            activities: newActivities,
          }

          return {
            ...w,
            updatedAt: nowIso,
            programacao: updatedProgramacao,
            aiReviewOutdated: w.status === "completed" ? true : w.aiReviewOutdated,
            progresso: computeProgress(w.data, newActivities),
          }
        })
        persist(nextWeeks, currentWeekId)
        return nextWeeks
      })
    },
    [activeWeek, computeProgress, persist]
  )

  const updateScheduleActivity = useCallback(
    (
      id: string,
      updates: { dayIndex?: number; time?: string; description?: string; order?: number; countsTowardCompletion?: boolean }
    ) => {
      if (!activeWeek) return
      const currentWeekId = activeWeek.id
      setWeeks((prevWeeks) => {
        const nowIso = new Date().toISOString()
        const nextWeeks = prevWeeks.map((w) => {
          if (w.id !== currentWeekId) return w
          const currentActivities = w.programacao?.activities || []
          const newActivities = currentActivities.map((act) => {
            if (act.id !== id) return act
            return {
              ...act,
              ...(updates.dayIndex !== undefined && { dayIndex: updates.dayIndex }),
              ...(updates.time !== undefined && { time: updates.time }),
              ...(updates.description !== undefined && { description: updates.description }),
              ...(updates.order !== undefined && { order: updates.order }),
              ...(updates.countsTowardCompletion !== undefined && { countsTowardCompletion: updates.countsTowardCompletion }),
            }
          })

          const updatedProgramacao = {
            ...w.programacao,
            activities: newActivities,
          }

          return {
            ...w,
            updatedAt: nowIso,
            programacao: updatedProgramacao,
            aiReviewOutdated: w.status === "completed" ? true : w.aiReviewOutdated,
            progresso: computeProgress(w.data, newActivities),
          }
        })
        persist(nextWeeks, currentWeekId)
        return nextWeeks
      })
    },
    [activeWeek, computeProgress, persist]
  )

  const deleteScheduleActivity = useCallback(
    (id: string) => {
      if (!activeWeek) return
      const currentWeekId = activeWeek.id
      setWeeks((prevWeeks) => {
        const nowIso = new Date().toISOString()
        const nextWeeks = prevWeeks.map((w) => {
          if (w.id !== currentWeekId) return w
          const currentActivities = w.programacao?.activities || []
          const newActivities = currentActivities.filter((act) => act.id !== id)

          const updatedProgramacao = {
            ...w.programacao,
            activities: newActivities,
          }

          return {
            ...w,
            updatedAt: nowIso,
            programacao: updatedProgramacao,
            aiReviewOutdated: w.status === "completed" ? true : w.aiReviewOutdated,
            progresso: computeProgress(w.data, newActivities),
          }
        })
        persist(nextWeeks, currentWeekId)
        return nextWeeks
      })
    },
    [activeWeek, computeProgress, persist]
  )

  const moveScheduleActivity = useCallback(
    (id: string, direction: "up" | "down") => {
      if (!activeWeek) return
      const currentWeekId = activeWeek.id
      setWeeks((prevWeeks) => {
        const nowIso = new Date().toISOString()
        const nextWeeks = prevWeeks.map((w) => {
          if (w.id !== currentWeekId) return w
          const currentActivities = [...(w.programacao?.activities || [])]
          const targetAct = currentActivities.find((a) => a.id === id)
          if (!targetAct) return w

          const dayActivities = currentActivities
            .filter((a) => a.dayIndex === targetAct.dayIndex)
            .sort((a, b) => a.order - b.order)

          const currentIndex = dayActivities.findIndex((a) => a.id === id)
          if (currentIndex === -1) return w

          const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
          if (targetIndex < 0 || targetIndex >= dayActivities.length) return w

          const otherAct = dayActivities[targetIndex]
          const tempOrder = targetAct.order
          targetAct.order = otherAct.order
          otherAct.order = tempOrder

          const updatedProgramacao = {
            ...w.programacao,
            activities: currentActivities,
          }

          return {
            ...w,
            updatedAt: nowIso,
            programacao: updatedProgramacao,
            aiReviewOutdated: w.status === "completed" ? true : w.aiReviewOutdated,
            progresso: computeProgress(w.data, currentActivities),
          }
        })
        persist(nextWeeks, currentWeekId)
        return nextWeeks
      })
    },
    [activeWeek, computeProgress, persist]
  )

  const doneCount = useCallback(
    (ids: string[]) => {
      if (!activeWeek) return 0
      return ids.reduce((acc, id) => acc + (activeWeek.data.done[id] ? 1 : 0), 0)
    },
    [activeWeek]
  )

  const resetActiveWeek = useCallback(() => {
    if (!activeWeek) return
    const currentWeekId = activeWeek.id
    setWeeks((prevWeeks) => {
      const nextWeeks = prevWeeks.map((w) => {
        if (w.id !== currentWeekId) return w
        return {
          ...w,
          data: { text: {}, done: {} },
          aiReviewOutdated: w.status === "completed" ? true : w.aiReviewOutdated,
        }
      })
      persist(nextWeeks, currentWeekId)
      return nextWeeks
    })
  }, [activeWeek, persist])

  const exportToMarkdown = useCallback(() => {
    if (!activeWeek) return
    const rangeStr = formatDateRangeBR(activeWeek.startDate, activeWeek.endDate)
    let md = `# ${DEFAULT_GUIDE_TEMPLATE.title}\n`
    md += `## ${activeWeek.title} (${rangeStr})\n\n`
    md += `**Status:** ${activeWeek.status === "completed" ? "Concluída" : "Em andamento"}\n`
    if (activeWeek.completedAt) {
      md += `**Concluída em:** ${new Date(activeWeek.completedAt).toLocaleString("pt-BR")}\n`
    }
    md += `**Data de Criação:** ${new Date(activeWeek.createdAt).toLocaleDateString("pt-BR")}\n`
    md += `**Progresso da Semana:** ${activeWeek.progresso.concluidas} de ${activeWeek.progresso.total} tarefas concluídas (${activeWeek.progresso.percentual}%)\n\n`

    if (activeWeek.aiReview) {
      md += `---\n\n`
      md += `### Análise Inteligente & Veredito da Semana\n\n`
      md += `**Veredito:** ${activeWeek.aiReview.verdict}\n\n`
      md += `**Resumo:** ${activeWeek.aiReview.summary}\n\n`
      md += `**O que funcionou bem:**\n`
      activeWeek.aiReview.whatWorked.forEach((item) => (md += `- ${item}\n`))
      md += `\n**Dificuldades observadas:**\n`
      activeWeek.aiReview.difficulties.forEach((item) => (md += `- ${item}\n`))
      md += `\n**Padrões observados:**\n`
      activeWeek.aiReview.observedPatterns.forEach((item) => (md += `- ${item}\n`))
      md += `\n**Sugestões para a próxima semana:**\n`
      activeWeek.aiReview.nextWeekSuggestions.forEach((item) => (md += `- ${item}\n`))
      md += `\n`
    }

    md += `---\n\n`
    md += `### Programação Semanal de Atividades\n\n`
    const days = getWeekDays(activeWeek.startDate)
    const activities = activeWeek.programacao?.activities || []

    days.forEach((day) => {
      md += `#### ${day.dayNumberLabel} (${day.formattedShort})\n`
      const dayActs = activities
        .filter((a) => a.dayIndex === day.dayIndex)
        .sort((a, b) => a.order - b.order || a.time.localeCompare(b.time))

      if (dayActs.length === 0) {
        md += `*Sem atividades cadastradas*\n\n`
      } else {
        dayActs.forEach((act) => {
          const done = activeWeek.data.done[act.id] ? "[X]" : "[ ]"
          const extra = act.countsTowardCompletion === false ? " (Informativa)" : ""
          md += `- ${done} **${act.time}** — ${act.description}${extra}\n`
        })
        md += `\n`
      }
    })

    md += `---\n\n`
    md += `### Registros e Respostas do Guia\n\n`
    sections.forEach((s) => {
      md += `#### Seção ${s.number}: ${s.title}\n\n`
      s.blocks.forEach((block) => {
        if (block.type === "fields" && block.fields) {
          if (block.title) md += `##### ${block.title}\n\n`
          block.fields.forEach((field) => {
            if (field.kind === "static") return
            const val = activeWeek.data.text[field.id] || "*Não preenchido*"
            const label = field.label || field.id
            md += `**${label}:**\n> ${val.replace(/\n/g, "\n> ")}\n\n`
          })
        } else if (block.type === "ladder" && block.rows) {
          block.rows.forEach((row) => {
            const nota = activeWeek.data.text[`${row.id}-nota`] || "-"
            const feito = activeWeek.data.done[row.id] ? "[X]" : "[ ]"
            md += `- ${feito} **${row.label}** — Nota prevista: ${nota}\n`
          })
          md += `\n`
        }
      })
    })

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Guia_Retomada_${activeWeek.title.replace(/\s+/g, "_")}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [activeWeek])

  const exportWeekJSON = useCallback(() => {
    if (!activeWeek) return
    const activities = activeWeek.programacao?.activities || []
    const taskResults = activities.map((a) => ({
      id: a.id,
      dayIndex: a.dayIndex,
      time: a.time,
      description: a.description,
      countsTowardCompletion: a.countsTowardCompletion !== false,
      done: Boolean(activeWeek.data.done[a.id]),
    }))
    const exportData = {
      exportVersion: 1,
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      guide: {
        id: activeWeek.guideId || DEFAULT_GUIDE_TEMPLATE.id,
        title: DEFAULT_GUIDE_TEMPLATE.title,
      },
      metadata: {
        weekId: activeWeek.id,
        title: activeWeek.title,
        startDate: activeWeek.startDate,
        endDate: activeWeek.endDate,
        status: activeWeek.status,
        createdAt: activeWeek.createdAt,
        updatedAt: activeWeek.updatedAt,
        completedAt: activeWeek.completedAt ?? null,
      },
      schedule: activities.map((a) => ({
        id: a.id,
        dayIndex: a.dayIndex,
        time: a.time,
        description: a.description,
        order: a.order,
        countsTowardCompletion: a.countsTowardCompletion !== false,
      })),
      responses: activeWeek.data.text,
      tasks: taskResults,
      progress: activeWeek.progresso,
      completionSnapshot: activeWeek.completionSnapshot ?? null,
      aiReview: activeWeek.aiReview ?? null,
    }
    const jsonStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Semana_${activeWeek.title.replace(/\s+/g, "_")}_${activeWeek.startDate}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [activeWeek])

  const exportToJSON = useCallback(() => {
    const exportData = {
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      theme,
      palette,
      activeWeekId,
      weeks,
    }
    const jsonStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Guia_Retomada_Backup_${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [weeks, activeWeekId, theme, palette])

  const importFromJSON = useCallback(
    (jsonData: string) => {
      try {
        const parsed = JSON.parse(jsonData)
        if (!parsed || !Array.isArray(parsed.weeks) || parsed.weeks.length === 0) {
          return false
        }
        const formattedWeeks: WeekInstance[] = parsed.weeks.map((w: any) => ({
          ...w,
          status: w.status || "active",
          completedAt: w.completedAt || null,
          completionSnapshot: w.completionSnapshot || null,
          aiReview: w.aiReview || null,
          aiReviewVersion: w.aiReviewVersion || 1,
          aiReviewOutdated: Boolean(w.aiReviewOutdated),
          programacao: {
            dias: 7,
            activities: (w.programacao?.activities || getDefaultScheduleActivities()).map((a: any) => ({
              ...a,
              countsTowardCompletion: a.countsTowardCompletion !== false,
            })),
          },
        }))
        setWeeks(formattedWeeks)
        if (parsed.activeWeekId && formattedWeeks.some((w) => w.id === parsed.activeWeekId)) {
          setActiveWeekId(parsed.activeWeekId)
        } else {
          setActiveWeekId(formattedWeeks[0].id)
        }
        if (parsed.theme && ["light", "dark", "system"].includes(parsed.theme)) {
          setTheme(parsed.theme)
        }
        if (parsed.palette && ["sage", "terracotta", "blue", "graphite", "olive"].includes(parsed.palette)) {
          setPalette(parsed.palette)
        }
        persist(formattedWeeks, parsed.activeWeekId || formattedWeeks[0].id)
        return true
      } catch {
        return false
      }
    },
    [persist, setTheme, setPalette]
  )

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      weeks: sortedWeeks,
      activeWeek,
      activeWeekId: activeWeek?.id ?? null,
      selectWeek,
      createWeek,
      deleteWeek,
      updateWeekMeta,
      completeWeek,
      reopenWeek,
      generateAIReview,
      isGeneratingAI,
      aiError,
      prevWeek,
      nextWeek,
      hasPrevWeek,
      hasNextWeek,
      getText,
      setText,
      isDone,
      toggleDone,
      doneCount,
      resetActiveWeek,
      addScheduleActivity,
      updateScheduleActivity,
      deleteScheduleActivity,
      moveScheduleActivity,
      theme,
      setTheme,
      palette,
      setPalette,
      exportToMarkdown,
      exportWeekJSON,
      exportToJSON,
      importFromJSON,
    }),
    [
      ready,
      sortedWeeks,
      activeWeek,
      selectWeek,
      createWeek,
      deleteWeek,
      updateWeekMeta,
      completeWeek,
      reopenWeek,
      generateAIReview,
      isGeneratingAI,
      aiError,
      prevWeek,
      nextWeek,
      hasPrevWeek,
      hasNextWeek,
      getText,
      setText,
      isDone,
      toggleDone,
      doneCount,
      resetActiveWeek,
      addScheduleActivity,
      updateScheduleActivity,
      deleteScheduleActivity,
      moveScheduleActivity,
      theme,
      setTheme,
      palette,
      setPalette,
      exportToMarkdown,
      exportWeekJSON,
      exportToJSON,
      importFromJSON,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
