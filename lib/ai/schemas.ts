import type { JsonSchema } from "./validation"

const text = (maxLength = 1800, minLength = 1): JsonSchema => ({ type: "string", minLength, maxLength })
const list = (items: JsonSchema, minItems = 1, maxItems = 8): JsonSchema => ({ type: "array", items, minItems, maxItems })
const object = (properties: Record<string, JsonSchema>, required = Object.keys(properties)): JsonSchema =>
  ({ type: "object", properties, required, additionalProperties: false })
const tagged = (type: string, properties: Record<string, JsonSchema>, required = Object.keys(properties)) =>
  object({ type: { type: "string", enum: [type] }, ...properties }, ["type", ...required])

const fieldSchema: JsonSchema = { anyOf: [
  object({ kind: { type: "string", enum: ["static"] }, text: text(600) }),
  object({ kind: { type: "string", enum: ["text", "textarea"] }, label: text(180) }),
  object({ kind: { type: "string", enum: ["scale"] }, label: text(180), max: { type: "integer", minimum: 2, maximum: 10 } }),
] }

const blockSchema: JsonSchema = { anyOf: [
  ...["lead", "p", "h"].map((type) => tagged(type, { text: text() })),
  tagged("note", { label: text(120), text: text() }, ["text"]),
  tagged("list", { items: list(text(500), 1, 8) }),
  tagged("table", { head: list(text(140), 2, 5), rows: list(list(text(500), 2, 5), 1, 8) }),
  tagged("fields", { label: text(160), fields: list(fieldSchema, 1, 5) }, ["fields"]),
  tagged("ladder", { head: list(text(140), 3, 3), ladderRows: list(object({ label: text(300) }), 2, 6) }),
] }

export const guideOutputSchema = object({
  description: text(600),
  profileSummary: text(700),
  intro: object({ title: text(120), subtitle: text(300), oracao: text(700, 0), salmoReference: text(100, 0) }, ["title", "subtitle"]),
  sections: list(object({
    kicker: text(80), title: text(150), blocks: list(blockSchema, 1, 4),
    scriptureReferences: list(text(100), 0, 2), scriptureCommentary: text(600, 0), scripturePrayer: text(600, 0),
  }, ["kicker", "title", "blocks"]), 1, 12),
  weeklyPlan: list(object({
    dayIndex: { type: "integer", minimum: 0, maximum: 6 },
    time: text(5), description: text(300),
    countsTowardCompletion: { type: "boolean" },
  }, ["dayIndex", "time", "description"]), 7, 21),
  quickSheets: list(object({ title: text(120), summary: text(700) }), 0, 5),
  completionConfig: object({ reviewTitle: text(150), analysisDimensions: list(text(250), 2, 6), nextWeekFocusRules: list(text(250), 1, 4) }),
  safetyNotes: list(text(400), 1, 5),
})

export type RawField = { kind: "static"; text: string } | { kind: "text" | "textarea" | "scale"; label: string; max?: number }
export type RawBlock = {
  type: "lead" | "p" | "h" | "note" | "list" | "table" | "fields" | "ladder"
  text?: string; label?: string; items?: string[]; head?: string[]; rows?: string[][]
  fields?: RawField[]; ladderRows?: { label: string }[]
}
export type RawGuide = {
  description: string; profileSummary: string
  intro: { title: string; subtitle: string; oracao?: string; salmoReference?: string }
  sections: { kicker: string; title: string; blocks: RawBlock[]; scriptureReferences?: string[]; scriptureCommentary?: string; scripturePrayer?: string }[]
  weeklyPlan: { dayIndex: number; time: string; description: string; countsTowardCompletion?: boolean }[]
  quickSheets: { title: string; summary: string }[]
  completionConfig: { reviewTitle: string; analysisDimensions: string[]; nextWeekFocusRules: string[] }
  safetyNotes: string[]
}

export const draftSuggestionsSchema = object({
  name: text(100, 0), focus: text(1200, 0), routineSchedule: text(1200, 0),
  whatHelps: text(1200, 0), thingsToAvoid: text(1200, 0), additionalNotes: text(1200, 0),
})
export type DraftSuggestions = {
  name: string; focus: string; routineSchedule: string; whatHelps: string; thingsToAvoid: string; additionalNotes: string
}

export const reviewOutputSchema = object({
  verdict: text(500), summary: text(1400),
  whatWorked: list(text(400), 0, 4), difficulties: list(text(400), 0, 3),
  observedPatterns: list(text(400), 0, 3), nextWeekSuggestions: list(text(400), 1, 3),
})
export type RawReview = {
  verdict: string; summary: string; whatWorked: string[]; difficulties: string[]
  observedPatterns: string[]; nextWeekSuggestions: string[]
}
