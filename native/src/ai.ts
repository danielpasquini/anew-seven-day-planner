import type { GuideTemplate } from "../../lib/guide-data"
import { isValidGuide } from "../../lib/backup-validation"
import type { DraftSuggestions } from "../../lib/ai/schemas"

export function validDraftSuggestions(value: unknown): value is DraftSuggestions {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const keys = ["name", "focus", "routineSchedule", "whatHelps", "thingsToAvoid", "additionalNotes"]
  const data = value as Record<string, unknown>
  return Object.keys(data).length === keys.length && keys.every((key) => typeof data[key] === "string" && data[key].length <= (key === "name" ? 100 : 1200))
}

/** Installed apps need an explicitly configured HTTPS backend, never a guessed host. */
export function nativeAIUrl(base = process.env.EXPO_PUBLIC_API_BASE_URL): string | null {
  if (!base?.trim()) return null
  try {
    const url = new URL(base.trim())
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") return null
    return `${url.origin}/api/generate-guide`
  } catch { return null }
}
export const nativeAIConfigured = nativeAIUrl() !== null
export type NativeGuideAIResult = { draftSuggestions: DraftSuggestions } | { guideTemplate: GuideTemplate; profileSummary?: string }

export async function requestNativeGuideAI(
  body: Record<string, unknown> & { mode: "assist" | "generate"; aiConsent: boolean },
  getAIToken: () => Promise<string>, signal?: AbortSignal,
): Promise<NativeGuideAIResult> {
  if (body.aiConsent !== true) throw new Error("Confirm that the selected fields may be sent to Google Gemini before using AI.")
  const url = nativeAIUrl()
  if (!url) throw new Error("AI is awaiting a configured HTTPS backend. You can use every local preset without AI.")
  const token = await getAIToken()
  if (signal?.aborted) throw new Error("The AI request was cancelled.")
  const response = await fetch(url, { method: "POST", signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
  })
  const data: unknown = await response.json().catch(() => null)
  if (signal?.aborted) throw new Error("The AI request was cancelled.")
  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error.slice(0, 500) : "The AI service could not complete the request. Try again."
    throw new Error(message)
  }
  // A logout, ownership change or demo activation during the request discards the result.
  await getAIToken()
  if (signal?.aborted) throw new Error("The AI request was cancelled.")
  if (!data || typeof data !== "object") throw new Error("AI returned an incomplete response. Try again.")
  if (body.mode === "assist" && "draftSuggestions" in data && validDraftSuggestions(data.draftSuggestions)) {
    return { draftSuggestions: data.draftSuggestions as DraftSuggestions }
  }
  if (body.mode === "generate" && "guideTemplate" in data && isValidGuide(data.guideTemplate)) return { guideTemplate: data.guideTemplate }
  throw new Error("AI returned incomplete or invalid content. Try again.")
}
