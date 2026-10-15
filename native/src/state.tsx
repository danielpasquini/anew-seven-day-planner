import { nativeAIConfigured } from "./ai"
import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { DEFAULT_GUIDE_TEMPLATE_EN, type GuideTemplate, type Section } from "../../lib/guide-data"
import { isValidActivity, isValidDate, isValidGuide } from "../../lib/backup-validation"
import { calculateInclusiveEndDate, getTodayFormatted } from "../../lib/date-utils"
import { buildPersonalizedGuide, hasOnboardingAnswers, type OnboardingAnswers } from "../../lib/onboarding"
import { createStarterGuide } from "../../lib/planner"
import { createPlannedWeekInWorkspace, setupFromPreviousWeek, updateWeekPlanInWorkspace, updateWeekSetupInWorkspace } from "../../lib/week-planning"
import type { WeekSetup } from "../../lib/week-setup"
import type { DemoScenario } from "../../lib/demo-data"
import { blankWeek, clearNativeGuideDraft, copy, createBlankWorkspace, createNativeDemoWorkspace, NativeGuideDraftStorage, NativeWorkspaceStorage, newId, parseNativeWorkspace, readNativeGuideDraft, recalculateWeek, scopedPreviewGuide, visibleNativeWorkspace, workspaceStorageKey, type Activity, type NativeWeek, type NativeWorkspace } from "./workspace"
import { useNativeAuth } from "./session"
export { NativeAuthProvider, useNativeAuth } from "./session"

type NativeAppValue = {
  ready: boolean; demo: boolean; demoAvailable: boolean; canEdit: boolean; error: string | null; saveStatus: "idle" | "saving" | "saved" | "memory" | "error"
  demoScenario: DemoScenario | null; demoJourneyPending: boolean; demoEpoch: number
  storageWarning: string | null; previewGuide: GuideTemplate; guides: GuideTemplate[]; activeGuide: GuideTemplate; weeks: NativeWeek[]; activeWeek: NativeWeek
  theme: "light" | "dark"; setTheme(value: "light" | "dark"): void; onboardingSeen: boolean
  personalize(guide: GuideTemplate): void; completeOnboarding(answers: OnboardingAnswers): void
  starterIsPreview: boolean; useStarterWeek(): void; updateWeekSections(sections: Section[]): boolean
  createPlannedWeek(setup: WeekSetup, title?: string, startDate?: string): boolean
  updateWeekSetup(weekId: string, setup: WeekSetup): boolean
  chooseGuide(id: string): void; chooseWeek(id: string): void; createWeek(title?: string, startDate?: string, guideId?: string): void
  updateWeek(id: string, patch: { title?: string; startDate?: string }): void; deleteWeek(id: string): void
  getText(id: string): string; setText(id: string, value: string): void; isDone(id: string): boolean; toggleDone(id: string): void
  addActivity(activity: Omit<Activity, "id" | "order">): void; updateActivity(id: string, patch: Partial<Activity>): void; deleteActivity(id: string): void
  completeWeek(id?: string): void; reopenWeek(id?: string): void; setWeekSpirituality(enabled: boolean): void
  exportBackup(): string; importBackup(value: string): boolean; resourceFavorites: string[]; toggleResourceFavorite(id: string): void
  startDemo(guide?: GuideTemplate, scenario?: DemoScenario): Promise<boolean>; resetDemo(): void; exitDemo(): void; clearLocalData(): Promise<void>; clearError(): void
  aiAvailable: boolean
}
const NativeAppContext = createContext<NativeAppValue | null>(null)
type WorkspaceControl = { mode: "preview" | "demo" | "account"; owner: string | null; epoch: number; readonly: boolean; suspended: boolean }

export function NativeAppProvider({ children }: { children: ReactNode }) {
  const auth = useNativeAuth()
  const { registerDeletionHandlers, setDemoActive } = auth
  const authRef = useRef(auth); authRef.current = auth
  const initial = useRef(createBlankWorkspace())
  const [workspaceView, setWorkspaceView] = useState<{ workspace: NativeWorkspace; owner: string | null }>({ workspace: initial.current, owner: null })
  const workspace = workspaceView.workspace
  const workspaceRef = useRef(workspace)
  const workspaceOwnerRef = useRef<string | null>(null)
  const [ready, setReady] = useState(false)
  const [demo, setDemo] = useState(false)
  const [demoScenario, setDemoScenario] = useState<DemoScenario | null>(null)
  const [demoJourneyPending, setDemoJourneyPending] = useState(false)
  const [demoEpoch, setDemoEpoch] = useState(0)
  const [previewGuide, setPreviewGuide] = useState(createStarterGuide)
  const previewRef = useRef(previewGuide)
  const previewOwner = useRef<string | null>(null)
  const demoSeed = useRef<GuideTemplate | undefined>(undefined)
  const [onboardingSeen, setOnboardingSeen] = useState(false)
  const [onboardingLoaded, setOnboardingLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storageWarning, setStorageWarning] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<NativeAppValue["saveStatus"]>("idle")
  const [suspended, setSuspended] = useState(false)
  const storage = useRef<NativeWorkspaceStorage | null>(null)
  const preservedRaw = useRef<string | null>(null)
  const control = useRef<WorkspaceControl>({ mode: "preview", owner: null, epoch: 0, readonly: false, suspended: false })
  const accountUid = !auth.testingHost && auth.status === "authenticated" && auth.user?.emailVerified && auth.legalAccepted ? auth.user.uid : null
  const demoAvailable = process.env.EXPO_PUBLIC_ENABLE_DEMO === "true"
  const safePreviewGuide = scopedPreviewGuide(previewGuide, previewOwner.current, auth.user?.uid ?? null)
  const previewMatchesOwner = control.current.mode !== "preview" || previewOwner.current === null || previewOwner.current === (auth.user?.uid ?? null)
  const visibleWorkspace = (previewMatchesOwner ? visibleNativeWorkspace(workspace, workspaceView.owner, accountUid) : null) ?? createBlankWorkspace(safePreviewGuide)

  const display = useCallback((next: NativeWorkspace) => {
    workspaceRef.current = next
    workspaceOwnerRef.current = control.current.mode === "account" ? control.current.owner : null
    setWorkspaceView({ workspace: next, owner: workspaceOwnerRef.current })
  }, [])
  const canChange = useCallback(() => {
    const current = control.current
    if (current.readonly || current.suspended) return false
    if (current.mode === "demo") return true
    const currentAuth = authRef.current
    return current.mode === "account" && !currentAuth.testingHost && currentAuth.status === "authenticated" && currentAuth.user?.uid === current.owner && currentAuth.user.emailVerified && currentAuth.legalAccepted
  }, [])
  const ownsAuthenticatedWorkspace = useCallback(() => {
    const current = authRef.current
    return control.current.mode === "account" && !current.testingHost && current.status === "authenticated" && current.user?.uid === control.current.owner && current.user.emailVerified && current.legalAccepted
  }, [])
  const save = useCallback((next: NativeWorkspace, replace = false) => {
    const current = control.current
    if (current.mode !== "account" || !storage.current) { setSaveStatus(current.mode === "demo" ? "memory" : "idle"); return }
    const epoch = current.epoch
    setSaveStatus("saving")
    void (replace ? storage.current.replace(next) : storage.current.save(next)).then((saved) => {
      if (control.current.epoch !== epoch) return
      setSaveStatus(saved ? "saved" : "error")
      if (!saved) setStorageWarning("Device storage could not save your changes. Export a backup before closing the app.")
      else setStorageWarning(null)
    })
  }, [])
  const mutate = useCallback((change: (current: NativeWorkspace) => NativeWorkspace, acceptStarter = false) => {
    if (!canChange()) return
    if (workspaceRef.current.starterPreview && !acceptStarter) return
    const next = change(copy(workspaceRef.current))
    if (!parseNativeWorkspace(JSON.stringify(next))) { setError("This change could not be applied. Check the values and try again."); return }
    display(next); save(next)
  }, [canChange, display, save])

  useEffect(() => {
    let active = true
    // Presentation preference only: no questionnaire answers or journal content.
    void AsyncStorage.getItem("anew-native-journey-seen-v1").then((value) => {
      if (active) setOnboardingSeen(value === "seen")
    }).catch(() => {}).finally(() => { if (active) setOnboardingLoaded(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (auth.user && previewOwner.current === null && previewRef.current.id !== DEFAULT_GUIDE_TEMPLATE_EN.id) previewOwner.current = auth.user.uid
  }, [auth.user])

  useEffect(() => {
    if (demo || auth.testingHost || auth.pending || auth.status !== "authenticated" || !auth.user || !auth.legalAccepted || auth.user.emailVerified) return
    if (previewOwner.current !== null && previewOwner.current !== auth.user.uid) return
    previewOwner.current = auth.user.uid
    if (previewRef.current.id === DEFAULT_GUIDE_TEMPLATE_EN.id) return
    const staging = new NativeGuideDraftStorage(AsyncStorage, auth.user.uid)
    void staging.stage(previewRef.current)
    return () => staging.revoke()
  }, [demo, auth.testingHost, auth.pending, auth.status, auth.user, auth.legalAccepted, previewGuide])

  useEffect(() => {
    const epoch = ++control.current.epoch
    storage.current?.revoke(); storage.current = null
    if (demo) { control.current = { mode: "demo", owner: null, epoch, readonly: false, suspended: false }; setReady(true); return }
    control.current = { mode: accountUid ? "account" : "preview", owner: accountUid, epoch, readonly: accountUid !== null, suspended: false }
    setSuspended(false); setStorageWarning(null); preservedRaw.current = null
    const seed = scopedPreviewGuide(previewRef.current, previewOwner.current, authRef.current.user?.uid ?? null)
    if (!accountUid) { display(createBlankWorkspace(seed)); setReady(true); setSaveStatus("idle"); return }
    if (previewOwner.current === null) previewOwner.current = accountUid
    setReady(false)
    const adapter = new NativeWorkspaceStorage(AsyncStorage, accountUid)
    storage.current = adapter
    void adapter.load().then(async (result) => {
      if (control.current.epoch !== epoch || result.kind === "revoked") return
      if (result.kind === "ready") { control.current.readonly = false; display(result.workspace); setSaveStatus("saved") }
      else if (result.kind === "empty") {
        const staged = await readNativeGuideDraft(AsyncStorage, accountUid)
        if (control.current.epoch !== epoch) return
        control.current.readonly = false
        const next = createBlankWorkspace(staged ?? seed)
        next.starterPreview = true
        display(next); setSaveStatus("idle")
      } else {
        control.current.readonly = true
        preservedRaw.current = result.raw ?? null
        display(createBlankWorkspace(seed)); setSaveStatus("error")
        setStorageWarning(result.kind === "invalid" ? "The saved backup could not be read. Its original contents are preserved and editing is paused. Export the original, import a valid backup, or clear this account's local records." : "Device storage could not be read. Access stays limited to protect existing records. Try again or export a backup.")
      }
      setReady(true)
    })
    return () => { adapter.revoke() }
  }, [accountUid, auth.user?.uid, demo, display, save])

  useEffect(() => {
    let preparedEpoch: number | null = null
    return registerDeletionHandlers({
    async prepare() {
      if (control.current.mode === "demo") return false
      const epoch = control.current.epoch
      const adapter = storage.current
      preparedEpoch = epoch
      control.current.suspended = true; setSuspended(true)
      if (adapter && !(await adapter.flush())) {
        if (control.current.epoch === epoch) { control.current.suspended = false; setSuspended(false) }
        preparedEpoch = null
        return false
      }
      if (control.current.epoch !== epoch) { preparedEpoch = null; return false }
      return true
    },
    resume() { if (preparedEpoch === control.current.epoch) { control.current.suspended = false; setSuspended(false) }; preparedEpoch = null },
    async removeLocal(uid) {
      const results = await Promise.allSettled([
        clearNativeGuideDraft(AsyncStorage, uid),
        storage.current?.key === workspaceStorageKey(uid) ? storage.current.remove() : AsyncStorage.removeItem(workspaceStorageKey(uid)),
      ])
      if (results.some((result) => result.status === "rejected")) throw new Error("LOCAL_CLEANUP_FAILED")
    },
    })
  }, [registerDeletionHandlers])
  useEffect(() => () => setDemoActive(false), [setDemoActive])

  const personalize = useCallback((guide: GuideTemplate) => {
    if (authRef.current.pending) return
    if (!isValidGuide(guide)) { setError("This weekly plan could not be opened."); return }
    const ownGuide = copy(guide)
    if (!canChange()) { previewOwner.current = authRef.current.user?.uid ?? null; previewRef.current = ownGuide; setPreviewGuide(ownGuide); display(createBlankWorkspace(ownGuide)); return }
    mutate((current) => {
      const week = blankWeek(ownGuide)
      return { ...current, starterPreview: false, guides: current.starterPreview ? [ownGuide] : [...current.guides.filter((item) => item.id !== ownGuide.id), ownGuide], activeGuideId: ownGuide.id, weeks: current.starterPreview ? [week] : [...current.weeks, week], activeWeekId: week.id }
    }, true)
  }, [canChange, display, mutate])
  const completeOnboarding = (answers: OnboardingAnswers) => {
    if (control.current.mode === "demo") {
      const next = createBlankWorkspace(hasOnboardingAnswers(answers) ? buildPersonalizedGuide(answers) : createStarterGuide())
      next.starterPreview = true
      display(next); setDemoJourneyPending(false); setSaveStatus("memory")
      return
    }
    setOnboardingSeen(true)
    void AsyncStorage.setItem("anew-native-journey-seen-v1", "seen").catch(() => {})
    personalize(hasOnboardingAnswers(answers) ? buildPersonalizedGuide(answers) : createStarterGuide())
  }
  const useStarterWeek = () => mutate((current) => ({ ...current, starterPreview: false }), true)
  const updateWeekSections = (sections: Section[]) => {
    if (!canChange()) return false
    const current = workspaceRef.current
    if (current.starterPreview) return false
    const week = current.weeks.find((item) => item.id === current.activeWeekId)
    if (week?.status !== "active") return false
    const next = updateWeekPlanInWorkspace(current, week.id, { title: week.title, sections, weeklyPlan: week.programacao.activities }, new Date().toISOString())
    if (!next) { setError("Check section titles and field labels before saving."); return false }
    const selected = next.weeks.find((item) => item.id === next.activeWeekId) ?? next.weeks.find((item) => item.id === current.activeWeekId)
    if (!selected) { setError("The selected week could not be saved. Current records were preserved."); return false }
    const revised: NativeWorkspace = { ...current, ...next, activeWeekId: selected.id, activeGuideId: selected.guideId }
    display(revised); save(revised)
    return true
  }
  const chooseGuide = (id: string) => mutate((current) => {
    const guide = current.guides.find((item) => item.id === id)
    if (!guide) return current
    const existing = current.weeks.find((week) => week.guideId === id && week.status === "active") ?? current.weeks.find((week) => week.guideId === id)
    const nextWeek = existing ?? blankWeek(guide)
    return { ...current, activeGuideId: id, activeWeekId: nextWeek.id, weeks: existing ? current.weeks : [...current.weeks, nextWeek] }
  })
  const chooseWeek = (id: string) => mutate((current) => { const week = current.weeks.find((item) => item.id === id); return week ? { ...current, activeWeekId: id, activeGuideId: week.guideId } : current })
  const createPlannedWeek = (setup: WeekSetup, title?: string, startDate?: string) => {
    if (!canChange()) return false
    const current = workspaceRef.current
    const source = current.starterPreview ? { ...current, weeks: [], activeWeekId: null } : current
    const next = createPlannedWeekInWorkspace(source, setup, { id: newId("week"), guideId: newId("week-plan"),
      createdAt: new Date().toISOString(), today: getTodayFormatted(), locale: "en-US", title, startDate })
    if (!next) { setError("Check the week preferences and seven-day date range, then try again."); return false }
    const revised = { ...current, starterPreview: false, guides: next.guides, weeks: next.weeks, activeWeekId: next.newWeek.id, activeGuideId: next.newWeek.guideId }
    if (!parseNativeWorkspace(JSON.stringify(revised))) return false
    display(revised); save(revised)
    return true
  }
  const createWeek = (title?: string, startDate?: string) => {
    const current = workspaceRef.current, previous = current.weeks.find((week) => week.id === current.activeWeekId)
    createPlannedWeek(setupFromPreviousWeek(current.starterPreview ? undefined : previous,
      current.guides.find((guide) => guide.id === previous?.guideId)), title, startDate)
  }
  const updateWeekSetup = (weekId: string, setup: WeekSetup) => {
    if (!canChange()) return false
    const current = workspaceRef.current
    if (current.starterPreview || current.weeks.find((item) => item.id === weekId)?.status !== "active") return false
    const next = updateWeekSetupInWorkspace(current, weekId, setup, new Date().toISOString(), "en-US")
    if (!next) { setError("This week's choices could not be saved. Current records were preserved."); return false }
    const revised: NativeWorkspace = { ...current, guides: next.guides, weeks: next.weeks }
    if (!parseNativeWorkspace(JSON.stringify(revised))) { setError("This week's choices could not be saved. Current records were preserved."); return false }
    display(revised); save(revised); setError(null)
    return true
  }
  const changeWeek = (id: string, change: (week: NativeWeek) => NativeWeek, activeOnly = false) => mutate((current) => ({ ...current, weeks: current.weeks.map((week) => week.id === id && (!activeOnly || week.status === "active") ? recalculateWeek({ ...change(week), updatedAt: new Date().toISOString(), aiReviewOutdated: Boolean(week.aiReview) }) : week) }))
  const updateWeek = (id: string, patch: { title?: string; startDate?: string }) => {
    if (patch.startDate && (!isValidDate(patch.startDate) || !isValidDate(calculateInclusiveEndDate(patch.startDate)))) { setError("Use a valid seven-day date range in YYYY-MM-DD format."); return }
    changeWeek(id, (week) => ({ ...week, title: patch.title?.trim().slice(0, 500) || week.title, startDate: patch.startDate ?? week.startDate, endDate: patch.startDate ? calculateInclusiveEndDate(patch.startDate) : week.endDate }), true)
  }
  const deleteWeek = (id: string) => mutate((current) => {
    let weeks = current.weeks.filter((week) => week.id !== id)
    if (!weeks.length) weeks = [blankWeek(current.guides.find((guide) => guide.id === current.activeGuideId) ?? current.guides[0])]
    const next = weeks.find((week) => week.id === current.activeWeekId) ?? weeks[0]
    return { ...current, weeks, activeWeekId: next.id, activeGuideId: next.guideId }
  })
  const activeWeek = visibleWorkspace.weeks.find((week) => week.id === visibleWorkspace.activeWeekId) ?? visibleWorkspace.weeks[0]
  const activeGuide = visibleWorkspace.guides.find((guide) => guide.id === visibleWorkspace.activeGuideId) ?? visibleWorkspace.guides[0]
  const setText = (id: string, value: string) => {
    if (!id || id.length > 150 || value.length > 100000 || ["__proto__", "constructor", "prototype"].includes(id)) return
    changeWeek(workspaceRef.current.activeWeekId, (week) => ({ ...week, data: { ...week.data, text: { ...week.data.text, [id]: value } } }), true)
  }
  const toggleDone = (id: string) => {
    if (!id || id.length > 150 || ["__proto__", "constructor", "prototype"].includes(id)) return
    changeWeek(workspaceRef.current.activeWeekId, (week) => ({ ...week, data: { ...week.data, done: { ...week.data.done, [id]: !week.data.done[id] } } }), true)
  }
  const addActivity = (activity: Omit<Activity, "id" | "order">) => changeWeek(workspaceRef.current.activeWeekId, (week) => {
    const next = { ...activity, id: newId("activity"), order: week.programacao.activities.filter((item) => item.dayIndex === activity.dayIndex).length }
    return isValidActivity(next) ? { ...week, programacao: { ...week.programacao, activities: [...week.programacao.activities, next] } } : week
  }, true)
  const updateActivity = (id: string, patch: Partial<Activity>) => changeWeek(workspaceRef.current.activeWeekId, (week) => ({ ...week, programacao: { ...week.programacao, activities: week.programacao.activities.map((activity) => { const next = { ...activity, ...patch, id }; return activity.id === id && isValidActivity(next) ? next : activity }) } }), true)
  const deleteActivity = (id: string) => changeWeek(workspaceRef.current.activeWeekId, (week) => {
    delete week.data.done[id]
    return { ...week, programacao: { ...week.programacao, activities: week.programacao.activities.filter((activity) => activity.id !== id) } }
  }, true)
  const completeWeek = (id = workspaceRef.current.activeWeekId) => changeWeek(id, (week) => {
    const taskResults = week.programacao.activities.map((activity) => ({ ...activity, done: week.data.done[activity.id] === true, countsTowardCompletion: activity.countsTowardCompletion !== false }))
    const counted = taskResults.filter((task) => task.countsTowardCompletion)
    const completedTasks = counted.filter((task) => task.done).length
    const completedAt = new Date().toISOString()
    return { ...week, status: "completed", completedAt, completionSnapshot: { totalTasks: counted.length, completedTasks, completionPercentage: counted.length ? Math.round(completedTasks / counted.length * 100) : 0, completedAt, taskResults } }
  }, true)
  const reopenWeek = (id = workspaceRef.current.activeWeekId) => changeWeek(id, (week) => ({ ...week, status: "active", completedAt: null, completionSnapshot: null }))
  const setWeekSpirituality = (enabled: boolean) => mutate((current) => {
    const week = current.weeks.find((item) => item.id === current.activeWeekId), guide = current.guides.find((item) => item.id === week?.guideId)
    if (!week || !guide || week.status !== "active") return current
    const snapshot = week.guideSnapshot ?? { id: guide.id, title: guide.title, version: guide.version, sections: copy(guide.sections), completionConfig: copy(guide.completionConfig), contentLocale: guide.contentLocale, bibleVersion: guide.bibleVersion }
    return { ...current, weeks: current.weeks.map((item) => item.id !== week.id ? item : {
      ...item, updatedAt: new Date().toISOString(), aiReviewOutdated: Boolean(item.aiReview) || item.aiReviewOutdated,
      setup: { ...setupFromPreviousWeek(item, guide), spirituality: enabled === true },
      guideSnapshot: { ...snapshot, theologyEnabled: enabled === true, completionConfig: { ...snapshot.completionConfig, theologyReviewEnabled: enabled === true } },
    }) }
  })
  const setTheme = (theme: "light" | "dark") => {
    if (theme !== "light" && theme !== "dark") return
    if (control.current.mode === "preview" || workspaceRef.current.starterPreview) display({ ...workspaceRef.current, theme })
    else mutate((current) => ({ ...current, theme }))
  }
  const toggleResourceFavorite = (id: string) => { if (id && id.length <= 150) mutate((current) => ({ ...current, resourceFavorites: current.resourceFavorites.includes(id) ? current.resourceFavorites.filter((item) => item !== id) : [...current.resourceFavorites, id] })) }
  const startDemo = async (guide?: GuideTemplate, scenario: DemoScenario = "returning-user"): Promise<boolean> => {
    if (!demoAvailable || authRef.current.pending || control.current.suspended) return false
    const previous = control.current, adapter = storage.current
    if (previous.mode === "account" && adapter) {
      previous.suspended = true; setSuspended(true)
      const saved = await adapter.flush()
      if (control.current !== previous || storage.current !== adapter || authRef.current.pending) {
        if (control.current === previous) { previous.suspended = false; setSuspended(false) }
        return false
      }
      previous.suspended = false; setSuspended(false)
      if (!saved) { setStorageWarning("Your latest changes could not be saved. Export a backup before starting a test workspace."); setError("The test was not started. Your account workspace is still open."); return false }
    }
    storage.current?.revoke(); storage.current = null
    control.current = { mode: "demo", owner: null, epoch: control.current.epoch + 1, readonly: false, suspended: false }
    setDemoActive(true)
    demoSeed.current = guide && isValidGuide(guide) ? copy(guide) : undefined
    setDemoScenario(scenario); setDemoJourneyPending(scenario === "first-visit"); setDemoEpoch((value) => value + 1)
    preservedRaw.current = null; setStorageWarning(null); setError(null); setSuspended(false)
    display(createNativeDemoWorkspace(demoSeed.current, scenario)); setDemo(true); setReady(true); setSaveStatus("memory")
    return true
  }
  const resetDemo = () => { if (control.current.mode === "demo") void startDemo(demoSeed.current, demoScenario ?? "returning-user") }
  const exitDemo = () => {
    if (control.current.mode !== "demo") return
    control.current = { mode: "preview", owner: null, epoch: control.current.epoch + 1, readonly: false, suspended: false }
    setDemoActive(false); demoSeed.current = undefined; display(createBlankWorkspace(scopedPreviewGuide(previewRef.current, previewOwner.current, authRef.current.user?.uid ?? null)))
    setDemo(false); setDemoScenario(null); setDemoJourneyPending(false); setError(null); setStorageWarning(null); setSaveStatus("idle")
  }
  const exportBackup = () => {
    if (control.current.mode === "account" && (!ownsAuthenticatedWorkspace() || workspaceOwnerRef.current !== authRef.current.user?.uid)) return JSON.stringify(createBlankWorkspace(scopedPreviewGuide(previewRef.current, previewOwner.current, authRef.current.user?.uid ?? null)), null, 2)
    return preservedRaw.current ?? JSON.stringify({ ...workspaceRef.current, exportedAt: new Date().toISOString(), ...(demo ? { demo: true } : {}) }, null, 2)
  }
  const importBackup = (value: string) => {
    const next = parseNativeWorkspace(value)
    if (!next || control.current.mode === "preview" || control.current.suspended) { setError("This backup could not be imported. Use a valid Anew JSON backup in an editable workspace."); return false }
    if (control.current.mode === "account" && (!ownsAuthenticatedWorkspace() || !storage.current?.loadComplete)) return false
    control.current.readonly = false; preservedRaw.current = null; setStorageWarning(null); setError(null)
    display(next); save(next, true); return true
  }
  const clearLocalData = async () => {
    if (control.current.mode === "demo") { resetDemo(); return }
    const failureMessage = "Local records could not be fully cleared and verified. Check this account's local records and try again."
    if (!ownsAuthenticatedWorkspace() || !control.current.owner || workspaceOwnerRef.current !== control.current.owner || control.current.suspended) throw new Error("Local records cannot be cleared in this session. Sign in and try again.")
    const owner = control.current.owner
    const originalAdapter = storage.current
    if (!originalAdapter || originalAdapter.key !== workspaceStorageKey(owner)) throw new Error(failureMessage)
    let operationEpoch = control.current.epoch
    control.current.suspended = true; setSuspended(true)
    try {
      const cleanup = await Promise.allSettled([originalAdapter.remove(), clearNativeGuideDraft(AsyncStorage, owner)])
      if (cleanup.some((result) => result.status === "rejected")) throw new Error("LOCAL_CLEANUP_FAILED")
      if (control.current.epoch !== operationEpoch || !ownsAuthenticatedWorkspace()) throw new Error("LOCAL_SESSION_CHANGED")
      const adapter = new NativeWorkspaceStorage(AsyncStorage, owner)
      operationEpoch = ++control.current.epoch
      storage.current = adapter
      const loaded = await adapter.load()
      if (control.current.epoch !== operationEpoch || !ownsAuthenticatedWorkspace()) { adapter.revoke(); throw new Error("LOCAL_SESSION_CHANGED") }
      if (loaded.kind !== "empty") throw new Error("LOCAL_CLEANUP_NOT_VERIFIED")
      control.current.suspended = false; setSuspended(false)
      control.current.readonly = false; preservedRaw.current = null; setStorageWarning(null); setError(null)
      const next = createBlankWorkspace(scopedPreviewGuide(previewRef.current, previewOwner.current, owner)); display(next); save(next)
    } catch {
      if (control.current.epoch === operationEpoch && control.current.owner === owner && ownsAuthenticatedWorkspace()) {
        control.current.suspended = false; control.current.readonly = true; setSuspended(false); setSaveStatus("error")
        setStorageWarning("Local deletion could not be confirmed. Editing is paused; export the preserved records, retry clearing, or reopen the app before making changes.")
        setError(failureMessage)
      }
      throw new Error(failureMessage)
    }
  }
  const canReadCurrent = () => control.current.mode !== "account" || (ownsAuthenticatedWorkspace() && workspaceOwnerRef.current === authRef.current.user?.uid)
  const currentWeek = () => workspaceRef.current.weeks.find((week) => week.id === workspaceRef.current.activeWeekId) ?? workspaceRef.current.weeks[0]
  return <NativeAppContext.Provider value={{ ready: ready && onboardingLoaded, demo, demoAvailable, demoScenario, demoJourneyPending, demoEpoch, canEdit: canChange() && !suspended, starterIsPreview: visibleWorkspace.starterPreview === true, useStarterWeek, updateWeekSections, createPlannedWeek, updateWeekSetup, error, saveStatus, storageWarning, previewGuide: safePreviewGuide, guides: visibleWorkspace.guides, activeGuide, weeks: visibleWorkspace.weeks, activeWeek, theme: visibleWorkspace.theme, setTheme, onboardingSeen, personalize, completeOnboarding, chooseGuide, chooseWeek, createWeek, updateWeek, deleteWeek, getText: (id) => canReadCurrent() ? currentWeek().data.text[id] ?? "" : "", setText, isDone: (id) => canReadCurrent() && currentWeek().data.done[id] === true, toggleDone, addActivity, updateActivity, deleteActivity, completeWeek, reopenWeek, setWeekSpirituality, exportBackup, importBackup, resourceFavorites: visibleWorkspace.resourceFavorites, toggleResourceFavorite, startDemo, resetDemo, exitDemo, clearLocalData, clearError: () => setError(null), aiAvailable: Boolean(nativeAIConfigured && auth.configured && accountUid && !demo) }}>{children}</NativeAppContext.Provider>
}

export function useNativeApp() {
  const context = useContext(NativeAppContext)
  if (!context) throw new Error("NativeAppProvider is required")
  return context
}
