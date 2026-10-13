import { WEEK_OPTIONS } from "./week-options"

export const PLANNER_PATTERNS = ["rest", "gentle", "routine", "balance", "focus", "momentum", "active", "blank"] as const
export type PlannerPresetId = typeof PLANNER_PATTERNS[number]

export type WeekSetup = {
  pattern: PlannerPresetId
  expectation: string
  name?: string
  routine?: string
  whatHelps?: string
  thingsToAvoid?: string
  additionalNotes?: string
  intensity?: "very_light" | "light" | "moderate"
  burdens?: string[]
  burdensOther?: string
  discipline?: string[]
  disciplineOther?: string
  psychology?: string
  psychologyOther?: string
  spirituality?: boolean
  theology?: string
  theologyOther?: string
}

export const WEEK_SETUP_LIMITS = { expectation: 1200, name: 100, routine: 1200, whatHelps: 1200, thingsToAvoid: 1200,
  additionalNotes: 1200, burdensOther: 1200, disciplineOther: 1200, psychologyOther: 1200, theologyOther: 1200 } as const

/** Setup values stay user supplied, bounded, and separate from daily answers. */
export function isValidWeekSetup(value: unknown): value is WeekSetup {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const allowed = ["pattern", "intensity", "burdens", "discipline", "psychology", "spirituality", "theology", ...Object.keys(WEEK_SETUP_LIMITS)]
  if (Object.entries(descriptors).some(([key, descriptor]) => !allowed.includes(key) || !("value" in descriptor))) return false
  const fields = Object.fromEntries(Object.entries(descriptors).map(([key, descriptor]) => [key, descriptor.value]))
  if (!PLANNER_PATTERNS.includes(fields.pattern as PlannerPresetId) || typeof fields.expectation !== "string") return false
  if (fields.intensity !== undefined && !["very_light", "light", "moderate"].includes(fields.intensity)) return false
  if (fields.spirituality !== undefined && typeof fields.spirituality !== "boolean") return false
  for (const group of ["burdens", "discipline"] as const) {
    const values = fields[group]
    if (values !== undefined && (!Array.isArray(values) || values.length > WEEK_OPTIONS[group].length
      || new Set(values).size !== values.length || !values.every((selected) =>
        typeof selected === "string" && WEEK_OPTIONS[group].some((option) => option.id === selected)))) return false
  }
  for (const group of ["psychology", "theology"] as const) {
    if (fields[group] !== undefined && (typeof fields[group] !== "string"
      || !WEEK_OPTIONS[group].some((option) => option.id === fields[group]))) return false
  }
  return Object.entries(WEEK_SETUP_LIMITS).every(([key, limit]) => fields[key] === undefined
    ? key !== "expectation" : typeof fields[key] === "string" && fields[key].length <= limit)
}
