import type { GuideTemplate, Section } from "./guide-data"
import type { DemoWeek as WeekInstance } from "./demo-data"
import { isValidActivity, isValidBackup, isValidDate, isValidSections } from "./backup-validation"
import { createWeekFromGuide } from "./guide-revision"
import { buildPresetGuide, getPlannerPresets } from "./planner"
import { getNextDayDate, type Locale } from "./date-utils"
import { isValidWeekSetup, type WeekSetup } from "./week-setup"
import { selectedSpiritualPreference, selectedWeekPreference } from "./week-options"

export type WeekPlanUpdates = { title: string; sections: Section[]; weeklyPlan: GuideTemplate["weeklyPlan"] }
type Workspace = { guides: GuideTemplate[]; weeks: WeekInstance[]; activeWeekId?: string | null; activeGuideId?: string }
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Hydration reads explicit setup/metadata; daily answers never become setup or AI inputs. */
export function setupFromPreviousWeek(previous?: WeekInstance | null, template?: GuideTemplate): WeekSetup {
  if (previous?.setup && isValidWeekSetup(previous.setup)) return {
    psychology: "none", theology: "none", spirituality: false, ...copy(previous.setup),
  }
  const activities = previous?.programacao.activities ?? template?.weeklyPlan
  const preset = [...getPlannerPresets("en-US"), ...getPlannerPresets("pt-BR")].find((item) =>
    item.title === template?.title || item.description === template?.description)
  const pattern = activities?.length === 0 ? "blank"
    : activities?.length && activities.every((activity) => activity.countsTowardCompletion === false) ? "rest"
      : preset?.id ?? "gentle"
  return { pattern, expectation: "", psychology: "none", theology: "none", spirituality: false,
    ...(previous ? { name: previous.title.slice(0, 100) } : {}) }
}

/** Preference summaries are ordinary notes, never diagnoses or inferred clinical content. */
export function weekPreferenceNotes(setup: WeekSetup, locale: Locale = "en-US") {
  const en = locale === "en-US"
  return [
    { label: en ? "Week Name" : "Nome da Semana", text: setup.name ?? "" },
    { label: en ? "Time and Routine" : "Tempo e Rotina", text: setup.routine ?? "" },
    { label: en ? "What Helps" : "O Que Ajuda", text: setup.whatHelps ?? "" },
    { label: en ? "What to Avoid or Adapt" : "O Que Evitar ou Adaptar", text: setup.thingsToAvoid ?? "" },
    { label: en ? "Other Preferences" : "Outras Preferências", text: setup.additionalNotes ?? "" },
    { label: en ? "What has been weighing on you lately?" : "O que tem pesado ultimamente?", text: selectedWeekPreference("burdens", setup.burdens, setup.burdensOther, locale) },
    { label: en ? "What would you like to work on in your routine?" : "O que deseja trabalhar em sua rotina?", text: selectedWeekPreference("discipline", setup.discipline, setup.disciplineOther, locale) },
    { label: en ? "Psychological approach preference" : "Preferência de abordagem psicológica", text: selectedWeekPreference("psychology", setup.psychology, setup.psychologyOther, locale) },
    { label: en ? "Spiritual preference" : "Preferência espiritual", text: selectedSpiritualPreference(setup.spirituality, setup.theology, setup.theologyOther, locale) },
  ].filter((note) => note.text)
}

/** Every existing Week/template is retained; only the new Week carries inherited daily text. */
export function createPlannedWeekInWorkspace(
  workspace: Workspace,
  setup: WeekSetup,
  options: { id: string; guideId: string; createdAt: string; today: string; locale: Locale; title?: string; startDate?: string },
): (Workspace & { newWeek: WeekInstance }) | null {
  if (!isValidWeekSetup(setup) || (options.title !== undefined && typeof options.title !== "string")
    || (options.startDate !== undefined && typeof options.startDate !== "string")
    || workspace.weeks.some((week) => !isValidDate(week.endDate))
    || workspace.weeks.some((week) => week.id === options.id)
    || workspace.guides.some((guide) => guide.id === options.guideId)) return null
  const previous = workspace.weeks.find((week) => week.id === workspace.activeWeekId) ?? workspace.weeks[0]
  const template = workspace.guides.find((guide) => guide.id === (previous?.guideId ?? workspace.activeGuideId))
  const previousSetup = setupFromPreviousWeek(previous, template)
  const latestEnd = workspace.weeks.reduce((latest, week) => week.endDate > latest ? week.endDate : latest, "")
  const startDate = options.startDate?.trim() || (latestEnd ? getNextDayDate(latestEnd) : options.today)
  if (!isValidDate(startDate)) return null
  const guide = buildPresetGuide(setup.pattern, options.locale, {
    name: setup.name, goal: setup.expectation, routine: setup.routine, whatHelps: setup.whatHelps,
    thingsToAvoid: setup.thingsToAvoid, additionalNotes: setup.additionalNotes, intensity: setup.intensity,
  }, { id: options.guideId, createdAt: options.createdAt })
  if (previous) {
    const snapshot = previous.guideSnapshot
    guide.sections = copy(snapshot?.sections ?? template?.sections ?? guide.sections)
    guide.completionConfig = copy(snapshot?.completionConfig ?? template?.completionConfig ?? guide.completionConfig)
    guide.bibleVersion = snapshot?.bibleVersion !== undefined ? snapshot.bibleVersion : template?.bibleVersion ?? null
    if (previousSetup.pattern === setup.pattern) guide.weeklyPlan = copy(previous.programacao.activities)
    guide.scheduleTaskIds = guide.weeklyPlan.map((activity) => activity.id)
  }
  guide.theologyEnabled = setup.spirituality === true
  guide.completionConfig.theologyReviewEnabled = setup.spirituality === true
  if (!setup.spirituality || setup.theology !== "christianity") {
    guide.sections = guide.sections.map(({ scripture: _scripture, ...section }) => section)
    guide.bibleVersion = null
  }
  const title = options.title?.trim() || setup.name?.trim()
    || `${options.locale === "en-US" ? "Week" : "Semana"} ${workspace.weeks.length + 1}`
  const newWeek = createWeekFromGuide([guide], guide.id, { id: options.id, title, startDate, createdAt: options.createdAt })
  if (!newWeek) return null
  newWeek.setup = copy(setup)
  newWeek.data.text = copy(previous?.data.text ?? {})
  const next = { guides: [...workspace.guides, guide], weeks: [...workspace.weeks, newWeek],
    activeGuideId: guide.id, activeWeekId: newWeek.id }
  if (!isValidBackup({ schemaVersion: 4, ...next })) return null
  return { ...next, newWeek }
}

/** Weeks from every legacy/internal template share one chronological navigation. */
export function navigationForWeeks(weeks: WeekInstance[], activeWeekId: string | null) {
  const sorted = [...weeks].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt))
  const index = Math.max(0, sorted.findIndex((week) => week.id === activeWeekId))
  return { activeWeek: sorted[index] ?? null, previousWeek: sorted[index - 1] ?? null, nextWeek: sorted[index + 1] ?? null }
}

/** Revise one open Week's choices without changing its dates, notes, or reusable template. */
export function updateWeekSetupInWorkspace(
  workspace: Workspace, weekId: string, setup: WeekSetup, updatedAt: string, locale: Locale = "en-US",
): Workspace | null {
  if (!isValidWeekSetup(setup) || typeof updatedAt !== "string" || updatedAt.length > 100
    || !["en-US", "pt-BR"].includes(locale) || !isValidBackup({ schemaVersion: 4, ...workspace })) return null
  const week = workspace.weeks.find((item) => item.id === weekId)
  const template = workspace.guides.find((guide) => guide.id === week?.guideId)
  if (!week || !template || week.status !== "active" || !week.programacao?.activities) return null
  const patternChanged = setupFromPreviousWeek(week, template).pattern !== setup.pattern
  const activities = patternChanged ? buildPresetGuide(setup.pattern, locale, {
    goal: setup.expectation, intensity: setup.intensity,
  }, { id: `${week.id.slice(0, 100)}-pattern-${setup.pattern}`, createdAt: updatedAt }).weeklyPlan : week.programacao.activities
  const previousActivityIds = new Set(week.programacao.activities.map((activity) => activity.id))
  const data = patternChanged ? { ...week.data, done: Object.fromEntries(Object.entries(week.data.done)
    .filter(([id]) => !previousActivityIds.has(id))) } : week.data
  const counted = activities.filter((activity) => activity.countsTowardCompletion !== false)
  const done = counted.filter((activity) => data.done[activity.id]).length
  const snapshot = week.guideSnapshot ?? { id: template.id, title: template.title, version: template.version,
    completionConfig: template.completionConfig, sections: template.sections, contentLocale: template.contentLocale,
    theologyEnabled: template.theologyEnabled, bibleVersion: template.bibleVersion }
  const revisedSnapshot = { ...copy(snapshot), sections: copy(snapshot.sections ?? template.sections), theologyEnabled: setup.spirituality === true,
    completionConfig: { ...copy(snapshot.completionConfig), theologyReviewEnabled: setup.spirituality === true } }
  if (!setup.spirituality || setup.theology !== "christianity") {
    revisedSnapshot.sections = revisedSnapshot.sections?.map(({ scripture: _scripture, ...section }) => section)
    revisedSnapshot.bibleVersion = null
  }
  const revised: WeekInstance = {
    ...week, title: setup.name?.trim() || week.title, setup: copy(setup), updatedAt,
    aiReviewOutdated: Boolean(week.aiReview) || week.aiReviewOutdated,
    guideSnapshot: revisedSnapshot,
    completionSnapshot: patternChanged ? null : week.completionSnapshot,
    completedAt: patternChanged ? null : week.completedAt,
    data, programacao: patternChanged ? { ...week.programacao, activities: copy(activities) } : week.programacao,
    progresso: patternChanged ? { total: counted.length, concluidas: done, percentual: counted.length ? Math.round(done / counted.length * 100) : 0 } : week.progresso,
  }
  const next = { ...workspace, weeks: workspace.weeks.map((item) => item.id === weekId ? revised : item) }
  return isValidBackup({ schemaVersion: 4, ...next }) ? next : null
}

/** Save customization to one open Week; shared/legacy templates are never revised. */
export function updateWeekPlanInWorkspace(workspace: Workspace, weekId: string, updates: WeekPlanUpdates, updatedAt: string): Workspace | null {
  const week = workspace.weeks.find((item) => item.id === weekId)
  const template = workspace.guides.find((guide) => guide.id === week?.guideId)
  if (!week || !template || week.status !== "active" || !updates || typeof updates.title !== "string"
    || !updates.title.trim() || updates.title.trim().length > 500 || !isValidSections(updates.sections)
    || !Array.isArray(updates.weeklyPlan) || updates.weeklyPlan.length > 500
    || !updates.weeklyPlan.every(isValidActivity)
    || new Set(updates.weeklyPlan.map((activity) => activity.id)).size !== updates.weeklyPlan.length) return null
  const activities = copy(updates.weeklyPlan)
  const counted = activities.filter((activity) => activity.countsTowardCompletion !== false)
  const done = counted.filter((activity) => week.data.done[activity.id]).length
  const revised: WeekInstance = {
    ...week, title: updates.title.trim(), updatedAt, aiReviewOutdated: Boolean(week.aiReview) || week.aiReviewOutdated,
    guideSnapshot: { ...(week.guideSnapshot ?? { id: template.id, title: template.title, version: template.version,
      completionConfig: copy(template.completionConfig), theologyEnabled: template.theologyEnabled,
      contentLocale: template.contentLocale, bibleVersion: template.bibleVersion }),
      sections: copy(updates.sections.map((section, index) => ({ ...section, number: String(index + 1).padStart(2, "0") }))) },
    programacao: { ...week.programacao, activities },
    progresso: { total: counted.length, concluidas: done, percentual: counted.length ? Math.round(done / counted.length * 100) : 0 },
  }
  const next = { ...workspace, weeks: workspace.weeks.map((item) => item.id === weekId ? revised : item) }
  return isValidBackup({ schemaVersion: 4, ...next }) ? next : null
}
