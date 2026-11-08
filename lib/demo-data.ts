import type { GuideTemplate } from "./guide-data"
import type { WeekSetup } from "./week-setup"
import { createStarterGuide, buildPresetGuide } from "./planner"
import { isValidGuide } from "./backup-validation"
import { calculateInclusiveEndDate, getTodayFormatted } from "./date-utils"

// In-memory demo data structures for preview and testing
export type DemoWeek = {
  id: string; guideId: string; templateId: string; guideVersion?: number
  guideSnapshot?: { id: string; title: string; version: number; completionConfig: GuideTemplate["completionConfig"]; theologyEnabled?: boolean; contentLocale?: "en-US" | "pt-BR"; bibleVersion?: "ARA" | "NVT" | "KJV" | "NIV" | null; sections?: GuideTemplate["sections"] } | null
  title: string; startDate: string; endDate: string; createdAt: string; updatedAt: string
  status: "active" | "completed"; completedAt?: string | null
  setup?: WeekSetup
  completionSnapshot?: { totalTasks: number; completedTasks: number; completionPercentage: number; completedAt: string; taskResults: { id: string; description: string; time?: string; dayIndex: number; done: boolean; countsTowardCompletion: boolean }[] } | null
  aiReview?: { verdict: string; summary: string; whatWorked: string[]; difficulties: string[]; observedPatterns: string[]; nextWeekSuggestions: string[]; generatedAt: string; analysisVersion: number } | null
  aiReviewVersion?: number; aiReviewOutdated?: boolean
  data: { text: Record<string, string>; done: Record<string, boolean> }
  programacao: { dias: number; activities: GuideTemplate["weeklyPlan"] }
  progresso: { total: number; concluidas: number; percentual: number }
}

/** A revocable, memory-only adapter. It never reads browser or account storage. */
export class MemoryDemoStorage {
  private values = new Map<string, string>()
  private disposed = false

  getItem(key: string): string | null { return this.disposed ? null : this.values.get(key) ?? null }
  setItem(key: string, value: string): void { if (!this.disposed) this.values.set(key, String(value)) }
  removeItem(key: string): void { this.values.delete(key) }
  clear(): void { this.values.clear() }
  dispose(): void { this.clear(); this.disposed = true }
}

export type DemoBackup = {
  schemaVersion: 4
  locale: "en-US"
  bibleVersion: "KJV"
  guides: GuideTemplate[]
  activeGuideId: string
  weeks: DemoWeek[]
  activeWeekId: string
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

function demoGuide(source: GuideTemplate, prefix: string, title?: string): GuideTemplate {
  const guide = clone(source)
  const ids = new Map<string, string>()
  const usedIds = new Set<string>()
  let serial = 0
  const namespaceId = (original: string): string => {
    const saved = ids.get(original)
    if (saved) return saved
    let candidate = `${prefix}-${original}`
    if (candidate.length > 150 || usedIds.has(candidate)) {
      do { candidate = `${prefix}-${++serial}-${original}`.slice(0, 150) } while (usedIds.has(candidate))
    }
    ids.set(original, candidate)
    usedIds.add(candidate)
    return candidate
  }
  // Prefix IDs to isolate demo fixtures from production records
  function namespace(value: unknown): void {
    if (Array.isArray(value)) { value.forEach(namespace); return }
    if (!value || typeof value !== "object") return
    for (const [key, child] of Object.entries(value)) {
      if (key === "id" && typeof child === "string") {
        ;(value as Record<string, unknown>)[key] = namespaceId(child)
      } else namespace(child)
    }
  }
  namespace(guide)
  guide.scheduleTaskIds = guide.scheduleTaskIds.map(namespaceId)
  guide.title = (title ?? `Demo: ${guide.title}`).slice(0, 300)
  guide.safetyNotes = ["Demo workspace. Entries are fictional examples for trying the app.", ...(guide.safetyNotes ?? []).slice(0, 199)]
  return guide
}

function offsetDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function makeWeek(guide: GuideTemplate, id: string, title: string, startDate: string, completed: boolean): DemoWeek {
  const activities = clone(guide.weeklyPlan)
  const done = Object.fromEntries(activities.map((activity, index) => [activity.id, completed ? index % 4 !== 3 : index < 2]))
  const text: Record<string, string> = {}
  const examples = ["Demo example: a short walk and a quiet break helped me slow down.", "Demo example: I can choose one small task and leave space for rest.", "Demo example: next week I want to keep my routine flexible."]
  let exampleIndex = 0
  for (const section of guide.sections) for (const block of section.blocks) {
    if (block.type !== "fields") continue
    for (const field of block.fields) {
      if (field.kind === "static") continue
      if (field.kind === "scale") text[field.id] = String(Math.min(4, field.max ?? 10))
      else if (exampleIndex < examples.length) text[field.id] = examples[exampleIndex++]
    }
  }
  const countable = activities.filter((activity) => activity.countsTowardCompletion !== false)
  const completedTasks = countable.filter((activity) => done[activity.id]).length
  const percentual = countable.length ? Math.round(completedTasks / countable.length * 100) : 0
  const createdAt = `${startDate}T12:00:00.000Z`
  const completedAt = completed ? `${calculateInclusiveEndDate(startDate)}T18:00:00.000Z` : null
  return {
    id, guideId: guide.id, templateId: guide.id, guideVersion: guide.version,
    guideSnapshot: { id: guide.id, title: guide.title, version: guide.version, completionConfig: clone(guide.completionConfig), theologyEnabled: guide.theologyEnabled, contentLocale: guide.contentLocale, bibleVersion: guide.bibleVersion, sections: clone(guide.sections) },
    title, startDate, endDate: calculateInclusiveEndDate(startDate), createdAt,
    updatedAt: completedAt ?? createdAt, status: completed ? "completed" : "active", completedAt,
    completionSnapshot: completed ? {
      totalTasks: countable.length, completedTasks, completionPercentage: percentual, completedAt: completedAt!,
      taskResults: activities.map((activity) => ({ ...activity, done: done[activity.id], countsTowardCompletion: activity.countsTowardCompletion !== false })),
    } : null,
    // AI reviews remain unpopulated in demo mode
    aiReview: null, aiReviewVersion: 1, aiReviewOutdated: false,
    data: { text, done }, programacao: { dias: 7, activities },
    progresso: { total: countable.length, concluidas: completedTasks, percentual },
  }
}

export function createDemoBackup(initialGuide?: GuideTemplate, today = getTodayFormatted()): DemoBackup {
  const primary = demoGuide(initialGuide && isValidGuide(initialGuide) ? initialGuide : createStarterGuide(), "demo-care")
  const secondary = demoGuide(buildPresetGuide("balance"), "demo-space", "Demo: Room for Rest")
  secondary.description = "A second example guide for trying flexible routines and making room for rest."
  secondary.intro.title = "Room for Rest"
  const weeks = [
    makeWeek(primary, "demo-week-completed", "Demo: A Completed Week", offsetDate(today, -7), true),
    makeWeek(primary, "demo-week-current", "Demo: This Week", today, false),
    makeWeek(secondary, "demo-week-rest", "Demo: A Gentler Routine", offsetDate(today, 7), false),
  ]
  return { schemaVersion: 4, locale: "en-US", bibleVersion: "KJV", guides: [primary, secondary], activeGuideId: primary.id, weeks, activeWeekId: "demo-week-current" }
}

export type DemoScenario = "first-visit" | "returning-user"
export type DemoSession = Readonly<{ id: string; storageKey: string; storage: MemoryDemoStorage; scenario: DemoScenario }>

/** Pure lifecycle used by the provider and tested without Firebase or a browser. */
export class DemoSessionController {
  private current: DemoSession | null = null
  private seedGuide: GuideTemplate | undefined
  private serial = 0

  constructor(readonly available: boolean, private readonly beforeStart: () => boolean = () => true) {}
  get session(): DemoSession | null { return this.current }
  start(initialGuide?: GuideTemplate, scenario: DemoScenario = "returning-user"): DemoSession | null {
    if (!this.available || (!this.current && !this.beforeStart())) return null
    this.current?.storage.dispose()
    this.seedGuide = initialGuide ? clone(initialGuide) : undefined
    const id = `demo-${Date.now()}-${++this.serial}`
    const storageKey = `anew-demo-workspace:${id}`
    const storage = new MemoryDemoStorage()
    if (scenario === "returning-user") {
      storage.setItem(storageKey, JSON.stringify(createDemoBackup(this.seedGuide)))
      storage.setItem("anew-planner-tour:demo:v1", "seen")
    }
    storage.setItem("guia-locale", "en-US")
    storage.setItem("guia-bible-version", "KJV")
    this.current = Object.freeze({ id, storageKey, storage, scenario })
    return this.current
  }
  reset(): DemoSession | null { return this.current ? this.start(this.seedGuide, this.current.scenario) : null }
  exit(): void { this.current?.storage.dispose(); this.current = null; this.seedGuide = undefined }
}
