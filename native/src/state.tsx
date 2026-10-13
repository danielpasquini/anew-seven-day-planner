import { nativeAIConfigured } from "./ai"
import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { DEFAULT_GUIDE_TEMPLATE_EN, type GuideTemplate, type Section } from "../../lib/guide-data"
import { isValidActivity, isValidDate, isValidGuide } from "../../lib/backup-validation"
import { calculateInclusiveEndDate } from "../../lib/date-utils"
import { buildPersonalizedGuide, hasOnboardingAnswers, type OnboardingAnswers } from "../../lib/onboarding"
import { createStarterGuide, reviseGuideSections } from "../../lib/planner"
import { blankWeek, clearNativeGuideDraft, copy, createBlankWorkspace, createNativeDemoWorkspace, NativeGuideDraftStorage, NativeWorkspaceStorage, newId, parseNativeWorkspace, readNativeGuideDraft, recalculateWeek, scopedPreviewGuide, visibleNativeWorkspace, workspaceStorageKey, type Activity, type NativeWeek, type NativeWorkspace } from "./workspace"
import { useNativeAuth } from "./session"
export { NativeAuthProvider, useNativeAuth } from "./session"

type NativeAppValue = {
  ready: boolean; demo: boolean; demoAvailable: boolean; canEdit: boolean; error: string | null; saveStatus: "idle" | "saving" | "saved" | "memory" | "error"
  storageWarning: string | null; previewGuide: GuideTemplate; guides: GuideTemplate[]; activeGuide: GuideTemplate; weeks: NativeWeek[]; activeWeek: NativeWeek
  theme: "light" | "dark"; setTheme(value: "light" | "dark"): void; onboardingSeen: boolean
  personalize(guide: GuideTemplate): void; completeOnboarding(answers: OnboardingAnswers): void
  starterIsPreview: boolean; useStarterWeek(): void; updateGuideSections(sections: Section[]): boolean
  chooseGuide(id: string): void; chooseWeek(id: string): void; createWeek(title?: string, startDate?: string, guideId?: string): void
  updateWeek(id: string, patch: { title?: string; startDate?: string }): void; deleteWeek(id: string): void
  getText(id: string): string; setText(id: string, value: string): void; isDone(id: string): boolean; toggleDone(id: string): void
  addActivity(activity: Omit<Activity, "id" | "order">): void; updateActivity(id: string, patch: Partial<Activity>): void; deleteActivity(id: string): void
  completeWeek(id?: string): void; reopenWeek(id?: string): void; setGuideTheology(enabled: boolean): void
  exportBackup(): string; importBackup(value: string): boolean; resourceFavorites: string[]; toggleResourceFavorite(id: string): void
  startDemo(guide?: GuideTemplate): void; resetDemo(): void; exitDemo(): void; clearLocalData(): Promise<void>; clearError(): void
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
    if (!isValidGuide(guide)) { setError("This guide could not be opened."); return }
    const ownGuide = copy(guide)
    if (!canChange()) { previewOwner.current = authRef.current.user?.uid ?? null; previewRef.current = ownGuide; setPreviewGuide(ownGuide); display(createBlankWorkspace(ownGuide)); return }
    mutate((current) => {
      const week = blankWeek(ownGuide)
      return { ...current, starterPreview: false, guides: current.starterPreview ? [ownGuide] : [...current.guides.filter((item) => item.id !== ownGuide.id), ownGuide], activeGuideId: ownGuide.id, weeks: current.starterPreview ? [week] : [...current.weeks, week], activeWeekId: week.id }
    }, true)
  }, [canChange, display, mutate])
  const completeOnboarding = (answers: OnboardingAnswers) => {
    setOnboardingSeen(true)
    void AsyncStorage.setItem("anew-native-journey-seen-v1", "seen").catch(() => {})
    personalize(hasOnboardingAnswers(answers) ? buildPersonalizedGuide(answers) : createStarterGuide())
  }
  const useStarterWeek = () => mutate((current) => ({ ...current, starterPreview: false }), true)
  const updateGuideSections = (sections: Section[]) => {
    if (!canChange()) return false
    const current = workspaceRef.current
    if (current.starterPreview) return false
    const guide = current.guides.find((item) => item.id === current.activeGuideId)
    const week = current.weeks.find((item) => item.id === current.activeWeekId)
    if (!guide || week?.status !== "active") return false
    const revision = reviseGuideSections(guide, sections)
    if (!revision) { setError("Check section titles and field labels before saving."); return false }
    mutate((value) => ({ ...value, starterPreview: false, guides: value.guides.map((item) => item.id === revision.id ? revision : item), weeks: value.weeks.map((item) => item.id === value.activeWeekId ? { ...item, guideVersion: revision.version, guideSnapshot: { ...item.guideSnapshot, id: revision.id, title: revision.title, version: revision.version, completionConfig: copy(revision.completionConfig), sections: copy(revision.sections) }, updatedAt: new Date().toISOString() } : item) }))
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
  const createWeek = (title?: string, startDate?: string, guideId?: string) => {
    if (startDate && !isValidDate(startDate)) { setError("Use a valid date in YYYY-MM-DD format."); return }
    mutate((current) => {
      const guide = current.guides.find((item) => item.id === (guideId ?? current.activeGuideId)) ?? current.guides[0]
      const week = blankWeek(guide, title?.trim() || `Week ${current.weeks.filter((item) => item.guideId === guide.id).length + 1}`, startDate)
      return { ...current, weeks: [...current.weeks, week], activeWeekId: week.id, activeGuideId: guide.id }
    })
  }
  const changeWeek = (id: string, change: (week: NativeWeek) => NativeWeek, activeOnly = false) => mutate((current) => ({ ...current, weeks: current.weeks.map((week) => week.id === id && (!activeOnly || week.status === "active") ? recalculateWeek({ ...change(week), updatedAt: new Date().toISOString(), aiReviewOutdated: Boolean(week.aiReview) }) : week) }))
  const updateWeek = (id: string, patch: { title?: string; startDate?: string }) => {
    if (patch.startDate && !isValidDate(patch.startDate)) { setError("Use a valid date in YYYY-MM-DD format."); return }
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
  const setGuideTheology = (enabled: boolean) => mutate((current) => ({ ...current, guides: current.guides.map((guide) => guide.id === current.activeGuideId ? { ...guide, theologyEnabled: enabled === true, completionConfig: { ...guide.completionConfig, theologyReviewEnabled: enabled === true } } : guide) }))
  const setTheme = (theme: "light" | "dark") => {
    if (theme !== "light" && theme !== "dark") return
    if (control.current.mode === "preview" || workspaceRef.current.starterPreview) display({ ...workspaceRef.current, theme })
    else mutate((current) => ({ ...current, theme }))
  }
  const toggleResourceFavorite = (id: string) => { if (id && id.length <= 150) mutate((current) => ({ ...current, resourceFavorites: current.resourceFavorites.includes(id) ? current.resourceFavorites.filter((item) => item !== id) : [...current.resourceFavorites, id] })) }
  const startDemo = (guide?: GuideTemplate) => {
    if (!demoAvailable) return
    storage.current?.revoke(); storage.current = null
    control.current = { mode: "demo", owner: null, epoch: control.current.epoch + 1, readonly: false, suspended: false }
    setDemoActive(true)
    demoSeed.current = guide && isValidGuide(guide) ? copy(guide) : undefined
    preservedRaw.current = null; setStorageWarning(null); setError(null); setSuspended(false)
    display(createNativeDemoWorkspace(demoSeed.current)); setDemo(true); setReady(true); setSaveStatus("memory")
  }
  const resetDemo = () => { if (control.current.mode === "demo") startDemo(demoSeed.current) }
  const exitDemo = () => {
    if (control.current.mode !== "demo") return
    control.current = { mode: "preview", owner: null, epoch: control.current.epoch + 1, readonly: false, suspended: false }
    setDemoActive(false); demoSeed.current = undefined; display(createBlankWorkspace(scopedPreviewGuide(previewRef.current, previewOwner.current, authRef.current.user?.uid ?? null)))
    setDemo(false); setError(null); setStorageWarning(null); setSaveStatus("idle")
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
  return <NativeAppContext.Provider value={{ ready: ready && onboardingLoaded, demo, demoAvailable, canEdit: canChange() && !suspended, starterIsPreview: visibleWorkspace.starterPreview === true, useStarterWeek, updateGuideSections, error, saveStatus, storageWarning, previewGuide: safePreviewGuide, guides: visibleWorkspace.guides, activeGuide, weeks: visibleWorkspace.weeks, activeWeek, theme: visibleWorkspace.theme, setTheme, onboardingSeen, personalize, completeOnboarding, chooseGuide, chooseWeek, createWeek, updateWeek, deleteWeek, getText: (id) => canReadCurrent() ? currentWeek().data.text[id] ?? "" : "", setText, isDone: (id) => canReadCurrent() && currentWeek().data.done[id] === true, toggleDone, addActivity, updateActivity, deleteActivity, completeWeek, reopenWeek, setGuideTheology, exportBackup, importBackup, resourceFavorites: visibleWorkspace.resourceFavorites, toggleResourceFavorite, startDemo, resetDemo, exitDemo, clearLocalData, clearError: () => setError(null), aiAvailable: Boolean(nativeAIConfigured && auth.configured && accountUid && !demo) }}>{children}</NativeAppContext.Provider>
}

export function useNativeApp() {
  const context = useContext(NativeAppContext)
  if (!context) throw new Error("NativeAppProvider is required")
  return context
}
