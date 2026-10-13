import "server-only"
import { AIRequestError } from "./http"
import type { JsonSchema } from "./validation"

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash"

export function aiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim()) && process.env.AI_ENABLED === "true"
}

function providerSchema(schema: JsonSchema): JsonSchema {
  // Google supports a subset of JSON Schema. String lengths are enforced locally.
  const { minLength: _min, maxLength: _max, ...rest } = schema
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
  if (!aiConfigured()) throw new AIRequestError(503, "AI is unavailable. You can still use the guide and free resources.", "AI_UNAVAILABLE")
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
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model,
        store: false,
        stream: false,
        system_instruction: options.system,
        input: JSON.stringify(options.input),
        response_format: { type: "text", mime_type: "application/json", schema: providerSchema(options.schema) },
        generation_config: { max_output_tokens: options.maxOutputTokens },
      }),
    })
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
