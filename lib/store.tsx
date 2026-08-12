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
}

export function getDefaultScheduleActivities(): ScheduleActivity[] {
  return [
    { id: "act-0-1", dayIndex: 0, time: "16:30", description: "Preparar caderno + duas escadas / Ativação 15 min", order: 0 },
    { id: "act-0-2", dayIndex: 0, time: "17:00", description: "Saída: degrau 1", order: 1 },
    { id: "act-0-3", dayIndex: 0, time: "21:30", description: "Escrita livre 5 min", order: 2 },
    { id: "act-1-1", dayIndex: 1, time: "16:30", description: "Trabalho: pista externa nível 1", order: 0 },
    { id: "act-1-2", dayIndex: 1, time: "17:00", description: "Repetir saída", order: 1 },
    { id: "act-2-1", dayIndex: 2, time: "16:30", description: "Julgamento proporcional", order: 0 },
    { id: "act-2-2", dayIndex: 2, time: "21:30", description: "Escrita livre 5 min", order: 1 },
    { id: "act-3-1", dayIndex: 3, time: "16:30", description: "Relacionamento: 4 colunas", order: 0 },
    { id: "act-3-2", dayIndex: 3, time: "17:00", description: "Saída: mesmo/pequeno avanço", order: 1 },
    { id: "act-4-1", dayIndex: 4, time: "16:30", description: "Discriminação de ameaça", order: 0 },
    { id: "act-5-1", dayIndex: 5, time: "16:30", description: "Vínculo + competência", order: 0 },
    { id: "act-5-2", dayIndex: 5, time: "17:00", description: "Saída", order: 1 },
    { id: "act-5-3", dayIndex: 5, time: "21:30", description: "Escrita livre 5 min", order: 2 },
    { id: "act-6-1", dayIndex: 6, time: "16:30", description: "Revisão semanal 30 min", order: 0 },
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
  data: WeekData
  programacao: {
    dias: number
    activities: ScheduleActivity[]
  }
  progresso: WeekProgress
}

type StoreDataV2 = {
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
  addScheduleActivity: (dayIndex: number, time: string, description: string) => void
  updateScheduleActivity: (
    id: string,
    updates: { dayIndex?: number; time?: string; description?: string; order?: number }
  ) => void
  deleteScheduleActivity: (id: string) => void
  moveScheduleActivity: (id: string, direction: "up" | "down") => void
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  palette: ColorPalette
  setPalette: (palette: ColorPalette) => void
  exportToMarkdown: () => void
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
            schemaVersion: 2,
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
    const acts = activities ?? []
    const total = acts.length
    const concluidas = acts.reduce((acc, act) => acc + (data.done[act.id] ? 1 : 0), 0)
    const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0
    return { total, concluidas, percentual }
  }, [])

  // Initialize and load from localStorage
  useEffect(() => {
    try {
      const rawV2 = localStorage.getItem(STORAGE_KEY_V2)
      if (rawV2) {
        const parsed = JSON.parse(rawV2) as StoreDataV2
        if (parsed.weeks && parsed.weeks.length > 0) {
          const formattedWeeks = parsed.weeks.map((w) => {
            const data = w.data ?? { text: {}, done: {} }
            const acts =
              w.programacao?.activities && w.programacao.activities.length > 0
                ? w.programacao.activities
                : getDefaultScheduleActivities()

            return {
              ...w,
              guideId: w.guideId || w.templateId || DEFAULT_GUIDE_TEMPLATE.id,
              templateId: w.templateId || w.guideId || DEFAULT_GUIDE_TEMPLATE.id,
              updatedAt: w.updatedAt || w.createdAt || new Date().toISOString(),
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
          schemaVersion: 2,
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

        const newWeek: WeekInstance = {
          id: newId,
          guideId: templateId,
          templateId,
          title,
          startDate,
          endDate,
          createdAt: nowIso,
          updatedAt: nowIso,
          data: initialData,
          programacao: {
            dias: 7,
            activities: getDefaultScheduleActivities(),
          },
          progresso: computeProgress(initialData, getDefaultScheduleActivities()),
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
    (dayIndex: number, time: string, description: string) => {
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
      updates: { dayIndex?: number; time?: string; description?: string; order?: number }
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
    md += `**Data de Criação:** ${new Date(activeWeek.createdAt).toLocaleDateString("pt-BR")}\n`
    md += `**Progresso da Semana:** ${activeWeek.progresso.concluidas} de ${activeWeek.progresso.total} tarefas concluídas (${activeWeek.progresso.percentual}%)\n\n`

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
          md += `- ${done} **${act.time}** — ${act.description}\n`
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

  const exportToJSON = useCallback(() => {
    const exportData = {
      schemaVersion: 2,
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
        setWeeks(parsed.weeks)
        if (parsed.activeWeekId && parsed.weeks.some((w: WeekInstance) => w.id === parsed.activeWeekId)) {
          setActiveWeekId(parsed.activeWeekId)
        } else {
          setActiveWeekId(parsed.weeks[0].id)
        }
        if (parsed.theme && ["light", "dark", "system"].includes(parsed.theme)) {
          setTheme(parsed.theme)
        }
        if (parsed.palette && ["sage", "terracotta", "blue", "graphite", "olive"].includes(parsed.palette)) {
          setPalette(parsed.palette)
        }
        persist(parsed.weeks, parsed.activeWeekId || parsed.weeks[0].id)
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
