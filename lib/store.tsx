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
import { DEFAULT_GUIDE_TEMPLATE, DEFAULT_GUIDE_TEMPLATE_EN, GUIDE_TEMPLATES, type GuideTemplate, type CompletionConfig, type Section, sections } from "@/lib/guide-data"
import { calculateInclusiveEndDate, getNextDayDate, getTodayFormatted, getWeekDays, formatDateRangeLocale, type Locale } from "@/lib/date-utils"
import { getDictionary, type TranslationDictionary } from "@/lib/i18n"
import { BibleProvider, type BibleVersion } from "@/lib/bible/bible-provider"
import { SyncEngine, type SyncStatus } from "@/lib/sync/sync-engine"
import { isValidActivity, isValidBackup, isValidDate, isValidGuide } from "@/lib/backup-validation"
import { createStarterGuide, reviseGuideSections } from "@/lib/planner"
import { useAuth } from "@/lib/auth/client"
import { getAuthToken } from "@/lib/auth/firebase-client"
import { apiUrl } from "@/lib/api-url"
import { saveTextFile } from "@/lib/platform"
import { onboardingDraftKey, readOnboardingGuide } from "@/lib/onboarding-draft"
import { useDemo } from "@/lib/demo"

const STORAGE_KEY_V2 = "guia-retomada-v2"
const STORAGE_KEY_LOCALE = "guia-locale"
const STORAGE_KEY_BIBLE_VERSION = "guia-bible-version"

// Built-in templates can be revised without changing user answers or historical snapshots.
function upgradeBuiltInGuides(loaded: GuideTemplate[]): GuideTemplate[] {
  return loaded.map((guide) => {
    const builtIn = GUIDE_TEMPLATES.find((template) => template.id === guide.id)
    return builtIn && !guide.customized && guide.version < builtIn.version ? builtIn : guide
  })
}

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
  return DEFAULT_GUIDE_TEMPLATE_EN.weeklyPlan.map((activity) => ({ ...activity }))
}

export function generateWeekId(): string {
  return `week-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export type GuideTemplateSnapshot = {
  id: string
  title: string
  version: number
  completionConfig: CompletionConfig
  theologyEnabled?: boolean
  contentLocale?: "pt-BR" | "en-US"
  bibleVersion?: "ARA" | "NVT" | "KJV" | "NIV" | null
  sections?: Section[]
}

export type WeekInstance = {
  id: string
  guideId: string
  templateId: string
  guideVersion?: number
  guideSnapshot?: GuideTemplateSnapshot | null
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

type StoreDataV4 = {
  schemaVersion: 4
  guides: GuideTemplate[]
  activeGuideId: string
  weeks: WeekInstance[]
  activeWeekId: string
}

type StoreValue = {
  ready: boolean
  guides: GuideTemplate[]
  activeGuide: GuideTemplate
  activeGuideId: string
  selectGuide: (id: string) => void
  addGuide: (guide: GuideTemplate) => void
  saveAndActivateGuide: (guide: GuideTemplate) => void
  updateGuideSections: (sections: Section[]) => boolean
  starterIsPreview: boolean
  useStarterWeek: () => void
  weeks: WeekInstance[]
  activeWeek: WeekInstance | null
  activeWeekId: string | null
  selectWeek: (id: string) => void
  createWeek: (customTitle?: string, customStartDate?: string, templateId?: string) => void
  deleteWeek: (id: string) => void
  updateWeekMeta: (id: string, updates: { title?: string; startDate?: string }) => void
  completeWeek: (id: string) => Promise<void>
  reopenWeek: (id: string) => void
  generateAIReview: (id: string, aiConsent?: boolean, includeTextAnswers?: boolean) => Promise<void>
  clearAllLocalData: () => void
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
  locale: Locale
  setLocale: (locale: Locale) => void
  bibleVersion: BibleVersion
  setBibleVersion: (version: BibleVersion) => void
  t: TranslationDictionary
  saveStatus: SyncStatus
  storageWarning: string | null
  storageReadOnly: boolean
  retrySync: () => void
  exportToMarkdown: () => void
  exportWeekJSON: () => void
  exportToJSON: () => void
  importFromJSON: (jsonData: string) => boolean
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children, initialGuide }: { children: React.ReactNode; initialGuide?: GuideTemplate | null }) {
  const initialGuideRef = useRef(initialGuide)
  const demoContext = useDemo()
  // The owner and storage backend never change inside a mounted workspace.
  // LaunchExperience remounts this provider for every demo start/reset/exit.
  const demo = useRef(demoContext).current
  const demoMode = demo.enabled && demo.demoStorage !== null && demo.storageKey !== null
  const { status: authStatus, user: authUser, legalAccepted } = useAuth()
  const user = demoMode ? null : authUser
  const fullAccess = demoMode || (authStatus === "authenticated" && user?.emailVerified === true && legalAccepted)
  const storageKey = demoMode ? demo.storageKey! : user && fullAccess ? `${STORAGE_KEY_V2}:${user.uid}` : "guia-preview"
  const storage = useRef<Pick<Storage, "getItem" | "setItem" | "removeItem">>(demoMode ? demo.demoStorage! : {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
  }).current
  const [guides, setGuidesState] = useState<GuideTemplate[]>(GUIDE_TEMPLATES)
  const guidesRef = useRef(guides)
  guidesRef.current = guides
  const setGuides = useCallback((next: GuideTemplate[]) => { guidesRef.current = next; setGuidesState(next) }, [])
  const workspaceActiveRef = useRef(true)
  const [activeGuideId, setActiveGuideId] = useState<string>(DEFAULT_GUIDE_TEMPLATE_EN.id)
  const [weeks, setWeeksState] = useState<WeekInstance[]>([])
  const weeksRef = useRef(weeks)
  weeksRef.current = weeks
  // Resolve a workspace action once, before passing a value to React. Some actions
  // allocate IDs and select a week; React may replay its own updater functions.
  const setWeeks = useCallback((next: WeekInstance[] | ((current: WeekInstance[]) => WeekInstance[])) => {
    const resolved = typeof next === "function" ? next(weeksRef.current) : next
    weeksRef.current = resolved
    setWeeksState(resolved)
  }, [])
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null)
  const [theme, setThemeState] = useState<ThemeMode>("light")
  const [palette, setPaletteState] = useState<ColorPalette>("sage")
  const [locale, setLocaleState] = useState<Locale>("en-US")
  const [bibleVersion, setBibleVersionState] = useState<BibleVersion>("KJV")
  const [ready, setReady] = useState(false)
  const [starterIsPreview, setStarterIsPreview] = useState(false)
  const starterPreviewRef = useRef(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SyncStatus>("idle")
  const [storageIssue, setStorageIssue] = useState<"invalid" | "unread" | "unavailable" | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const preservedBackupRef = useRef<string | null>(null)
  const storageBlockedRef = useRef(false)
  const deletionSuspendedRef = useRef(false)
  const [deletionSuspended, setDeletionSuspended] = useState(false)
  const storageReadOnly = storageIssue === "invalid" || storageIssue === "unread"
  const canEdit = fullAccess && !storageReadOnly && !deletionSuspended
  const storageWarning = storageIssue === "invalid"
    ? locale === "en-US"
      ? "The saved backup could not be read. Its original contents were preserved, and editing is paused. Download the original backup, then import a valid backup or delete this account's local data to start again."
      : "O backup salvo não pôde ser lido. O conteúdo original foi preservado e a edição está pausada. Baixe o backup original e importe um backup válido, ou apague os dados locais desta conta para recomeçar."
    : storageIssue === "unread"
      ? locale === "en-US"
        ? "Your saved records could not be read. Editing is paused to preserve them. Retry reading, restore a valid backup, or explicitly clear this account's local data."
        : "Não foi possível ler seus registros salvos. A edição está pausada para preservá-los. Tente ler novamente, restaure um backup válido ou apague explicitamente os dados locais desta conta."
    : storageIssue === "unavailable"
      ? locale === "en-US"
        ? "Browser storage is unavailable or full. Changes remain in memory until they can be saved. Download a backup before closing this page."
        : "O armazenamento do navegador está indisponível ou cheio. As alterações ficam na memória até poderem ser salvas. Baixe um backup antes de fechar esta página."
      : null
  const syncEngineRef = useRef<SyncEngine | null>(null)
  if (!syncEngineRef.current) syncEngineRef.current = new SyncEngine()
  const syncEngine = syncEngineRef.current

  useEffect(() => {
    workspaceActiveRef.current = true
    const unsubscribe = syncEngine.subscribe((status) => {
      setSaveStatus(status)
      if (status === "error" && !storageBlockedRef.current) setStorageIssue("unavailable")
    })
    const flush = () => syncEngine.flushLocalPersist()
    const beforeSignOut = (event: Event) => {
      if (demoMode || !user || (event as CustomEvent<string>).detail !== user.uid) return
      if (!syncEngine.flushLocalPersist()) event.preventDefault()
    }
    const beforeDelete = (event: Event) => {
      if (demoMode || !user) return
      if ((event as CustomEvent<string>).detail !== user?.uid) return
      // A failed remote deletion must leave the most recent edits recoverable.
      if (!syncEngine.flushLocalPersist()) { event.preventDefault(); return }
      deletionSuspendedRef.current = true
      setDeletionSuspended(true)
      syncEngine.dispose()
    }
    const deletionFailed = (event: Event) => {
      if (demoMode || !user) return
      if ((event as CustomEvent<string>).detail !== user?.uid) return
      deletionSuspendedRef.current = false
      setDeletionSuspended(false)
    }
    window.addEventListener("pagehide", flush)
    window.addEventListener("retomada:pause", flush)
    window.addEventListener("retomada:account-deleting", beforeDelete)
    window.addEventListener("retomada:before-sign-out", beforeSignOut)
    window.addEventListener("retomada:account-deletion-failed", deletionFailed)
    return () => {
      flush()
      workspaceActiveRef.current = false
      unsubscribe()
      window.removeEventListener("pagehide", flush)
      window.removeEventListener("retomada:pause", flush)
      window.removeEventListener("retomada:account-deleting", beforeDelete)
      window.removeEventListener("retomada:before-sign-out", beforeSignOut)
      window.removeEventListener("retomada:account-deletion-failed", deletionFailed)
      syncEngine.dispose()
    }
  }, [syncEngine, user?.uid, demoMode])

  // Load theme, palette, locale and bibleVersion on client side
  useEffect(() => {
    try {
      const savedTheme = storage.getItem("guia-theme") as ThemeMode | null
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        setThemeState(savedTheme)
      }
      const savedPalette = storage.getItem("guia-palette") as ColorPalette | null
      if (savedPalette && ["sage", "terracotta", "blue", "graphite", "olive"].includes(savedPalette)) {
        setPaletteState(savedPalette)
      }
      const savedLocale = storage.getItem(STORAGE_KEY_LOCALE) as Locale | null
      if (savedLocale && ["pt-BR", "en-US"].includes(savedLocale)) {
        setLocaleState(savedLocale)
      }
      const resolvedLocale = savedLocale === "pt-BR" ? "pt-BR" : "en-US"
      const savedBible = storage.getItem(STORAGE_KEY_BIBLE_VERSION) as BibleVersion | null
      const compatible = resolvedLocale === "en-US" ? ["KJV", "NIV"] : ["ARA", "NVT"]
      setBibleVersionState(savedBible && compatible.includes(savedBible) ? savedBible : resolvedLocale === "en-US" ? "KJV" : "ARA")
    } catch {}
  }, [storage])

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
      storage.setItem("guia-theme", nextTheme)
    } catch {}
  }, [storage])

  const setPalette = useCallback((nextPalette: ColorPalette) => {
    setPaletteState(nextPalette)
    try {
      storage.setItem("guia-palette", nextPalette)
    } catch {}
  }, [storage])

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
    try {
      storage.setItem(STORAGE_KEY_LOCALE, nextLocale)
    } catch {}
    // Automatically set matching default bible version if current is incompatible with new locale
    if (nextLocale === "en-US" && !["KJV", "NIV"].includes(bibleVersion)) {
      setBibleVersionState("KJV")
      try {
        storage.setItem(STORAGE_KEY_BIBLE_VERSION, "KJV")
      } catch {}
    } else if (nextLocale === "pt-BR" && !["ARA", "NVT"].includes(bibleVersion)) {
      setBibleVersionState("ARA")
      try {
        storage.setItem(STORAGE_KEY_BIBLE_VERSION, "ARA")
      } catch {}
    }
  }, [bibleVersion, storage])

  const setBibleVersion = useCallback((nextVersion: BibleVersion) => {
    if (!(locale === "en-US" ? ["KJV", "NIV"] : ["ARA", "NVT"]).includes(nextVersion)) return
    setBibleVersionState(nextVersion)
    try {
      storage.setItem(STORAGE_KEY_BIBLE_VERSION, nextVersion)
    } catch {}
  }, [locale, storage])

  const t = useMemo<TranslationDictionary>(() => getDictionary(locale), [locale])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const persist = useCallback(
    (nextWeeks: WeekInstance[], nextActiveId: string | null, nextGuides = guides, nextGuideId = activeGuideId) => {
      if (!workspaceActiveRef.current || !fullAccess || starterPreviewRef.current || storageBlockedRef.current || deletionSuspendedRef.current) return
      syncEngine.scheduleSync(
        {
          schemaVersion: 4,
          locale,
          bibleVersion,
          guides: nextGuides,
          activeGuideId: nextGuideId,
          weeks: nextWeeks,
          activeWeekId: nextActiveId,
          settings: {
            theme,
            palette,
            locale,
            bibleVersion,
          },
        },
        (fullPayload) => {
          storage.setItem(storageKey, JSON.stringify(fullPayload))
          setStorageIssue(null)
        }
      )
    },
    [guides, activeGuideId, locale, bibleVersion, theme, palette, fullAccess, storageKey, storage, syncEngine]
  )

  const retrySync = useCallback(() => {
    if (storageIssue === "unread") { setLoadAttempt((attempt) => attempt + 1); return }
    void syncEngine.flushPendingSync()
  }, [storageIssue, syncEngine])

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

  // Initialize the selected account or memory-only demo adapter with migration to schema v4.
  useEffect(() => {
    let mayPersistInitial = fullAccess
    let startingGuide = createStarterGuide()
    let startingGuides = [startingGuide, ...GUIDE_TEMPLATES]
    let isStarter = true
    try {
      const rawV2 = fullAccess ? storage.getItem(storageKey) : null
      if (rawV2 === null) {
        storageBlockedRef.current = false
        preservedBackupRef.current = null
        setStorageIssue(null)
      }
      if (rawV2 !== null) {
        preservedBackupRef.current = rawV2
        const parsed = JSON.parse(rawV2)
        if (!isValidBackup(parsed)) throw new Error("INVALID_LOCAL_BACKUP")
        const loadedGuides: GuideTemplate[] = Array.isArray(parsed.guides) && parsed.guides.length > 0
          ? upgradeBuiltInGuides(parsed.guides)
          : GUIDE_TEMPLATES
        setGuides(loadedGuides)
        isStarter = false
        starterPreviewRef.current = false
        setStarterIsPreview(false)

        const loadedGuideId = parsed.activeGuideId || DEFAULT_GUIDE_TEMPLATE.id
        setActiveGuideId(loadedGuideId)
        startingGuides = loadedGuides
        startingGuide = loadedGuides.find((guide) => guide.id === loadedGuideId) || loadedGuides[0] || DEFAULT_GUIDE_TEMPLATE_EN

        if (parsed.weeks && parsed.weeks.length > 0) {
          const formattedWeeks: WeekInstance[] = parsed.weeks.map((w: any) => {
            const data = w.data ?? { text: {}, done: {} }
            const rawActs =
              Array.isArray(w.programacao?.activities)
                ? w.programacao.activities
                : getDefaultScheduleActivities()

            const acts = rawActs.map((a: any) => ({
              ...a,
              countsTowardCompletion: a.countsTowardCompletion !== false,
            }))

            const guideId = w.guideId || w.templateId || DEFAULT_GUIDE_TEMPLATE.id
            const guideTpl = loadedGuides.find((g) => g.id === guideId) || DEFAULT_GUIDE_TEMPLATE
            const guideVersion = w.guideVersion || guideTpl.version || 1
            const guideSnapshot = w.guideSnapshot || {
              id: guideTpl.id,
              title: guideTpl.title,
              version: guideVersion,
              completionConfig: guideTpl.completionConfig,
              theologyEnabled: guideTpl.theologyEnabled,
              contentLocale: guideTpl.contentLocale,
              bibleVersion: guideTpl.bibleVersion,
            }
            const snapshotWithSections = { ...guideSnapshot, sections: guideSnapshot.sections || guideTpl.sections }

            return {
              ...w,
              guideId,
              templateId: guideId,
              guideVersion,
              guideSnapshot: snapshotWithSections,
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
          const validActive = typeof parsed.activeWeekId === "string" && sorted.some((w) => w.id === parsed.activeWeekId)
            ? parsed.activeWeekId
            : sorted[0].id
          setActiveWeekId(validActive)
          setActiveGuideId(sorted.find((w) => w.id === validActive)?.guideId ?? loadedGuideId)
          preservedBackupRef.current = null
          storageBlockedRef.current = false
          setStorageIssue(null)
          setReady(true)
          return
        }
      } else if (fullAccess && user) {
        const personalGuide = initialGuideRef.current || readOnboardingGuide(storage, user.uid)
        if (personalGuide) {
          isStarter = personalGuide.id.startsWith("anew-starter-")
          startingGuide = personalGuide
          startingGuides = [personalGuide, ...GUIDE_TEMPLATES]
        }
      }
    } catch {
      mayPersistInitial = false
      storageBlockedRef.current = true
      setStorageIssue(preservedBackupRef.current !== null ? "invalid" : "unread")
    }

      // A safe blank workspace never adopts unassigned legacy browser notes.
      const legacyData: WeekData = { text: {}, done: {} }
      const today = getTodayFormatted()
      const nowIso = new Date().toISOString()
      const defaultActs = startingGuide.weeklyPlan.map((activity) => ({ ...activity }))
      const initialWeek: WeekInstance = {
        id: "week-1",
        guideId: startingGuide.id,
        templateId: startingGuide.id,
        guideVersion: startingGuide.version,
        guideSnapshot: {
          id: startingGuide.id,
          title: startingGuide.title,
          version: startingGuide.version,
          completionConfig: startingGuide.completionConfig,
          theologyEnabled: startingGuide.theologyEnabled,
          contentLocale: startingGuide.contentLocale,
          bibleVersion: startingGuide.bibleVersion,
          sections: startingGuide.sections,
        },
        title: "Week 1",
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

      setGuides(startingGuides)
      starterPreviewRef.current = isStarter
      setStarterIsPreview(isStarter)
      setActiveGuideId(startingGuide.id)
      setWeeks([initialWeek])
      setActiveWeekId("week-1")
      if (mayPersistInitial && !isStarter) {
        let initialSaved = false
        try { storage.setItem(storageKey, JSON.stringify({
          schemaVersion: 4,
          guides: startingGuides,
          activeGuideId: startingGuide.id,
          weeks: [initialWeek],
          activeWeekId: "week-1",
        })); initialSaved = true; setStorageIssue(null) } catch {
          // Retain the initial account write in the same recoverable queue as later edits.
          syncEngine.scheduleSync({ schemaVersion: 4, guides: startingGuides, activeGuideId: startingGuide.id,
            weeks: [initialWeek], activeWeekId: "week-1", locale, bibleVersion,
            settings: { theme, palette, locale, bibleVersion } }, (payload) => {
              storage.setItem(storageKey, JSON.stringify(payload))
              setStorageIssue(null)
              if (user) { try { storage.removeItem(onboardingDraftKey(user.uid)) } catch { /* Saved workspace is authoritative. */ } }
            })
          syncEngine.flushLocalPersist()
        }
        if (initialSaved && user) { try { storage.removeItem(onboardingDraftKey(user.uid)) } catch { /* The saved workspace remains authoritative. */ } }
      }
    setReady(true)
  }, [computeProgress, fullAccess, storageKey, storage, loadAttempt])

  // Sorted weeks chronologically
  const sortedWeeks = useMemo(() => {
    return [...weeks].sort((a, b) =>
      a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
    )
  }, [weeks])

  const activeGuide = useMemo(() => {
    const guide = guides.find((g) => g.id === activeGuideId) || guides[0] || DEFAULT_GUIDE_TEMPLATE_EN
    const week = weeks.find((w) => w.id === activeWeekId && w.guideId === guide.id)
      ?? weeks.find((w) => w.guideId === guide.id)
    return week?.guideSnapshot?.sections ? { ...guide, sections: week.guideSnapshot.sections } : guide
  }, [guides, activeGuideId, weeks, activeWeekId])

  const useStarterWeek = useCallback(() => {
    if (!canEdit || !starterPreviewRef.current) return
    starterPreviewRef.current = false
    setStarterIsPreview(false)
    persist(weeks, activeWeekId, guides, activeGuideId)
  }, [canEdit, persist, weeks, activeWeekId, guides, activeGuideId])

  const selectGuide = useCallback((guideId: string) => {
    if (starterPreviewRef.current) return
    if (!guides.some((g) => g.id === guideId)) return
    const nextWeekId = [...weeks].reverse().find((w) => w.guideId === guideId)?.id ?? null
    setActiveGuideId(guideId)
    setActiveWeekId(nextWeekId)
    persist(weeks, nextWeekId, guides, guideId)
  }, [weeks, activeWeekId, guides, persist])

  const addGuide = useCallback((newGuide: GuideTemplate) => {
    if (!workspaceActiveRef.current || storageBlockedRef.current || deletionSuspendedRef.current || !isValidGuide(newGuide)) return
    const updated = [...guidesRef.current.filter((g) => g.id !== newGuide.id), newGuide]
    starterPreviewRef.current = false
    setStarterIsPreview(false)
    setGuides(updated)
    setActiveGuideId(newGuide.id)
    setActiveWeekId(null)
    persist(weeksRef.current, null, updated, newGuide.id)
  }, [guides, weeks, persist])

  const saveAndActivateGuide = useCallback((newGuide: GuideTemplate) => {
      if (!workspaceActiveRef.current || storageBlockedRef.current || deletionSuspendedRef.current || !isValidGuide(newGuide)) return
      const wasPreview = starterPreviewRef.current
      starterPreviewRef.current = false
      setStarterIsPreview(false)
      const updatedGuides = [...guidesRef.current.filter((g) => g.id !== newGuide.id && (!wasPreview || g.id !== activeGuideId)), newGuide]
      setActiveGuideId(newGuide.id)

      const today = getTodayFormatted()
      const nowIso = new Date().toISOString()
      const endDate = calculateInclusiveEndDate(today)
      const newWeekId = generateWeekId()
      const initialData = { text: {}, done: {} }
      const acts = newGuide.weeklyPlan || getDefaultScheduleActivities()

      const newWeek: WeekInstance = {
        id: newWeekId,
        guideId: newGuide.id,
        templateId: newGuide.id,
        guideVersion: newGuide.version || 1,
        guideSnapshot: {
          id: newGuide.id,
          title: newGuide.title,
          version: newGuide.version || 1,
          completionConfig: newGuide.completionConfig,
          theologyEnabled: newGuide.theologyEnabled,
          contentLocale: newGuide.contentLocale,
          bibleVersion: newGuide.bibleVersion,
          sections: newGuide.sections,
        },
        title: newGuide.contentLocale === "en-US" ? "Week 1" : "Semana 1",
        startDate: today,
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
          activities: acts,
        },
        progresso: computeProgress(initialData, acts),
      }

      const nextWeeks = [...(wasPreview ? [] : weeksRef.current), newWeek]
      setGuides(updatedGuides)
      setWeeks(nextWeeks)
      setActiveWeekId(newWeekId)
      persist(nextWeeks, newWeekId, updatedGuides, newGuide.id)
  }, [guides, weeks, activeGuideId, computeProgress, persist])

  const updateGuideSections = useCallback((nextSections: Section[]) => {
    if (!canEdit) return false
    if (weeks.find((week) => week.id === activeWeekId)?.status === "completed") return false
    const source = guides.find((guide) => guide.id === activeGuideId)
    if (!source) return false
    const revised = reviseGuideSections(source, nextSections)
    if (!revised) return false
    const nextGuides = guides.map((guide) => guide.id === source.id ? revised : guide)
    const now = new Date().toISOString()
    const nextWeeks = weeks.map((week) => week.id === activeWeekId && week.status === "active" ? {
      ...week, guideVersion: revised.version, updatedAt: now,
        guideSnapshot: { ...week.guideSnapshot, id: revised.id, title: revised.title, version: revised.version,
        completionConfig: revised.completionConfig, theologyEnabled: revised.theologyEnabled,
        contentLocale: revised.contentLocale, bibleVersion: revised.bibleVersion, sections: revised.sections },
    } : week)
    starterPreviewRef.current = false
    setStarterIsPreview(false)
    setGuides(nextGuides)
    setWeeks(nextWeeks)
    persist(nextWeeks, activeWeekId, nextGuides, activeGuideId)
    return true
  }, [canEdit, guides, activeGuideId, weeks, activeWeekId, persist])

  const guideWeeks = useMemo(() => sortedWeeks.filter((w) => w.guideId === activeGuideId), [sortedWeeks, activeGuideId])
  const activeWeek = useMemo(() => {
    return guideWeeks.find((w) => w.id === activeWeekId) ?? guideWeeks[0] ?? null
  }, [guideWeeks, activeWeekId])

  const selectWeek = useCallback(
    (id: string) => {
      const target = weeks.find((w) => w.id === id)
      if (!target) return
      setActiveWeekId(id)
      setActiveGuideId(target.guideId)
      setWeeks((prev) => {
        persist(prev, id, guides, target.guideId)
        return prev
      })
    },
    [persist, weeks, guides]
  )

  const createWeek = useCallback(
    (customTitle?: string, customStartDate?: string, templateId = activeGuideId) => {
      let startDate = customStartDate?.trim() || ""
      if (startDate && !isValidDate(startDate)) return
      if (customTitle !== undefined && customTitle.trim().length > 500) return

      setWeeks((prevWeeks) => {
        const sorted = prevWeeks.filter((w) => w.guideId === templateId).sort((a, b) =>
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
        if (!isValidDate(startDate) || !isValidDate(endDate)) return prevWeeks
        const weekNumber = sorted.length + 1
        const title = customTitle?.trim() || `${locale === "en-US" ? "Week" : "Semana"} ${weekNumber}`
        const newId = generateWeekId()
        const nowIso = new Date().toISOString()
        const initialData = { text: {}, done: {} }
        const defaultActs = getDefaultScheduleActivities()

        const targetGuide = guides.find((g) => g.id === templateId) || activeGuide || DEFAULT_GUIDE_TEMPLATE
        const newWeek: WeekInstance = {
          id: newId,
          guideId: targetGuide.id,
          templateId: targetGuide.id,
          guideVersion: targetGuide.version || 1,
          guideSnapshot: {
            id: targetGuide.id,
            title: targetGuide.title,
            version: targetGuide.version || 1,
            completionConfig: targetGuide.completionConfig,
            theologyEnabled: targetGuide.theologyEnabled,
            contentLocale: targetGuide.contentLocale,
            bibleVersion: targetGuide.bibleVersion,
            sections: targetGuide.sections,
          },
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
            activities: targetGuide.weeklyPlan || defaultActs,
          },
          progresso: computeProgress(initialData, targetGuide.weeklyPlan || defaultActs),
        }

        const updatedWeeks = [...prevWeeks, newWeek].sort((a, b) =>
          a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
        )

        setActiveWeekId(newId)
        setActiveGuideId(targetGuide.id)
        persist(updatedWeeks, newId, guides, targetGuide.id)
        return updatedWeeks
      })
    },
    [guides, activeGuide, activeGuideId, locale, computeProgress, persist]
  )

  const deleteWeek = useCallback(
    (id: string) => {
      setWeeks((prevWeeks) => {
        const remaining = prevWeeks.filter((w) => w.id !== id)
        if (remaining.length === 0) {
          const today = getTodayFormatted()
          const nowIso = new Date().toISOString()
          const emptyData = { text: {}, done: {} }
          const defaultActs = activeGuide.weeklyPlan.map((activity) => ({ ...activity }))
          const defaultWeek: WeekInstance = {
            id: generateWeekId(),
            guideId: activeGuide.id,
            templateId: activeGuide.id,
            guideVersion: activeGuide.version,
            guideSnapshot: {
              id: activeGuide.id,
              title: activeGuide.title,
              version: activeGuide.version,
              completionConfig: activeGuide.completionConfig,
              theologyEnabled: activeGuide.theologyEnabled,
              contentLocale: activeGuide.contentLocale,
              bibleVersion: activeGuide.bibleVersion,
              sections: activeGuide.sections,
            },
            title: locale === "en-US" ? "Week 1" : "Semana 1",
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
          const nextActiveId = currentActive === id ? sortedRemaining.find((w) => w.guideId === activeGuideId)?.id ?? null : currentActive
          persist(sortedRemaining, nextActiveId)
          return nextActiveId
        })

        return sortedRemaining
      })
    },
    [computeProgress, persist, activeGuide, activeGuideId, locale]
  )

  const updateWeekMeta = useCallback(
    (id: string, updates: { title?: string; startDate?: string }) => {
      if (updates.startDate && !isValidDate(updates.startDate)) return
      if (updates.startDate && !isValidDate(calculateInclusiveEndDate(updates.startDate))) return
      if (updates.title !== undefined && updates.title.length > 500) return
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
    async (weekId: string, aiConsent = false, includeTextAnswers = false) => {
      if (demoMode) {
        setAiError("AI is unavailable in demo mode. No information is sent to a provider.")
        return
      }
      if (!fullAccess) return
      if (!aiConsent) {
        setAiError(locale === "en-US" ? "Your permission is required before sending data to Google Gemini." : "Seu consentimento é necessário antes de enviar dados ao Google Gemini.")
        return
      }
      if (isGeneratingAI) return
      const targetWeek = weeks.find((w) => w.id === weekId)
      if (!targetWeek || targetWeek.status !== "completed") return
      const requestSnapshot = createSnapshot(targetWeek)
      const requestUpdatedAt = targetWeek.updatedAt

      setIsGeneratingAI(true)
      setAiError(null)

      const snap = targetWeek.guideSnapshot
      const guideSnapshotConfig = snap?.completionConfig || activeGuide.completionConfig
      // Use snapshot values for theology/locale isolation (invariants #8, #9, #17)
      const weekTheologyEnabled = snap?.theologyEnabled === true && activeGuide.theologyEnabled === true
      const weekContentLocale = snap?.contentLocale || activeGuide.contentLocale || locale

      try {
        const reviewUrl = apiUrl("/api/analyze-week")
        if (!reviewUrl) throw new Error("The AI service is not available in this app yet. You can continue using your local guide.")
        const authToken = await getAuthToken()
        const res = await fetch(reviewUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            aiConsent: true,
            guideTitle: snap?.title || activeGuide.title,
            weekTitle: targetWeek.title,
            startDate: targetWeek.startDate,
            endDate: targetWeek.endDate,
            snapshot: requestSnapshot,
            textAnswers: includeTextAnswers ? targetWeek.data.text : {},
            theologyEnabled: weekTheologyEnabled,
            completionConfig: guideSnapshotConfig,
            contentLocale: weekContentLocale,
          }),
        })

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}))
          throw new Error(errJson.error || "The AI service could not complete this review.")
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
              aiReviewOutdated: w.updatedAt !== requestUpdatedAt,
            }
          })
          persist(next, activeWeekId)
          return next
        })
      } catch (err: any) {
        setAiError(err?.message || "The review is unavailable right now.")
      } finally {
        setIsGeneratingAI(false)
      }
    },
    [weeks, activeWeekId, activeGuide, locale, isGeneratingAI, fullAccess, demoMode, persist, createSnapshot]
  )

  // Complete Week Handler
  const completeWeek = useCallback(
    async (id: string) => {
      setWeeks((prev) => {
        const nowIso = new Date().toISOString()
        const next = prev.map((w) => {
          if (w.id !== id) return w
          const snapshot = createSnapshot(w)
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

    },
    [createSnapshot, activeWeekId, persist]
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
    return guideWeeks.findIndex((w) => w.id === activeWeek.id)
  }, [guideWeeks, activeWeek])

  const hasPrevWeek = activeIndex > 0
  const hasNextWeek = activeIndex >= 0 && activeIndex < guideWeeks.length - 1

  const prevWeek = useCallback(() => {
    if (hasPrevWeek) {
      const prevId = guideWeeks[activeIndex - 1].id
      selectWeek(prevId)
    }
  }, [hasPrevWeek, guideWeeks, activeIndex, selectWeek])

  const nextWeek = useCallback(() => {
    if (hasNextWeek) {
      const nextId = guideWeeks[activeIndex + 1].id
      selectWeek(nextId)
    }
  }, [hasNextWeek, guideWeeks, activeIndex, selectWeek])

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
      if (value.length > 100000) return
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
      if (!description.trim() || !isValidActivity({ id: "new-activity", dayIndex, time: time.trim() || "12:00", description: description.trim(), order: 0, countsTowardCompletion })) return
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
      const current = activeWeek.programacao.activities.find((activity) => activity.id === id)
      if (!current || !isValidActivity({ ...current, ...updates }) || updates.description !== undefined && !updates.description.trim()) return
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
              ...(updates.dayIndex !== undefined && updates.dayIndex !== act.dayIndex && updates.order === undefined && {
                order: Math.max(-1, ...currentActivities.filter((other) => other.dayIndex === updates.dayIndex && other.id !== id).map((other) => other.order)) + 1,
              }),
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
          const currentActivities = (w.programacao?.activities || []).map((activity) => ({ ...activity }))
          const targetAct = currentActivities.find((a) => a.id === id)
          if (!targetAct) return w

          const dayActivities = currentActivities
            .filter((a) => a.dayIndex === targetAct.dayIndex)
            .sort((a, b) => a.order - b.order || a.time.localeCompare(b.time))

          const currentIndex = dayActivities.findIndex((a) => a.id === id)
          if (currentIndex === -1) return w

          const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
          if (targetIndex < 0 || targetIndex >= dayActivities.length) return w

          // Normalize imported equal ranks so every move produces a visible new order.
          dayActivities.splice(currentIndex, 1)
          dayActivities.splice(targetIndex, 0, targetAct)
          dayActivities.forEach((activity, index) => { activity.order = index })

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
          progresso: computeProgress({ text: {}, done: {} }, w.programacao.activities),
          updatedAt: new Date().toISOString(),
          aiReviewOutdated: w.status === "completed" ? true : w.aiReviewOutdated,
        }
      })
      persist(nextWeeks, currentWeekId)
      return nextWeeks
    })
  }, [activeWeek, computeProgress, persist])

  const exportToMarkdown = useCallback(async () => {
    if (!activeWeek) return
    setAiError(null)
    const guideTitle = activeWeek.guideSnapshot?.title || activeGuide.title
    const rangeStr = formatDateRangeLocale(activeWeek.startDate, activeWeek.endDate, locale)
    const isEn = locale === "en-US"

    let md = `# ${guideTitle}\n`
    md += `## ${activeWeek.title} (${rangeStr})\n\n`
    md += `**${isEn ? "Status" : "Status"}:** ${activeWeek.status === "completed" ? (isEn ? "Completed" : "Concluída") : (isEn ? "In progress" : "Em andamento")}\n`
    if (activeWeek.completedAt) {
      md += `**${isEn ? "Completed on" : "Concluída em"}:** ${new Date(activeWeek.completedAt).toLocaleString(locale)}\n`
    }
    md += `**${isEn ? "Created on" : "Data de Criação"}:** ${new Date(activeWeek.createdAt).toLocaleDateString(locale)}\n`
    md += `**${isEn ? "Week Progress" : "Progresso da Semana"}:** ${activeWeek.progresso.concluidas} ${isEn ? "of" : "de"} ${activeWeek.progresso.total} ${isEn ? "tasks completed" : "tarefas concluídas"} (${activeWeek.progresso.percentual}%)\n\n`

    if (activeWeek.aiReview) {
      md += `---\n\n`
      md += `### ${isEn ? "Optional AI reflection" : "Reflexão opcional com IA"}\n\n`
      md += `**${isEn ? "Reflection" : "Reflexão"}:** ${activeWeek.aiReview.verdict}\n\n`
      md += `**${isEn ? "Summary" : "Resumo"}:** ${activeWeek.aiReview.summary}\n\n`
      md += `**${isEn ? "What worked well" : "O que funcionou bem"}:\n`
      activeWeek.aiReview.whatWorked.forEach((item) => (md += `- ${item}\n`))
      md += `\n**${isEn ? "Observed difficulties" : "Dificuldades observadas"}:\n`
      activeWeek.aiReview.difficulties.forEach((item) => (md += `- ${item}\n`))
      md += `\n**${isEn ? "Identified patterns" : "Padrões observados"}:\n`
      activeWeek.aiReview.observedPatterns.forEach((item) => (md += `- ${item}\n`))
      md += `\n**${isEn ? "Suggestions for next cycle" : "Sugestões para a próxima semana"}:\n`
      activeWeek.aiReview.nextWeekSuggestions.forEach((item) => (md += `- ${item}\n`))
      md += `\n`
    }

    md += `---\n\n`
    md += `### ${isEn ? "Weekly Activity Schedule" : "Programação Semanal de Atividades"}\n\n`
    const days = getWeekDays(activeWeek.startDate, locale)
    const activities = activeWeek.programacao?.activities || []

    days.forEach((day) => {
      md += `#### ${day.dayNumberLabel} (${day.formattedShort})\n`
      const dayActs = activities
        .filter((a) => a.dayIndex === day.dayIndex)
        .sort((a, b) => a.order - b.order || a.time.localeCompare(b.time))

      if (dayActs.length === 0) {
        md += `*${isEn ? "No activities scheduled" : "Sem atividades cadastradas"}*\n\n`
      } else {
        dayActs.forEach((act) => {
          const done = activeWeek.data.done[act.id] ? "[X]" : "[ ]"
          const extra = act.countsTowardCompletion === false ? (isEn ? " (Informational)" : " (Informativa)") : ""
          md += `- ${done} **${act.time}** — ${act.description}${extra}\n`
        })
        md += `\n`
      }
    })

    md += `---\n\n`
    md += `### ${isEn ? "Guide Records & Responses" : "Registros e Respostas do Guia"}\n\n`
    activeGuide.sections.forEach((s) => {
      md += `#### ${isEn ? "Section" : "Seção"} ${s.number}: ${s.title}\n\n`
      s.blocks.forEach((block) => {
        if (block.type === "fields" && block.fields) {
          if (block.title) md += `##### ${block.title}\n\n`
          block.fields.forEach((field) => {
            if (field.kind === "static") return
            const val = activeWeek.data.text[field.id] || (isEn ? "*Not filled*" : "*Não preenchido*")
            const label = field.label || field.id
            md += `**${label}:**\n> ${val.replace(/\n/g, "\n> ")}\n\n`
          })
        } else if (block.type === "ladder" && block.rows) {
          block.rows.forEach((row) => {
            const nota = activeWeek.data.text[`${row.id}-nota`] || "-"
            const feito = activeWeek.data.done[row.id] ? "[X]" : "[ ]"
            md += `- ${feito} **${row.label}** — ${isEn ? "Target difficulty" : "Nota prevista"}: ${nota}\n`
          })
          md += `\n`
        }
      })
    })

    // Scripture Attribution notice if applicable
    if (activeGuide.theologyEnabled) {
      const notice = BibleProvider.getAttributionNotice(bibleVersion, locale)
      if (notice) {
        md += `---\n\n*${notice}*\n`
      }
    }

    try {
      await saveTextFile(`${guideTitle.replace(/\s+/g, "_")}_${activeWeek.title.replace(/\s+/g, "_")}.md`, md, "text/markdown")
    } catch {
      setAiError(isEn ? "The file could not be saved or shared. Try again, and keep your guide open until you have a backup." : "Não foi possível salvar ou compartilhar o arquivo. Tente novamente e mantenha o guia aberto até ter um backup.")
    }
  }, [activeWeek, activeGuide, locale, bibleVersion])

  const exportWeekJSON = useCallback(async () => {
    if (!activeWeek) return
    setAiError(null)
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
      schemaVersion: 4,
      exportedAt: new Date().toISOString(),
      guide: {
        id: activeWeek.guideId || activeGuide.id,
        title: activeWeek.guideSnapshot?.title || activeGuide.title,
        version: activeWeek.guideVersion || activeGuide.version,
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
    try {
      await saveTextFile(`Retomada_Week_${activeWeek.title.replace(/\s+/g, "_")}_${activeWeek.startDate}.json`, jsonStr)
    } catch {
      setAiError(locale === "en-US" ? "The file could not be saved or shared. Try again, and keep your guide open until you have a backup." : "Não foi possível salvar ou compartilhar o arquivo. Tente novamente e mantenha o guia aberto até ter um backup.")
    }
  }, [activeWeek, activeGuide, locale])

  const exportToJSON = useCallback(async () => {
    setAiError(null)
    const exportData = {
      schemaVersion: 4,
      locale,
      bibleVersion,
      exportedAt: new Date().toISOString(),
      theme,
      palette,
      activeGuideId,
      guides,
      activeWeekId,
      weeks,
    }
    // Download the unmodified original while an invalid saved backup is protected.
    try {
      const jsonStr = storageBlockedRef.current
        ? preservedBackupRef.current ?? storage.getItem(storageKey)
        : JSON.stringify(exportData, null, 2)
      if (jsonStr === null) throw new Error("NO_READABLE_BACKUP")
      await saveTextFile(`Retomada_Backup_${new Date().toISOString().split("T")[0]}.json`, jsonStr)
    } catch {
      setAiError(locale === "en-US" ? "The backup could not be saved or shared. Try again, and keep this window open until the backup is saved." : "Não foi possível salvar ou compartilhar o backup. Tente novamente e mantenha esta janela aberta até salvar o arquivo.")
    }
  }, [weeks, activeWeekId, theme, palette, activeGuideId, guides, locale, bibleVersion, storage, storageKey])

  const importFromJSON = useCallback(
    (jsonData: string) => {
      try {
        if (jsonData.length > 10 * 1024 * 1024) return false
        const parsed = JSON.parse(jsonData)
        if (!isValidBackup(parsed)) {
          return false
        }

        const loadedGuides: GuideTemplate[] = Array.isArray(parsed.guides) && parsed.guides.length > 0
          ? upgradeBuiltInGuides(parsed.guides)
          : GUIDE_TEMPLATES
        const loadedGuideId = parsed.activeGuideId || DEFAULT_GUIDE_TEMPLATE.id

        const importedGuide = loadedGuides.find((guide) => guide.id === loadedGuideId) || loadedGuides[0] || DEFAULT_GUIDE_TEMPLATE_EN
        const importDate = getTodayFormatted()
        // A valid empty backup becomes one blank week before any state is changed.
        const sourceWeeks = parsed.weeks.length > 0 ? parsed.weeks : [{
          id: generateWeekId(), guideId: importedGuide.id, templateId: importedGuide.id,
          title: "Week 1", startDate: importDate, endDate: calculateInclusiveEndDate(importDate),
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          data: { text: {}, done: {} }, programacao: { dias: 7, activities: importedGuide.weeklyPlan },
        }]
        const formattedWeeks: WeekInstance[] = sourceWeeks.map((w: any) => {
          const guideId = w.guideId || w.templateId || DEFAULT_GUIDE_TEMPLATE.id
          const guideTpl = loadedGuides.find((g) => g.id === guideId) || DEFAULT_GUIDE_TEMPLATE
          const guideVersion = w.guideVersion || guideTpl.version || 1
          const guideSnapshot = w.guideSnapshot || {
            id: guideTpl.id,
            title: guideTpl.title,
            version: guideVersion,
            completionConfig: guideTpl.completionConfig,
            theologyEnabled: guideTpl.theologyEnabled,
            contentLocale: guideTpl.contentLocale,
            bibleVersion: guideTpl.bibleVersion,
          }

          return {
            ...w,
            guideId,
            templateId: guideId,
            guideVersion,
            guideSnapshot: { ...guideSnapshot, sections: guideSnapshot.sections || guideTpl.sections },
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
            progresso: computeProgress(w.data, w.programacao?.activities || getDefaultScheduleActivities()),
          }
        })

        // Complete validation and normalization before changing any state or allowing writes.
        storageBlockedRef.current = false
        starterPreviewRef.current = false
        setStarterIsPreview(false)
        preservedBackupRef.current = null
        setStorageIssue(null)
        setGuides(loadedGuides)
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
        if (parsed.locale && ["pt-BR", "en-US"].includes(parsed.locale)) {
          setLocale(parsed.locale)
        }
        const importedLocale = parsed.locale === "pt-BR" || parsed.locale === "en-US" ? parsed.locale : locale
        const bibleChoices = importedLocale === "en-US" ? ["KJV", "NIV"] : ["ARA", "NVT"]
        const importedBible = parsed.bibleVersion && bibleChoices.includes(parsed.bibleVersion)
          ? parsed.bibleVersion : importedLocale === "en-US" ? "KJV" : "ARA"
        setBibleVersionState(importedBible)
        try { storage.setItem(STORAGE_KEY_BIBLE_VERSION, importedBible) } catch {}
        const importedWeekId = parsed.activeWeekId && formattedWeeks.some((w) => w.id === parsed.activeWeekId) ? parsed.activeWeekId : formattedWeeks[0].id
        const importedGuideId = formattedWeeks.find((w) => w.id === importedWeekId)?.guideId || loadedGuideId
        setActiveGuideId(importedGuideId)
        persist(formattedWeeks, importedWeekId, loadedGuides, importedGuideId)
        return true
      } catch {
        return false
      }
    },
    [persist, computeProgress, setTheme, setPalette, setLocale, locale, storage]
  )

  const clearAllLocalData = useCallback(() => {
    if (demoMode) { syncEngine.dispose(); demo.resetDemo(); return }
    if (!fullAccess) return
    syncEngine.dispose()
    // Only this account's notes and shared appearance preferences; other accounts stay intact.
    const ownedKeys = [storageKey, "guia-theme", "guia-palette", "guia-locale", "guia-bible-version", "anew-gentle-sound", `guia-novo-draft:${user?.uid}`, `guia-resource-favorites:${user?.uid}`, `anew-planner-tour:${user?.uid}:v1`]
    if (user) ownedKeys.push(onboardingDraftKey(user.uid))
    for (const key of ownedKeys) storage.removeItem(key)
    window.location.reload()
  }, [syncEngine, fullAccess, storageKey, storage, user?.uid, demoMode, demo])

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      guides,
      activeGuide,
      activeGuideId,
      selectGuide,
      addGuide: canEdit ? addGuide : () => {},
      saveAndActivateGuide: canEdit ? saveAndActivateGuide : () => {},
      updateGuideSections,
      starterIsPreview,
      useStarterWeek,
      weeks: sortedWeeks,
      activeWeek,
      activeWeekId: activeWeek?.id ?? null,
      selectWeek,
      createWeek: canEdit ? (...args) => { useStarterWeek(); createWeek(...args) } : () => {},
      deleteWeek: canEdit ? (...args) => { useStarterWeek(); deleteWeek(...args) } : () => {},
      updateWeekMeta: canEdit ? (...args) => { useStarterWeek(); updateWeekMeta(...args) } : () => {},
      completeWeek: canEdit ? (...args) => { useStarterWeek(); return completeWeek(...args) } : async () => {},
      reopenWeek: canEdit ? (...args) => { useStarterWeek(); reopenWeek(...args) } : () => {},
      generateAIReview: canEdit ? generateAIReview : async () => {},
      isGeneratingAI,
      aiError,
      prevWeek,
      nextWeek,
      hasPrevWeek,
      hasNextWeek,
      getText,
      setText: canEdit ? (...args) => { useStarterWeek(); setText(...args) } : () => {},
      isDone,
      toggleDone: canEdit ? (...args) => { useStarterWeek(); toggleDone(...args) } : () => {},
      doneCount,
      resetActiveWeek: canEdit ? () => { useStarterWeek(); resetActiveWeek() } : () => {},
      addScheduleActivity: canEdit ? (...args) => { useStarterWeek(); addScheduleActivity(...args) } : () => {},
      updateScheduleActivity: canEdit ? (...args) => { useStarterWeek(); updateScheduleActivity(...args) } : () => {},
      deleteScheduleActivity: canEdit ? (...args) => { useStarterWeek(); deleteScheduleActivity(...args) } : () => {},
      moveScheduleActivity: canEdit ? (...args) => { useStarterWeek(); moveScheduleActivity(...args) } : () => {},
      theme,
      setTheme,
      palette,
      setPalette,
      locale,
      setLocale,
      bibleVersion,
      setBibleVersion,
      t,
      saveStatus,
      storageWarning,
      storageReadOnly,
      retrySync,
      exportToMarkdown,
      exportWeekJSON,
      exportToJSON,
      importFromJSON: fullAccess ? importFromJSON : () => false,
      clearAllLocalData,
    }),
    [
      ready,
      guides,
      activeGuide,
      activeGuideId,
      selectGuide,
      addGuide,
      saveAndActivateGuide,
      updateGuideSections,
      starterIsPreview,
      useStarterWeek,
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
      locale,
      setLocale,
      bibleVersion,
      setBibleVersion,
      t,
      saveStatus,
      retrySync,
      exportToMarkdown,
      exportWeekJSON,
      exportToJSON,
      importFromJSON,
      clearAllLocalData,
      fullAccess,
      canEdit,
      storageWarning,
      storageReadOnly,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
