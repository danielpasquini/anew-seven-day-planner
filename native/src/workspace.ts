import { DEFAULT_GUIDE_TEMPLATE_EN, GUIDE_TEMPLATES, type GuideTemplate } from "../../lib/guide-data"
import { isValidBackup, isValidDate, isValidGuide } from "../../lib/backup-validation"
import { calculateInclusiveEndDate, getTodayFormatted } from "../../lib/date-utils"
import { createDemoBackup } from "../../lib/demo-data"
import { createStarterGuide } from "../../lib/planner"

export type Activity = GuideTemplate["weeklyPlan"][number]
export type NativeWeek = ReturnType<typeof createDemoBackup>["weeks"][number]
export type NativeWorkspace = {
  schemaVersion: 4
  locale: "en-US"
  bibleVersion: "KJV"
  guides: GuideTemplate[]
  activeGuideId: string
  weeks: NativeWeek[]
  activeWeekId: string
  theme: "light" | "dark"
  resourceFavorites: string[]
  starterPreview?: boolean
}
export type AsyncStorageAdapter = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> }
export const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
export const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export function visibleNativeWorkspace(workspace: NativeWorkspace, owner: string | null, authorizedUid: string | null): NativeWorkspace | null {
  return owner !== null && owner !== authorizedUid ? null : workspace
}
export function scopedPreviewGuide(guide: GuideTemplate, owner: string | null, uid: string | null): GuideTemplate {
  return owner === null || owner === uid ? guide : DEFAULT_GUIDE_TEMPLATE_EN
}

export function workspaceStorageKey(uid: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) || uid === "demo") throw new Error("INVALID_ACCOUNT_OWNER")
  return `anew-native-workspace-v1:${uid}`
}
export const nativeGuideDraftKey = (uid: string) => { workspaceStorageKey(uid); return `anew-native-onboarding-v1:${uid}` }
const draftQueues = new Map<string, Promise<boolean>>()
const isDerivedGuide = (value: unknown): value is GuideTemplate => isValidGuide(value) && value.contentLocale === "en-US" && value.theologyEnabled === false && value.completionConfig.theologyReviewEnabled === false

export async function readNativeGuideDraft(storage: AsyncStorageAdapter, uid: string): Promise<GuideTemplate | null> {
  try {
    const raw = await storage.getItem(nativeGuideDraftKey(uid))
    if (raw === null || raw.length > 2 * 1024 * 1024) return null
    const value: unknown = JSON.parse(raw)
    return isDerivedGuide(value) ? copy(value) : null
  } catch { return null }
}
export async function clearNativeGuideDraft(storage: AsyncStorageAdapter, uid: string): Promise<void> {
  const key = nativeGuideDraftKey(uid)
  await draftQueues.get(key)
  await storage.removeItem(key)
}

/** Stages only a validated derived guide, never answers or an existing journal. */
export class NativeGuideDraftStorage {
  private revoked = false
  private readonly key: string
  constructor(private readonly storage: AsyncStorageAdapter, private readonly uid: string) { this.key = nativeGuideDraftKey(uid) }
  stage(guide: GuideTemplate): Promise<boolean> {
    if (this.revoked || !isDerivedGuide(guide)) return Promise.resolve(false)
    const serialized = JSON.stringify(copy(guide))
    const operation = (draftQueues.get(this.key) ?? Promise.resolve(true)).then(async () => {
      if (this.revoked || await this.storage.getItem(workspaceStorageKey(this.uid)) !== null || this.revoked) return false
      const existing = await this.storage.getItem(this.key)
      if (this.revoked) return false
      if (existing !== null) {
        try { if (!isDerivedGuide(JSON.parse(existing))) return false } catch { return false }
      }
      await this.storage.setItem(this.key, serialized)
      return !this.revoked
    }).catch(() => false)
    draftQueues.set(this.key, operation)
    void operation.finally(() => { if (draftQueues.get(this.key) === operation) draftQueues.delete(this.key) })
    return operation
  }
  revoke(): void { this.revoked = true }
}

export function blankWeek(guide: GuideTemplate, title = "Week 1", startDate = getTodayFormatted()): NativeWeek {
  if (!isValidDate(startDate) || !isValidGuide(guide)) throw new Error("INVALID_WORKSPACE")
  const stamp = new Date().toISOString()
  const activities = copy(guide.weeklyPlan)
  return {
    id: newId("week"), guideId: guide.id, templateId: guide.id, guideVersion: guide.version,
    guideSnapshot: { id: guide.id, title: guide.title, version: guide.version, sections: copy(guide.sections), completionConfig: copy(guide.completionConfig), theologyEnabled: guide.theologyEnabled, contentLocale: guide.contentLocale, bibleVersion: guide.bibleVersion },
    title: title.slice(0, 500), startDate, endDate: calculateInclusiveEndDate(startDate), createdAt: stamp, updatedAt: stamp,
    status: "active", completedAt: null, completionSnapshot: null, aiReview: null, aiReviewVersion: 1, aiReviewOutdated: false,
    data: { text: {}, done: {} }, programacao: { dias: 7, activities },
    progresso: { total: activities.filter((activity) => activity.countsTowardCompletion !== false).length, concluidas: 0, percentual: 0 },
  }
}

export function createBlankWorkspace(guide = createStarterGuide()): NativeWorkspace {
  const ownGuide = copy(guide)
  const week = blankWeek(ownGuide)
  return { schemaVersion: 4, locale: "en-US", bibleVersion: "KJV", guides: [ownGuide], activeGuideId: ownGuide.id, weeks: [week], activeWeekId: week.id, theme: "light", resourceFavorites: [] }
}

export function createNativeDemoWorkspace(guide?: GuideTemplate): NativeWorkspace {
  return { ...createDemoBackup(guide ?? createStarterGuide()), theme: "light", resourceFavorites: [] }
}

export function parseNativeWorkspace(raw: string): NativeWorkspace | null {
  try {
    if (raw.length > 10 * 1024 * 1024) return null
    const value: unknown = JSON.parse(raw)
    if (!isValidBackup(value)) return null
    const backup = value as unknown as Partial<NativeWorkspace>
    const guides = copy(backup.guides?.length ? backup.guides : GUIDE_TEMPLATES)
    const guide = guides.find((item) => item.id === backup.activeGuideId) ?? guides[0]
    const weeks = backup.weeks?.length ? copy(backup.weeks).map((week) => {
      const template = guides.find((item) => item.id === (week.guideId ?? week.templateId)) ?? guide
      const normalized = { ...blankWeek(template, week.title, week.startDate), ...week, guideId: template.id, templateId: template.id }
      normalized.programacao = { dias: 7, activities: copy(week.programacao?.activities ?? template.weeklyPlan) }
      return recalculateWeek(normalized)
    }) : [blankWeek(guide)]
    const activeWeek = weeks.find((week) => week.id === backup.activeWeekId) ?? weeks[0]
    const extras = value as Record<string, unknown>
    if (extras.resourceFavorites !== undefined && (!Array.isArray(extras.resourceFavorites) || extras.resourceFavorites.length > 500 || !extras.resourceFavorites.every((id) => typeof id === "string" && id.length > 0 && id.length <= 150))) return null
    if (extras.starterPreview !== undefined && typeof extras.starterPreview !== "boolean") return null
    const result: NativeWorkspace = { schemaVersion: 4, locale: "en-US", bibleVersion: "KJV", guides, activeGuideId: activeWeek.guideId, weeks, activeWeekId: activeWeek.id, theme: backup.theme === "dark" ? "dark" : "light", resourceFavorites: [...new Set(backup.resourceFavorites ?? [])], ...(extras.starterPreview === true ? { starterPreview: true } : {}) }
    return isValidBackup(result) ? result : null
  } catch { return null }
}

export function recalculateWeek(week: NativeWeek): NativeWeek {
  const countable = week.programacao.activities.filter((activity) => activity.countsTowardCompletion !== false)
  const concluidas = countable.filter((activity) => week.data.done[activity.id] === true).length
  return { ...week, progresso: { total: countable.length, concluidas, percentual: countable.length ? Math.round(concluidas / countable.length * 100) : 0 } }
}

export type WorkspaceLoad = { kind: "ready"; workspace: NativeWorkspace } | { kind: "empty" | "invalid" | "unavailable" | "revoked"; raw?: string }

/** Serializes account writes. Revoked queues never switch owners or overwrite unread originals. */
export class NativeWorkspaceStorage {
  readonly key: string
  private revoked = false
  private writable = false
  private loaded = false
  private chain: Promise<boolean> = Promise.resolve(true)
  private latest: string | null = null
  private failed = false

  constructor(private readonly storage: AsyncStorageAdapter, uid: string) { this.key = workspaceStorageKey(uid) }
  get loadComplete(): boolean { return this.loaded && !this.revoked }
  async load(): Promise<WorkspaceLoad> {
    this.writable = false
    this.loaded = false
    try {
      const raw = await this.storage.getItem(this.key)
      if (this.revoked) return { kind: "revoked" }
      if (raw === null) { this.writable = true; return { kind: "empty" } }
      const workspace = parseNativeWorkspace(raw)
      if (!workspace) return { kind: "invalid", raw }
      this.writable = true
      return { kind: "ready", workspace }
    } catch { return { kind: this.revoked ? "revoked" : "unavailable" } }
    finally { this.loaded = !this.revoked }
  }
  save(workspace: NativeWorkspace): Promise<boolean> {
    if (this.revoked || !this.writable) return Promise.resolve(false)
    const serialized = JSON.stringify(workspace)
    if (!parseNativeWorkspace(serialized)) return Promise.resolve(false)
    this.latest = serialized
    this.chain = this.chain.then(async () => {
      if (this.revoked || !this.writable) return false
      try { await this.storage.setItem(this.key, serialized); this.failed = false; return !this.revoked }
      catch { this.failed = true; return false }
    })
    return this.chain
  }
  replace(workspace: NativeWorkspace): Promise<boolean> {
    if (this.revoked || !this.loaded || !parseNativeWorkspace(JSON.stringify(workspace))) return Promise.resolve(false)
    this.writable = true
    return this.save(workspace)
  }
  async flush(): Promise<boolean> {
    const drain = async () => {
      let observed: Promise<boolean>
      do { observed = this.chain; await observed } while (observed !== this.chain)
    }
    await drain()
    if (this.revoked) return false
    if (this.failed && this.latest) {
      const last = parseNativeWorkspace(this.latest)
      if (last) { this.save(last); await drain() }
    }
    return !this.failed && !this.revoked
  }
  revoke(): void { this.revoked = true; this.writable = false; this.latest = null }
  async remove(): Promise<void> { this.revoke(); await this.chain; await this.storage.removeItem(this.key) }
}
