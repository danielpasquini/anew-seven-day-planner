import "server-only"
import { createHash } from "node:crypto"
import { NextResponse } from "next/server"

export class AIRequestError extends Error {
  constructor(public status: number, message: string, public code = "INVALID_REQUEST") {
    super(message)
  }
}

const privateHeaders = { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" }

const nativeOrigins = new Set(["capacitor://localhost", "https://localhost"])
function originAllowed(req: Request, origin: string) {
  if (origin === new URL(req.url).origin || nativeOrigins.has(origin)) return true
  return (process.env.AI_ALLOWED_ORIGINS || "").split(",").some((value) => {
    const configured = value.trim()
    if (!configured || configured === "*") return false
    try {
      const url = new URL(configured)
      const localDevelopment = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)
      return (url.protocol === "https:" || localDevelopment) && url.origin === configured && configured === origin
    } catch { return false }
  })
}

export function assertAIRequestOrigin(req: Request) {
  const origin = req.headers.get("origin")
  if ((origin && !originAllowed(req, origin)) || (!origin && req.headers.get("sec-fetch-site") === "cross-site")) {
    throw new AIRequestError(403, "This request must come from an authorized app.", "ORIGIN_REJECTED")
  }
}

export function corsResponse(req: Request, response: Response) {
  const origin = req.headers.get("origin")
  if (origin && originAllowed(req, origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin)
    response.headers.set("Vary", "Origin")
  }
  return response
}

export function aiPreflight(req: Request, method: "GET" | "POST") {
  try {
    assertAIRequestOrigin(req)
    const requestedMethod = req.headers.get("access-control-request-method")
    const requestedHeaders = (req.headers.get("access-control-request-headers") || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean)
    if ((requestedMethod && requestedMethod !== method) || requestedHeaders.some((name) => !["authorization", "content-type"].includes(name))) {
      throw new AIRequestError(403, "The requested method or headers are not allowed.", "ORIGIN_REJECTED")
    }
    return corsResponse(req, new Response(null, { status: 204, headers: {
      ...privateHeaders, "Access-Control-Allow-Methods": `${method}, OPTIONS`,
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    } }))
  } catch (error) { return corsResponse(req, aiErrorResponse(error)) }
}

export function privateJson(data: unknown, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(data, { status, headers: { ...privateHeaders, ...headers } })
}

export function aiErrorResponse(error: unknown) {
  if (error instanceof AIRequestError) {
    return privateJson({ error: error.message, code: error.code }, error.status,
      error.status === 429 ? { "Retry-After": "60" } : undefined)
  }
  // Never log provider responses, profiles, answers, API keys, or thrown request bodies.
  return privateJson({ error: "The request could not be completed. Please try again.", code: "INTERNAL_ERROR" }, 500)
}

export async function readAIRequest(req: Request): Promise<Record<string, unknown>> {
  assertAIRequestOrigin(req)
  const contentType = req.headers.get("content-type")?.split(";")[0].trim().toLowerCase()
  if (contentType !== "application/json") {
    throw new AIRequestError(415, "Send the request as JSON.")
  }
  const maxBytes = 80 * 1024
  const declaredBytes = req.headers.get("content-length")
  if (declaredBytes && Number(declaredBytes) > maxBytes) {
    throw new AIRequestError(413, "This request is too large. Shorten the text.", "PAYLOAD_TOO_LARGE")
  }
  if (!req.body) throw new AIRequestError(400, "The request body is missing.")
  const reader = req.body.getReader()
  const decoder = new TextDecoder("utf-8", { fatal: true })
  let bytes = 0
  let source = ""
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > maxBytes) {
        await reader.cancel()
        throw new AIRequestError(413, "This request is too large. Shorten the text.", "PAYLOAD_TOO_LARGE")
      }
      source += decoder.decode(value, { stream: true })
    }
    source += decoder.decode()
    const parsed: unknown = JSON.parse(source)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid")
    const body = parsed as Record<string, unknown>
    if (body.aiConsent !== true) {
      throw new AIRequestError(403, "Confirm that the selected information may be sent to Google Gemini before using AI.", "CONSENT_REQUIRED")
    }
    return body
  } catch (error) {
    if (error instanceof AIRequestError) throw error
    throw new AIRequestError(400, "The request contains invalid JSON.")
  } finally {
    reader.releaseLock()
  }
}

// A bounded, per-process backstop, not distributed authentication or a production quota service.
const windows = new Map<string, { count: number; expires: number }>()
const windowMs = 60_000
export function limitAIRequest(_req: Request, uid: string) {
  const now = Date.now()
  for (const [key, entry] of windows) if (entry.expires <= now) windows.delete(key)
  if (!uid || uid.length > 128) throw new AIRequestError(401, "Sign in to your account to use AI.", "AUTH_REQUIRED")
  const key = createHash("sha256").update(`account:${uid}`).digest("hex")
  const entry = windows.get(key) || { count: 0, expires: now + windowMs }
  const limit = 6
  if (entry.count >= limit || (!windows.has(key) && windows.size >= 2_000)) {
    throw new AIRequestError(429, "The request limit has been reached. Wait one minute before trying again.", "RATE_LIMITED")
  }
  entry.count += 1
  windows.set(key, entry)
}
