import "server-only"
import { setTimeout as delay } from "node:timers/promises"
import { AIRequestError } from "./http"
import type { JsonSchema } from "./validation"

export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite"

export function aiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim()) && process.env.AI_ENABLED === "true"
}

function providerSchema(schema: JsonSchema): JsonSchema {
  if (schema.anyOf?.every((branch) => branch.type === "object" && branch.properties)) {
    // Gemini's decoder rejects nested object unions or emits empty objects when
    // only their type is supplied. Send a tagged superset; callers still validate
    // the response against the original strict per-tag schema before using it.
    const branches = schema.anyOf
    const properties: Record<string, JsonSchema> = {}
    for (const branch of branches) for (const [key, value] of Object.entries(branch.properties!)) {
      const previous = properties[key]
      properties[key] = previous ? {
        ...previous,
        ...(previous.enum && value.enum ? { enum: [...new Set([...previous.enum, ...value.enum])] } : {}),
        ...(previous.minItems !== undefined && value.minItems !== undefined ? { minItems: Math.min(previous.minItems, value.minItems) } : {}),
        ...(previous.maxItems !== undefined && value.maxItems !== undefined ? { maxItems: Math.max(previous.maxItems, value.maxItems) } : {}),
      } : value
    }
    return providerSchema({ type: "object", properties, additionalProperties: false,
      required: (branches[0].required ?? []).filter((key) => branches.every((branch) => branch.required?.includes(key))) })
  }
  // Nested array bounds make this guide schema exceed Gemini's decoder limits.
  // Enforce all lengths and item counts with the original schema on our server.
  const { minLength: _min, maxLength: _max, minItems: _minItems, maxItems: _maxItems, ...rest } = schema
  return {
    ...rest,
    ...(schema.properties ? { properties: Object.fromEntries(Object.entries(schema.properties)
      .map(([key, value]) => [key, providerSchema(value)])) } : {}),
    ...(schema.items ? { items: providerSchema(schema.items) } : {}),
    ...(schema.anyOf ? { anyOf: schema.anyOf.map(providerSchema) } : {}),
  }
}

export async function generateStructuredJSON(options: {
  system: string
  input: unknown
  schema: JsonSchema
  signal: AbortSignal
  maxOutputTokens: number
}): Promise<unknown> {
  if (!aiConfigured()) throw new AIRequestError(503, "AI is unavailable. You can still use the week planner and free resources.", "AI_UNAVAILABLE")
  const apiKey = process.env.GEMINI_API_KEY!.trim()
  const model = (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim()
  if (!/^gemini-[a-z0-9][a-z0-9.-]{1,80}$/.test(model)) {
    throw new AIRequestError(503, "The app operator needs to review the AI configuration.", "AI_CONFIGURATION_ERROR")
  }
  const configuredTimeout = Number(process.env.GEMINI_TIMEOUT_MS || 45_000)
  const timeout = Number.isFinite(configuredTimeout) ? Math.min(60_000, Math.max(5_000, configuredTimeout)) : 45_000
  const controller = new AbortController()
  const abortRequest = () => controller.abort()
  options.signal.addEventListener("abort", abortRequest, { once: true })
  if (options.signal.aborted) controller.abort()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const request = {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model,
        store: false,
        stream: false,
        system_instruction: `${options.system}\nFor tagged objects, omit properties unrelated to the selected tag. Blocks tagged lead, p, or h need text; note needs text and may have label; list needs items; table needs head and rows; fields needs fields and may have label; ladder needs head and ladderRows. Fields tagged static need only kind and text; text or textarea need only kind and label; scale needs only kind, label, and max. Never return empty tagged objects.`,
        input: JSON.stringify(options.input),
        response_format: { type: "text", mime_type: "application/json", schema: providerSchema(options.schema) },
        generation_config: { max_output_tokens: options.maxOutputTokens },
      }),
    } satisfies RequestInit
    let response: Response | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", request)
      if (attempt === 2 || ![408, 500, 502, 503, 504].includes(response.status)) break
      // Retry transient errors with exponential backoff
      await response.body?.cancel()
      await delay(1000 * 2 ** attempt + Math.floor(Math.random() * 250), undefined, { signal: controller.signal })
    }
    if (!response) throw new Error("missing provider response")
    if (!response.ok) {
      await response.body?.cancel()
      if (response.status === 429) throw new AIRequestError(429, "The AI provider's usage limit has been reached. Wait one minute before trying again.", "PROVIDER_RATE_LIMITED")
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        throw new AIRequestError(503, "AI is unavailable. The app operator needs to review provider access.", "AI_CONFIGURATION_ERROR")
      }
      throw new AIRequestError(502, "The AI provider could not complete this request. Try again later.", "PROVIDER_UNAVAILABLE")
    }
    // Bound the upstream body even if content-length is missing or inaccurate.
    if (!response.body) throw new AIRequestError(502, "AI returned an empty response. Please try again.", "INVALID_AI_OUTPUT")
    const reader = response.body.getReader()
    let text = ""
    let byteCount = 0
    const decoder = new TextDecoder()
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        byteCount += value.byteLength
        if (byteCount > 256 * 1024) {
          await reader.cancel()
          throw new AIRequestError(502, "The AI response exceeded the allowed size. Please try again.", "INVALID_AI_OUTPUT")
        }
        text += decoder.decode(value, { stream: true })
      }
      text += decoder.decode()
    } finally {
      reader.releaseLock()
    }
    const envelope: unknown = JSON.parse(text)
    if (!envelope || typeof envelope !== "object") throw new Error("invalid envelope")
    const data = envelope as Record<string, unknown>
    if (data.status !== "completed" || !Array.isArray(data.steps)) throw new Error("incomplete response")
    const outputText = data.steps.flatMap((step: unknown) => {
      if (!step || typeof step !== "object") return []
      const item = step as Record<string, unknown>
      if (item.type !== "model_output" || !Array.isArray(item.content)) return []
      return item.content.flatMap((part: unknown) => {
        if (!part || typeof part !== "object") return []
        const block = part as Record<string, unknown>
        return block.type === "text" && typeof block.text === "string" ? [block.text] : []
      })
    }).join("")
    if (!outputText || outputText.length > 100_000) throw new Error("empty or oversized output")
    return JSON.parse(outputText)
  } catch (error) {
    if (error instanceof AIRequestError) throw error
    if (controller.signal.aborted) throw new AIRequestError(504, "AI took too long to respond. Try again later.", "AI_TIMEOUT")
    throw new AIRequestError(502, "AI returned an invalid response or is unavailable. Please try again.", "INVALID_AI_OUTPUT")
  } finally {
    clearTimeout(timer)
    options.signal.removeEventListener("abort", abortRequest)
  }
}
