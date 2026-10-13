import "server-only"
import { createRemoteJWKSet, jwtVerify } from "jose"
import { LEGAL_VERSION } from "@/lib/legal"
import { AIRequestError } from "@/lib/ai/http"

const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
  { timeoutDuration: 5_000, cooldownDuration: 30_000, cacheMaxAge: 60 * 60_000 },
)

export function firebaseAuthConfigured() {
  return /^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || "")
}

export async function requireAIAccount(req: Request): Promise<{ uid: string }> {
  if (!firebaseAuthConfigured()) {
    throw new AIRequestError(503, "Account access has not been configured yet. The preview is still available.", "AUTH_NOT_CONFIGURED")
  }
  const authorization = req.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ") || authorization.length > 8_200) {
    throw new AIRequestError(401, "Sign in to your account to use AI.", "AUTH_REQUIRED")
  }
  const token = authorization.slice(7).trim()
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!.trim()
  let uid = ""
  try {
    const { payload, protectedHeader } = await jwtVerify(token, googleKeys, {
      algorithms: ["RS256"], audience: project, issuer: `https://securetoken.google.com/${project}`,
      requiredClaims: ["sub", "exp", "iat", "auth_time"], maxTokenAge: "1h", clockTolerance: 5,
    })
    const now = Math.floor(Date.now() / 1000)
    if (typeof protectedHeader.kid !== "string" || !protectedHeader.kid
      || typeof payload.sub !== "string" || !payload.sub || payload.sub.length > 128 || /[\u0000-\u001F/]/.test(payload.sub)
      || typeof payload.iat !== "number" || !Number.isSafeInteger(payload.iat) || payload.iat > now + 5
      || typeof payload.exp !== "number" || !Number.isSafeInteger(payload.exp) || payload.exp <= now
      || typeof payload.auth_time !== "number" || !Number.isSafeInteger(payload.auth_time)
      || payload.auth_time <= 0 || payload.auth_time > now + 5 || payload.auth_time > payload.iat + 5
      || (payload.user_id !== undefined && payload.user_id !== payload.sub)) {
      throw new Error("invalid claims")
    }
    if (payload.email_verified !== true) {
      throw new AIRequestError(403, "Verify your email address before using AI.", "EMAIL_VERIFICATION_REQUIRED")
    }
    const firebase = payload.firebase
    if (firebase && typeof firebase === "object" && "sign_in_provider" in firebase
      && firebase.sign_in_provider === "anonymous") {
      throw new AIRequestError(401, "Sign in to a verified account to use AI.", "AUTH_REQUIRED")
    }
    uid = payload.sub
  } catch (error) {
    if (error instanceof AIRequestError) throw error
    throw new AIRequestError(401, "Your session expired or could not be verified. Sign in again.", "INVALID_AUTH_TOKEN")
  }

  const path = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/users/${encodeURIComponent(uid)}/settings/legal`
  const url = new URL(path)
  for (const name of ["usageTermsVersion", "privacyVersion", "healthVersion", "adultConfirmed", "acceptedAt"]) {
    url.searchParams.append("mask.fieldPaths", name)
  }
  try {
    // The Firebase ID token preserves owner-only Firestore Security Rules; no admin bypass.
    const response = await fetch(url, {
      cache: "no-store", headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(5_000)]),
    })
    if (response.status === 404) {
      throw new AIRequestError(403, "Review and accept the current terms and health notice before using AI.", "LEGAL_ACCEPTANCE_REQUIRED")
    }
    if (!response.ok) {
      await response.body?.cancel()
      throw new AIRequestError(503, "Your account's legal acknowledgments could not be verified. Try again later.", "LEGAL_VERIFICATION_UNAVAILABLE")
    }
    const contentLength = response.headers.get("content-length")
    if (contentLength && Number(contentLength) > 16_384) throw new Error("oversized metadata")
    const source = await response.text()
    if (source.length > 16_384) throw new Error("oversized metadata")
    const document: unknown = JSON.parse(source)
    if (!document || typeof document !== "object" || !("fields" in document)
      || !document.fields || typeof document.fields !== "object" || Array.isArray(document.fields)) {
      throw new Error("invalid consent metadata")
    }
    const fields = document.fields as Record<string, { stringValue?: unknown; booleanValue?: unknown; timestampValue?: unknown }>
    const acceptedAt = fields.acceptedAt?.timestampValue
    const acceptedTime = typeof acceptedAt === "string" ? Date.parse(acceptedAt) : NaN
    if (["usageTermsVersion", "privacyVersion", "healthVersion"].some((name) => fields[name]?.stringValue !== LEGAL_VERSION)
      || fields.adultConfirmed?.booleanValue !== true || !Number.isFinite(acceptedTime) || acceptedTime <= 0
      || acceptedTime > Date.now() + 60_000) {
      throw new AIRequestError(403, "Confirm that you are 18 or older and accept the current documents to continue.", "LEGAL_ACCEPTANCE_REQUIRED")
    }
    return { uid }
  } catch (error) {
    if (error instanceof AIRequestError) throw error
    throw new AIRequestError(503, "Your account's legal acknowledgments could not be verified. Try again later.", "LEGAL_VERIFICATION_UNAVAILABLE")
  }
}
