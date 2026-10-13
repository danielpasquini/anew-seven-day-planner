import { AIRequestError } from "./http"

export function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AIRequestError(400, `${label} must be a valid object.`)
  }
  return value as Record<string, unknown>
}

export function textValue(value: unknown, label: string, max = 1200, required = false) {
  if (value == null && !required) return ""
  if (typeof value !== "string") throw new AIRequestError(400, `${label} must be text.`)
  const text = value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
  if (text.length > max) throw new AIRequestError(400, `${label} must contain no more than ${max} characters.`)
  if (required && !text) throw new AIRequestError(400, `${label} is required.`)
  return text
}

export function booleanValue(value: unknown, label: string, defaultValue = false) {
  if (value === undefined) return defaultValue
  if (typeof value !== "boolean") throw new AIRequestError(400, `${label} must be true or false.`)
  return value
}

export function enumValue<T extends string>(value: unknown, values: readonly T[], label: string, defaultValue: T): T {
  if (value === undefined) return defaultValue
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw new AIRequestError(400, `${label} contains an invalid option.`)
  }
  return value as T
}

export function stringList(value: unknown, label: string, maxItems = 12, maxLength = 300) {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new AIRequestError(400, `${label} must contain no more than ${maxItems} items.`)
  }
  return value.map((item) => textValue(item, label, maxLength, true))
}

export function integerValue(value: unknown, label: string, minimum: number, maximum: number) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new AIRequestError(400, `${label} contains an invalid number.`)
  }
  return value
}

// Best-effort minimization. This does not anonymize narratives or infer what is sensitive.
export function minimizeText(text: string) {
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email omitted]")
    .replace(/\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b/g, "[document number omitted]")
    .replace(/(?:\+55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}\b/g, "[phone number omitted]")
}

export type JsonSchema = {
  type?: "object" | "array" | "string" | "boolean" | "integer" | "number"
  properties?: Record<string, JsonSchema>
  required?: string[]
  additionalProperties?: boolean
  items?: JsonSchema
  minItems?: number
  maxItems?: number
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  enum?: (string | number)[]
  anyOf?: JsonSchema[]
}

export function matchesSchema(value: unknown, schema: JsonSchema): boolean {
  if (schema.anyOf) return schema.anyOf.some((candidate) => matchesSchema(value, candidate))
  if (schema.enum && !schema.enum.includes(value as string | number)) return false
  if (schema.type === "string") {
    return typeof value === "string" && value.trim().length >= (schema.minLength ?? 0)
      && value.length <= (schema.maxLength ?? 2400)
  }
  if (schema.type === "boolean") return typeof value === "boolean"
  if (schema.type === "integer" || schema.type === "number") {
    return typeof value === "number" && Number.isFinite(value)
      && (schema.type !== "integer" || Number.isSafeInteger(value))
      && value >= (schema.minimum ?? -Infinity) && value <= (schema.maximum ?? Infinity)
  }
  if (schema.type === "array") {
    return Array.isArray(value) && value.length >= (schema.minItems ?? 0)
      && value.length <= (schema.maxItems ?? 40)
      && (!schema.items || value.every((item) => matchesSchema(item, schema.items!)))
  }
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false
    const data = value as Record<string, unknown>
    if (schema.required?.some((name) => !Object.hasOwn(data, name))) return false
    if (schema.additionalProperties === false && Object.keys(data).some((name) => !Object.hasOwn(schema.properties || {}, name))) return false
    return Object.entries(schema.properties || {}).every(([name, shape]) =>
      !Object.hasOwn(data, name) || matchesSchema(data[name], shape))
  }
  return false
}

export function checkedOutput<T>(value: unknown, schema: JsonSchema): T {
  if (!matchesSchema(value, schema)) {
    throw new AIRequestError(502, "AI returned incomplete or invalid content. Please try again.", "INVALID_AI_OUTPUT")
  }
  return value as T
}

export function checkOutputSafety(value: unknown, spiritualityEnabled: boolean) {
  const strings: string[] = []
  function collect(node: unknown) {
    if (typeof node === "string") strings.push(node)
    else if (Array.isArray(node)) node.forEach(collect)
    else if (node && typeof node === "object") Object.values(node).forEach(collect)
  }
  collect(value)
  const text = strings.join("\n")
  const diagnosticClaim = /(?:voc[eê] tem|voc[eê] sofre de|seu diagn[oó]stico [eé]|you have|your diagnosis is)\s+(?:um |uma |an? )?(?:transtorno|depress[aã]o|bipolaridade|esquizofrenia|autismo|TDAH|PTSD|ADHD|bipolar disorder|schizophrenia|(?:major )?depression|anxiety disorder|autism)/i
  const religiousContent = /\b(?:ora[cç][aã]o|salmos?|b[ií]blia|escritura sagrada|Jesus|Deus|pecado|religios[oa]s?|espiritualidade|igreja|prayer|psalms?|bible|scripture|God|sin|religious|religion|spirituality|church|Allah|Alcor[aã]o|Quran|Torah|Buddha)\b/i
  if (diagnosticClaim.test(text) || (!spiritualityEnabled && religiousContent.test(text))) {
    throw new AIRequestError(502, "The AI response did not respect this week's preferences or safety limits. Please try again.", "UNSAFE_AI_OUTPUT")
  }
}
