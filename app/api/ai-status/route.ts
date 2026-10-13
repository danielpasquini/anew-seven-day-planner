import { aiConfigured } from "@/lib/ai/gemini"
import { aiErrorResponse, aiPreflight, assertAIRequestOrigin, corsResponse, privateJson } from "@/lib/ai/http"
import { firebaseAuthConfigured } from "@/lib/auth/server"

export const runtime = "nodejs"

export function OPTIONS(req: Request) { return aiPreflight(req, "GET") }

export function GET(req: Request) {
  // Configuration presence only: this does not probe Google or confirm key validity.
  try {
    assertAIRequestOrigin(req)
    return corsResponse(req, privateJson({ available: aiConfigured() && firebaseAuthConfigured(),
      provider: "Google Gemini", consentRequired: true, accountRequired: true,
      authConfigured: firebaseAuthConfigured() }))
  } catch (error) { return corsResponse(req, aiErrorResponse(error)) }
}
