import { GUIDE_TEMPLATES, type Block, type GuideTemplate, type Section } from "./guide-data"

type ObjectValue = Record<string, unknown>
type BackupObject = ObjectValue & {
  weeks: ObjectValue[]
  guides?: GuideTemplate[]
  activeGuideId?: string
  activeWeekId?: string
  theme?: "light" | "dark" | "system"
  palette?: "sage" | "terracotta" | "blue" | "graphite" | "olive"
  locale?: "pt-BR" | "en-US"
  bibleVersion?: "ARA" | "NVT" | "KJV" | "NIV"
}
const object = (value: unknown): value is ObjectValue => !!value && typeof value === "object" && !Array.isArray(value)
const string = (value: unknown, max = 20000): value is string => typeof value === "string" && value.length <= max
const strings = (value: unknown, max = 200): value is string[] => Array.isArray(value) && value.length <= max && value.every((v) => string(v))
const arrayOf = (value: unknown, check: (v: unknown) => boolean, max = 500) => Array.isArray(value) && value.length <= max && value.every(check)
const id = (value: unknown): value is string => string(value, 150) && value.length > 0 && !["__proto__", "constructor", "prototype"].includes(value)
const uniqueIds = (values: unknown[]) => values.every(object) && new Set(values.map((v) => (v as ObjectValue).id)).size === values.length
const optionalString = (v: unknown, max = 20000) => v === undefined || string(v, max)
const optionalBoolean = (v: unknown) => v === undefined || typeof v === "boolean"
const positiveInteger = (v: unknown) => Number.isInteger(v) && Number(v) > 0
const validLocale = (v: unknown) => v === undefined || ["pt-BR", "en-US"].includes(String(v))
const validBibleVersion = (v: unknown) => v === undefined || v === null || ["ARA", "NVT", "KJV", "NIV"].includes(String(v))
const validTime = (v: unknown) => string(v, 5) && /^([01]\d|2[0-3]):[0-5]\d$/.test(v)
const dayIndex = (v: unknown) => Number.isInteger(v) && Number(v) >= 0 && Number(v) <= 6

export function isValidDate(value: unknown): value is string {
  if (!string(value, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  if (Number(value.slice(0, 4)) < 100) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export const isValidActivity = (v: unknown) => object(v) && id(v.id) && dayIndex(v.dayIndex) && validTime(v.time) && string(v.description, 3000) && Number.isFinite(v.order) && Number(v.order) >= 0 && optionalBoolean(v.countsTowardCompletion)
const activity = isValidActivity
const completionConfig = (v: unknown) => object(v) && typeof v.enabled === "boolean" && string(v.reviewTitle, 300) && strings(v.analysisDimensions, 30) && strings(v.nextWeekFocusRules, 30) && typeof v.theologyReviewEnabled === "boolean"
const field = (v: unknown) => object(v) && (v.kind === "static" ? string(v.text) : ["text", "textarea", "scale"].includes(String(v.kind)) && id(v.id) && string(v.label) && (v.max === undefined || Number.isInteger(v.max) && Number(v.max) >= 1 && Number(v.max) <= 100))
const verse = (v: unknown) => object(v) && string(v.ref, 300) && string(v.ara) && string(v.nvt) && optionalString(v.kjv) && optionalString(v.niv)
const scripture = (v: unknown) => object(v) && arrayOf(v.verses, verse, 100) && string(v.comentario) && string(v.oracao)

export function isValidBlock(value: unknown): value is Block {
  if (!object(value)) return false
  switch (value.type) {
    case "lead": case "p": case "h": return string(value.text)
    case "note": return string(value.text) && (value.label === undefined || string(value.label))
    case "list": return strings(value.items)
    case "table": return strings(value.head, 30) && arrayOf(value.rows, (row) => strings(row, 30), 200)
    case "fields": return arrayOf(value.fields, field, 150) && (value.title === undefined || string(value.title)) && (value.note === undefined || string(value.note))
    case "ladder": return id(value.id) && strings(value.head, 3) && value.head.length === 3 && arrayOf(value.rows, (r) => object(r) && id(r.id) && string(r.label), 150)
    case "schedule": return id(value.id) && strings(value.cols, 3) && value.cols.length === 3 && arrayOf(value.rows, (r) => object(r) && id(r.id) && string(r.day) && strings(r.tasks, 3) && r.tasks.length === 3, 150)
    default: return false
  }
}

export function isValidSections(value: unknown): value is Section[] {
  if (!arrayOf(value, (s) => object(s) && id(s.id) && string(s.number, 20) && string(s.title, 500) && string(s.kicker, 500) && arrayOf(s.blocks, isValidBlock, 150) && (s.scripture === undefined || scripture(s.scripture)), 60) || !uniqueIds(value as unknown[])) return false
  // Duplicate custom field IDs would alias two answers to the same storage key.
  const fieldIds = (value as Section[]).flatMap((section) => section.blocks.flatMap((block) =>
    block.type === "fields" ? block.fields.filter((f) => f.kind !== "static").map((f) => (f as { id: string }).id) : []))
  return new Set(fieldIds).size === fieldIds.length
}

export function isValidGuide(value: unknown): value is GuideTemplate {
  if (!object(value) || !id(value.id) || !string(value.title, 300) || !string(value.description) || !positiveInteger(value.version) || typeof value.theologyEnabled !== "boolean") return false
  if (!optionalBoolean(value.customized)) return false
  if (!object(value.config) || !object(value.intro) || !string(value.intro.title) || !string(value.intro.subtitle) || !string(value.intro.oracao) || !object(value.intro.salmo)) return false
  const salmo = value.intro.salmo
  if (!optionalString(value.config.targetAudience) || !optionalString(value.config.category) || !validLocale(value.contentLocale) || !validBibleVersion(value.bibleVersion) || !optionalString(value.profileSummary)) return false
  if (value.safetyNotes !== undefined && !strings(value.safetyNotes, 200)) return false
  if (value.quickSheets !== undefined && (!arrayOf(value.quickSheets, (s) => object(s) && id(s.id) && string(s.title, 500) && string(s.summary), 200) || !uniqueIds(value.quickSheets as unknown[]))) return false
  if (!["ref", "ara", "nvt"].every((key) => string(salmo[key]))) return false
  if (!["kjv", "niv"].every((key) => optionalString(salmo[key]))) return false
  if (!isValidSections(value.sections)) return false
  return completionConfig(value.completionConfig) && strings(value.scheduleTaskIds, 3000) && arrayOf(value.weeklyPlan, activity, 500) && uniqueIds(value.weeklyPlan as unknown[])
}

const recordOf = (value: unknown, check: (v: unknown) => boolean) => object(value) && Object.keys(value).length <= 5000 && Object.entries(value).every(([key, v]) => id(key) && check(v))
const week = (v: unknown) => {
  if (!object(v) || !id(v.id) || !string(v.title, 500) || !isValidDate(v.startDate) || !isValidDate(v.endDate) || !string(v.createdAt, 100)) return false
  if (v.endDate < v.startDate || !optionalString(v.updatedAt, 100) || !optionalBoolean(v.aiReviewOutdated)) return false
  if (["guideId", "templateId"].some((key) => v[key] !== undefined && !id(v[key]))) return false
  if (v.guideVersion !== undefined && !positiveInteger(v.guideVersion)) return false
  if (v.status !== undefined && v.status !== "active" && v.status !== "completed") return false
  if (!object(v.data) || !recordOf(v.data.text, (text) => string(text, 100000)) || !recordOf(v.data.done, (done) => typeof done === "boolean")) return false
  if (v.programacao !== undefined && (!object(v.programacao) || !arrayOf(v.programacao.activities, activity) || !uniqueIds(v.programacao.activities as unknown[]))) return false
  if (v.guideSnapshot !== undefined && v.guideSnapshot !== null && (!object(v.guideSnapshot) || !id(v.guideSnapshot.id) || !string(v.guideSnapshot.title, 300) || !positiveInteger(v.guideSnapshot.version) || !completionConfig(v.guideSnapshot.completionConfig) || !optionalBoolean(v.guideSnapshot.theologyEnabled) || !validLocale(v.guideSnapshot.contentLocale) || !validBibleVersion(v.guideSnapshot.bibleVersion))) return false
  if (object(v.guideSnapshot) && v.guideSnapshot.sections !== undefined && !isValidSections(v.guideSnapshot.sections)) return false
  if (v.aiReview !== undefined && v.aiReview !== null && (!object(v.aiReview) || !string(v.aiReview.verdict) || !string(v.aiReview.summary) || !["whatWorked", "difficulties", "observedPatterns", "nextWeekSuggestions"].every((key) => strings((v.aiReview as ObjectValue)[key])))) return false
  if (v.completionSnapshot !== undefined && v.completionSnapshot !== null && (!object(v.completionSnapshot) || !Number.isFinite(v.completionSnapshot.totalTasks) || !Number.isFinite(v.completionSnapshot.completedTasks) || !Number.isFinite(v.completionSnapshot.completionPercentage) || !arrayOf(v.completionSnapshot.taskResults, (t) => object(t) && id(t.id) && string(t.description) && typeof t.done === "boolean" && (t.dayIndex === undefined || dayIndex(t.dayIndex)) && (t.time === undefined || validTime(t.time)) && optionalBoolean(t.countsTowardCompletion)))) return false
  return true
}

/** Validate every entity before any state changes; v2/v3 legacy week backups remain supported. */
export function isValidBackup(value: unknown): value is BackupObject {
  if (!object(value) || !Array.isArray(value.weeks) || value.weeks.length === 0 || !arrayOf(value.weeks, week, 3000) || !uniqueIds(value.weeks)) return false
  if (value.schemaVersion !== undefined && (![1, 2, 3, 4].includes(value.schemaVersion as number))) return false
  if (value.guides !== undefined && (!Array.isArray(value.guides) || value.guides.length === 0 || !arrayOf(value.guides, isValidGuide, 250) || !uniqueIds(value.guides))) return false
  const guides = (value.guides as GuideTemplate[] | undefined) ?? GUIDE_TEMPLATES
  if (!(value.weeks as ObjectValue[]).every((w) => {
    const guideId = w.guideId || w.templateId || GUIDE_TEMPLATES[0].id
    return guides.some((g) => g.id === guideId) && (!w.guideSnapshot || (w.guideSnapshot as ObjectValue).id === guideId)
  })) return false
  if (["activeGuideId", "activeWeekId"].some((key) => value[key] !== undefined && value[key] !== null && !id(value[key]))) return false
  const enums: Record<string, string[]> = { theme: ["light", "dark", "system"], palette: ["sage", "terracotta", "blue", "graphite", "olive"], locale: ["pt-BR", "en-US"], bibleVersion: ["ARA", "NVT", "KJV", "NIV"] }
  if (Object.entries(enums).some(([key, options]) => value[key] !== undefined && !options.includes(String(value[key])))) return false
  return true
}
