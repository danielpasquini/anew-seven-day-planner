import type { GuideTemplate, Section } from "./guide-data"
import type { DemoWeek as WeekInstance } from "./demo-data"
import { isValidDate, isValidGuide, isValidSections } from "./backup-validation"
import { calculateInclusiveEndDate } from "./date-utils"

export type GuideUpdates = {
  title: string
  description: string
  sections: Section[]
  weeklyPlan: GuideTemplate["weeklyPlan"]
}

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Revise the reusable anchor only. Existing weeks retain their exact objects. */
export function reviseGuideInWorkspace<T>(
  workspace: { guides: GuideTemplate[]; weeks: T[] },
  guideId: string,
  updates: GuideUpdates,
  updatedAt: string,
): { guides: GuideTemplate[]; weeks: T[] } | null {
  const guide = workspace.guides.find((item) => item.id === guideId)
  if (!guide || !updates || typeof updates.title !== "string" || !updates.title.trim()
    || typeof updates.description !== "string" || !isValidSections(updates.sections)
    || !Array.isArray(updates.weeklyPlan)) return null
  const revision: GuideTemplate = {
    ...guide,
    title: updates.title.trim(),
    description: updates.description.trim(),
    intro: { ...guide.intro, title: updates.title.trim() },
    sections: updates.sections.map((section, index) => ({ ...section, number: String(index + 1).padStart(2, "0") })),
    weeklyPlan: updates.weeklyPlan,
    scheduleTaskIds: updates.weeklyPlan.map((activity) => activity?.id),
    customized: true,
    version: guide.version + 1,
    updatedAt,
  }
  if (!isValidGuide(revision)) return null
  return {
    guides: workspace.guides.map((item) => item.id === guideId ? copy(revision) : item),
    weeks: workspace.weeks,
  }
}

/** Allocate IDs/timestamps in the caller; every new week starts with detached defaults. */
export function createWeekFromGuide(
  guides: GuideTemplate[],
  guideId: string,
  options: { id: string; title: string; startDate: string; createdAt: string },
): WeekInstance | null {
  const guide = guides.find((item) => item.id === guideId)
  if (!guide || !isValidGuide(guide) || !options || !isValidDate(options.startDate)
    || typeof options.id !== "string" || !options.id || ["__proto__", "constructor", "prototype"].includes(options.id)
    || options.id.length > 150 || typeof options.title !== "string" || options.title.length > 500
    || typeof options.createdAt !== "string" || options.createdAt.length > 100) return null
  const endDate = calculateInclusiveEndDate(options.startDate)
  if (!isValidDate(endDate)) return null
  const activities = copy(guide.weeklyPlan)
  const total = activities.filter((activity) => activity.countsTowardCompletion !== false).length
  return {
    id: options.id, guideId: guide.id, templateId: guide.id, guideVersion: guide.version,
    guideSnapshot: {
      id: guide.id, title: guide.title, version: guide.version,
      completionConfig: copy(guide.completionConfig), sections: copy(guide.sections),
      theologyEnabled: guide.theologyEnabled, contentLocale: guide.contentLocale, bibleVersion: guide.bibleVersion,
    },
    title: options.title, startDate: options.startDate, endDate,
    createdAt: options.createdAt, updatedAt: options.createdAt,
    status: "active", completedAt: null, completionSnapshot: null,
    aiReview: null, aiReviewVersion: 1, aiReviewOutdated: false,
    data: { text: {}, done: {} }, programacao: { dias: 7, activities },
    progresso: { total, concluidas: 0, percentual: 0 },
  }
}

/** Historical prompts follow the week snapshot, including intentionally empty sections. */
export function sectionsForWeek(week: WeekInstance, guide: GuideTemplate): Section[] {
  return week.guideSnapshot?.sections ?? guide.sections
}
