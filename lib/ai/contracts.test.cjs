const { test, after } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
const crypto = require("node:crypto")
const jose = require("jose")
const testKeys = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 })
const testJwk = { ...testKeys.publicKey.export({ format: "jwk" }), kid: "fixture-key", alg: "RS256", use: "sig" }
let identityCounter = 0

function testToken(overrides = {}, signingKey = testKeys.privateKey) {
  const now = Math.floor(Date.now() / 1000)
  const payload = { sub: `fixture-user-${++identityCounter}`, iss: "https://securetoken.google.com/test-project",
    aud: "test-project", iat: now, exp: now + 3600, auth_time: now - 10, email_verified: true, ...overrides }
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "fixture-key" })).toString("base64url")
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const input = `${header}.${body}`
  return `${input}.${crypto.sign("RSA-SHA256", Buffer.from(input), signingKey).toString("base64url")}`
}

// Execute the real TypeScript route/helper sources without a dev server or provider request.
const root = path.resolve(__dirname, "../..")
const cache = new Map()
function loadSource(filename) {
  const absolute = path.resolve(filename)
  if (cache.has(absolute)) return cache.get(absolute)
  const module = { exports: {} }
  cache.set(absolute, module.exports)
  const output = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const localRequire = (name) => {
    if (name === "server-only") return {}
    // Replace the remote public-key resolver with fixture keys, retaining real jose signature/claim verification.
    if (name === "jose") return { ...jose, createRemoteJWKSet: () => jose.createLocalJWKSet({ keys: [testJwk] }) }
    if (name.startsWith("@/")) return loadSource(path.join(root, `${name.slice(2)}.ts`))
    if (name.startsWith(".")) return loadSource(path.resolve(path.dirname(absolute), `${name}.ts`))
    return require(name)
  }
  new Function("module", "exports", "require", output)(module, module.exports, localRequire)
  cache.set(absolute, module.exports)
  return module.exports
}

const generate = loadSource(path.join(root, "app/api/generate-guide/route.ts"))
const analyze = loadSource(path.join(root, "app/api/analyze-week/route.ts"))
const validation = loadSource(path.join(root, "lib/ai/validation.ts"))
const schemas = loadSource(path.join(root, "lib/ai/schemas.ts"))
const { LEGAL_VERSION } = loadSource(path.join(root, "lib/legal.ts"))
const originalFetch = global.fetch
const originalEnv = { key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL, enabled: process.env.AI_ENABLED,
  timeout: process.env.GEMINI_TIMEOUT_MS,
  firebaseProject: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID }
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "test-project"
after(() => {
  global.fetch = originalFetch
  for (const [name, value] of [["GEMINI_API_KEY", originalEnv.key], ["GEMINI_MODEL", originalEnv.model], ["AI_ENABLED", originalEnv.enabled],
    ["GEMINI_TIMEOUT_MS", originalEnv.timeout],
    ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", originalEnv.firebaseProject]]) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

function request(body, headers = {}) {
  return new Request("https://app.test/api/test", { method: "POST",
    headers: { "content-type": "application/json", origin: "https://app.test", authorization: `Bearer ${testToken()}`, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body) })
}

function profile(overrides = {}) { return { aiConsent: true, name: "Meu guia privado", contentLocale: "pt-BR", ...overrides } }
function week(overrides = {}) {
  return { aiConsent: true, guideTitle: "Título privado", weekTitle: "Semana privada", startDate: "2026-10-12", endDate: "2026-10-18",
    snapshot: { totalTasks: 999, completedTasks: 999, completionPercentage: 100,
      taskResults: [{ id: "private-id", dayIndex: 0, time: "10:00", description: "Caminhar", done: false, countsTowardCompletion: true }] },
    textAnswers: {}, ...overrides }
}
const validReview = { verdict: "Você pode ajustar o plano.", summary: "Sugestão de reflexão que pode ser revista.",
  whatWorked: [], difficulties: [], observedPatterns: [], nextWeekSuggestions: ["Escolha um passo pequeno."] }
const validGuide = {
  description: "Um plano flexível", profileSummary: "Você busca organizar a rotina.",
  intro: { title: "Seu ritmo", subtitle: "Pequenos passos" },
  sections: Array.from({ length: 5 }, (_, index) => ({ kicker: "REFLEXÃO", title: `Seção ${index + 1}`,
    blocks: [{ type: "p", text: "Você pode pausar." }, { type: "fields", fields: [{ kind: "textarea", label: "O que ajuda?" }] }] })),
  weeklyPlan: Array.from({ length: 7 }, (_, dayIndex) => ({ dayIndex, time: "10:00", description: "Faça uma pausa." })),
  quickSheets: [{ title: "Pausa", summary: "Observe o presente." }, { title: "Rotina", summary: "Ajuste o plano." }],
  completionConfig: { reviewTitle: "Reflexão semanal", analysisDimensions: ["Rotina", "Descanso"], nextWeekFocusRules: ["Respeitar limites"] },
  safetyNotes: ["Sugestão de IA; não substitui cuidado profissional."],
}
function provider(output, capture) {
  process.env.GEMINI_API_KEY = "test-only-placeholder"
  process.env.GEMINI_MODEL = "gemini-3.8-flash"
  process.env.AI_ENABLED = "true"
  fakeFetch(async (url, options) => {
    capture?.(url, options)
    return Response.json({ status: "completed", steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify(output) }] }] })
  })
}

function consentDocument(overrides = {}) {
  return { fields: {
    usageTermsVersion: { stringValue: LEGAL_VERSION }, privacyVersion: { stringValue: LEGAL_VERSION }, healthVersion: { stringValue: LEGAL_VERSION },
    adultConfirmed: { booleanValue: true }, acceptedAt: { timestampValue: new Date().toISOString() }, ...overrides,
  } }
}
function fakeFetch(geminiFetch, legalResponse = () => Response.json(consentDocument())) {
  global.fetch = async (url, options) => {
    if (String(url).startsWith("https://firestore.googleapis.com/")) return legalResponse(url, options)
    if (String(url).startsWith("https://generativelanguage.googleapis.com/")) return geminiFetch(url, options)
    throw new Error("unexpected external network")
  }
}

test("missing consent, malformed input, cross-origin and oversized payloads never call Google", async () => {
  let called = false
  global.fetch = async () => { called = true; throw new Error("unexpected network") }
  assert.equal((await generate.POST(request({ name: "Teste" }))).status, 403)
  assert.equal((await generate.POST(request(profile({ name: {} })))).status, 400)
  assert.equal((await generate.POST(request("{"))).status, 400)
  assert.equal((await generate.POST(request(profile(), { origin: "https://other.test" }))).status, 403)
  assert.equal((await generate.POST(request(profile({ additionalNotes: "x".repeat(90_000) })))).status, 413)
  assert.equal((await analyze.POST(request(week({ snapshot: "invalid" })))).status, 400)
  assert.equal(called, false)
})

test("draft assistance validates editable suggestions without saving a guide or sending optional details implicitly", async () => {
  const suggestions = { name: "A Gentle Week", focus: "Choose one small task each day.", routineSchedule: "", whatHelps: "Leave room for a break.", thingsToAvoid: "", additionalNotes: "Adjust any step to fit your day." }
  let outbound
  provider(suggestions, (url, options) => { outbound = JSON.parse(options.body) })
  const response = await generate.POST(request(profile({ mode: "assist", name: "", routineSchedule: "After breakfast", focus: "A small start" })))
  assert.equal(response.status, 200)
  const data = await response.json()
  assert.deepEqual(data, { draftSuggestions: suggestions })
  assert.equal(data.guideTemplate, undefined)
  assert.equal(outbound.store, false)
  assert.ok(outbound.input.includes("After breakfast"))
  provider({ ...suggestions, name: "x".repeat(101) })
  assert.equal((await generate.POST(request(profile({ mode: "assist" })))).status, 502)
  provider({ ...suggestions, focus: "You have depression." })
  assert.equal((await generate.POST(request(profile({ mode: "assist" })))).status, 502)
})

test("draft assistance cannot bypass consent, account authentication, or valid mode checks", async () => {
  let called = false
  global.fetch = async () => { called = true; throw new Error("unexpected network") }
  assert.equal((await generate.POST(request({ mode: "assist" }))).status, 403)
  assert.equal((await generate.POST(request(profile({ mode: "assist" }), { authorization: "" }))).status, 401)
  assert.equal((await generate.POST(request(profile({ mode: "unknown" })))).status, 400)
  assert.equal(called, false)
})

test("generation uses the documented stateless Gemini contract and maps a validated seven-day guide", async () => {
  let outbound
  provider(validGuide, (url, options) => { outbound = { url, ...options, payload: JSON.parse(options.body) } })
  const response = await generate.POST(request(profile({ whatHelps: "Contato: pessoa@example.org" })))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("cache-control"), "no-store, private")
  const data = await response.json()
  assert.equal(data.guideTemplate.title, "Meu guia privado")
  assert.equal(data.guideTemplate.theologyEnabled, false)
  assert.equal(data.guideTemplate.bibleVersion, null)
  assert.equal(data.guideTemplate.weeklyPlan.length, 7)
  assert.equal(new Set(data.guideTemplate.scheduleTaskIds).size, 7)
  const fieldIds = data.guideTemplate.sections.flatMap((section) => section.blocks.flatMap((block) => block.fields?.map((field) => field.id) || []))
  assert.equal(new Set(fieldIds).size, fieldIds.length)
  assert.equal(outbound.url, "https://generativelanguage.googleapis.com/v1beta/interactions")
  assert.equal(outbound.payload.store, false)
  assert.equal(outbound.payload.model, "gemini-3.8-flash")
  assert.equal(outbound.headers["x-goog-api-key"], "test-only-placeholder")
  assert.ok(!outbound.payload.input.includes("Meu guia privado"))
  assert.ok(!outbound.payload.input.includes("pessoa@example.org"))
})

test("both AI routes default to English, retain explicit Portuguese, and return English public errors", async () => {
  let outbound
  for (const [contentLocale, expectedLocale, expectedLanguage, expectedCategory] of [
    [undefined, "en-US", "English (US)", "Seven-day planner"],
    ["pt-BR", "pt-BR", "Brazilian Portuguese", "Planejador de sete dias"],
  ]) {
    provider(validGuide, (_, options) => { outbound = JSON.parse(options.body) })
    const response = await generate.POST(request(profile({ contentLocale, whatHelps: "Contact person@example.org" })))
    assert.equal(response.status, 200)
    const data = await response.json()
    assert.equal(data.guideTemplate.contentLocale, expectedLocale)
    assert.equal(data.guideTemplate.config.category, expectedCategory)
    assert.ok(outbound.system_instruction.includes(`Respond in ${expectedLanguage}`))
    assert.ok(outbound.input.includes("[email omitted]"))
    assert.equal(data.guideTemplate.theologyEnabled, false)

    provider(validReview, (_, options) => { outbound = JSON.parse(options.body) })
    assert.equal((await analyze.POST(request(week({ contentLocale })))).status, 200)
    assert.ok(outbound.system_instruction.includes(`Respond in ${expectedLanguage}`))
  }

  const missingConsent = await generate.POST(request({ name: "A guide" }))
  assert.equal(missingConsent.status, 403)
  assert.deepEqual(await missingConsent.json(), {
    error: "Confirm that the selected information may be sent to Google Gemini before using AI.", code: "CONSENT_REQUIRED",
  })
  const invalidName = await generate.POST(request(profile({ name: {} })))
  assert.equal(invalidName.status, 400)
  assert.equal((await invalidName.json()).error, "Guide name must be text.")
  const signedOut = await analyze.POST(request(week(), { authorization: "" }))
  assert.equal(signedOut.status, 401)
  assert.deepEqual(await signedOut.json(), { error: "Sign in to your account to use AI.", code: "AUTH_REQUIRED" })
  fakeFetch(async () => new Response("secret-provider-error", { status: 403 }))
  const providerError = await analyze.POST(request(week()))
  assert.equal(providerError.status, 503)
  assert.deepEqual(await providerError.json(), {
    error: "AI is unavailable. The app operator needs to review provider access.", code: "AI_CONFIGURATION_ERROR",
  })
})

test("weekly review recalculates counts and withholds titles, dates and field identifiers", async () => {
  let outbound
  provider(validReview, (_, options) => { outbound = JSON.parse(options.body) })
  const response = await analyze.POST(request(week({ textAnswers: { "secret-field-id": "Percebi que descanso ajuda." } })))
  assert.equal(response.status, 200)
  const input = JSON.parse(outbound.input)
  assert.deepEqual(input.completion, { total: 1, completed: 0, percentage: 0 })
  assert.equal(input.spiritualityEnabled, false)
  assert.ok(!outbound.input.includes("Título privado"))
  assert.ok(!outbound.input.includes("2026-10"))
  assert.ok(!outbound.input.includes("secret-field-id"))
  assert.deepEqual(input.reflections, ["Percebi que descanso ajuda."])
})

test("unsafe, malformed, or incomplete output is refused without exposing provider errors", async () => {
  provider({ ...validReview, verdict: "Você tem transtorno bipolar." })
  assert.equal((await analyze.POST(request(week()))).status, 502)
  provider({ ...validReview, verdict: "You have depression." })
  assert.equal((await analyze.POST(request(week({ contentLocale: "en-US" })))).status, 502)
  provider({ ...validReview, summary: "Faça uma oração a Deus." })
  assert.equal((await analyze.POST(request(week()))).status, 502)
  provider({ ...validReview, summary: "Read the Quran and pray." })
  assert.equal((await analyze.POST(request(week({ contentLocale: "en-US" })))).status, 502)
  provider({ ...validReview, summary: {} })
  assert.equal((await analyze.POST(request(week()))).status, 502)
  provider({ ...validGuide, weeklyPlan: validGuide.weeklyPlan.slice(0, 6) })
  assert.equal((await generate.POST(request(profile()))).status, 502)
  fakeFetch(async () => new Response("secret-provider-error", { status: 403 }))
  const response = await analyze.POST(request(week()))
  assert.equal(response.status, 503)
  assert.ok(!(await response.text()).includes("secret-provider-error"))
})

test("runtime schema rejects unknown properties and mismatched block shapes", () => {
  assert.equal(validation.matchesSchema(validGuide, schemas.guideOutputSchema), true)
  assert.equal(validation.matchesSchema({ ...validReview, unexpected: "value" }, schemas.reviewOutputSchema), false)
  assert.equal(validation.matchesSchema(JSON.parse(JSON.stringify(validReview).slice(0, -1) + ',"__proto__":{}}'), schemas.reviewOutputSchema), false)
  assert.equal(validation.matchesSchema({ ...validGuide, sections: [{ blocks: [] }] }, schemas.guideOutputSchema), false)
})

test("missing key, disabled AI and invalid configuration fail without making a provider request", async () => {
  let called = false
  fakeFetch(async () => { called = true; throw new Error("unexpected network") })
  delete process.env.GEMINI_API_KEY
  assert.equal((await analyze.POST(request(week()))).status, 503)
  process.env.GEMINI_API_KEY = "test-only-placeholder"
  process.env.AI_ENABLED = "false"
  assert.equal((await analyze.POST(request(week()))).status, 503)
  process.env.AI_ENABLED = "true"
  process.env.GEMINI_MODEL = "../../unsafe"
  assert.equal((await analyze.POST(request(week()))).status, 503)
  assert.equal(called, false)
})

test("wrong content type and forged boolean values are rejected", async () => {
  assert.equal((await generate.POST(request(profile(), { "content-type": "text/plain" }))).status, 415)
  assert.equal((await generate.POST(request(profile({ aiConsent: "true" })))).status, 403)
  assert.equal((await generate.POST(request(profile({ theologyEnabled: "false" })))).status, 400)
  assert.equal((await generate.POST(request(profile({ theologyEnabled: true, theologyCosmovision: "" })))).status, 400)
  assert.equal((await analyze.POST(request(week({ startDate: "2026-02-30" })))).status, 400)
  assert.equal((await analyze.POST(request(week({ snapshot: { taskResults: [{ dayIndex: 0, description: "Pausa" }] } })))).status, 400)
})

test("authenticated account rate backstop rejects the seventh request and sets a retry hint", () => {
  const http = loadSource(path.join(root, "lib/ai/http.ts"))
  const req = request(profile())
  for (let i = 0; i < 6; i++) http.limitAIRequest(req, "fixture-rate-identity")
  let error
  try { http.limitAIRequest(req, "fixture-rate-identity") } catch (caught) { error = caught }
  assert.equal(error.status, 429)
  assert.equal(http.aiErrorResponse(error).headers.get("retry-after"), "60")
})

test("the provider timeout aborts an unresponsive upstream request", async () => {
  const gemini = loadSource(path.join(root, "lib/ai/gemini.ts"))
  process.env.GEMINI_API_KEY = "test-only-placeholder"
  process.env.GEMINI_MODEL = "gemini-3.8-flash"
  process.env.GEMINI_TIMEOUT_MS = "5000"
  process.env.AI_ENABLED = "true"
  global.fetch = async (_, options) => new Promise((_, reject) => {
    options.signal.addEventListener("abort", () => reject(new Error("test upstream aborted")), { once: true })
  })
  await assert.rejects(gemini.generateStructuredJSON({ system: "Test", input: {}, schema: schemas.reviewOutputSchema,
    signal: new AbortController().signal, maxOutputTokens: 100 }), (error) => error.status === 504 && error.code === "AI_TIMEOUT")
})

test("AI rejects unconfigured Firebase, visitors, unverified email and anonymous identities before the provider", async () => {
  let called = false
  global.fetch = async () => { called = true; throw new Error("unexpected network") }
  delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  let response = await generate.POST(request(profile()))
  assert.equal(response.status, 503)
  assert.equal((await response.json()).code, "AUTH_NOT_CONFIGURED")
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "test-project"
  response = await generate.POST(request(profile(), { authorization: "" }))
  assert.equal(response.status, 401)
  response = await generate.POST(request(profile(), { authorization: `Bearer ${testToken({ email_verified: false })}` }))
  assert.equal(response.status, 403)
  assert.equal((await response.json()).code, "EMAIL_VERIFICATION_REQUIRED")
  response = await generate.POST(request(profile(), { authorization: `Bearer ${testToken({ firebase: { sign_in_provider: "anonymous" } })}` }))
  assert.equal(response.status, 401)
  assert.equal(called, false)
})

test("real RSA verification rejects tampered signature, incorrect issuer/audience, expiration and future auth time", async () => {
  global.fetch = async () => { throw new Error("unexpected network") }
  const otherKeys = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 })
  const now = Math.floor(Date.now() / 1000)
  const tokens = [
    testToken({}, otherKeys.privateKey), testToken({ aud: "another-project" }),
    testToken({ iss: "https://attacker.test/test-project" }), testToken({ exp: now - 60 }),
    testToken({ auth_time: now + 300 }), testToken({ iat: now + 300 }), testToken({ sub: "" }),
  ]
  for (const token of tokens) {
    const response = await analyze.POST(request(week(), { authorization: `Bearer ${token}` }))
    assert.equal(response.status, 401)
    assert.equal((await response.json()).code, "INVALID_AUTH_TOKEN")
  }
})

test("stale legal versions, missing consent, non-adult declaration and failed metadata lookup block Gemini", async () => {
  let geminiCalled = false
  const blockedDocuments = [
    consentDocument({ healthVersion: { stringValue: "outdated" } }),
    consentDocument({ adultConfirmed: { booleanValue: false } }),
    consentDocument({ acceptedAt: { timestampValue: "invalid" } }),
  ]
  for (const document of blockedDocuments) {
    fakeFetch(async () => { geminiCalled = true; throw new Error("unexpected Google request") }, () => Response.json(document))
    const response = await generate.POST(request(profile()))
    assert.equal(response.status, 403)
    assert.equal((await response.json()).code, "LEGAL_ACCEPTANCE_REQUIRED")
  }
  fakeFetch(async () => { geminiCalled = true }, () => new Response("private-firestore-error", { status: 404 }))
  assert.equal((await analyze.POST(request(week()))).status, 403)
  fakeFetch(async () => { geminiCalled = true }, () => new Response("private-firestore-error", { status: 403 }))
  const response = await analyze.POST(request(week()))
  assert.equal(response.status, 503)
  assert.ok(!(await response.text()).includes("private-firestore-error"))
  assert.equal(geminiCalled, false)
})

test("legal metadata lookup respects the token owner and retrieves only required acceptance fields", async () => {
  const auth = loadSource(path.join(root, "lib/auth/server.ts"))
  const token = testToken({ sub: "fixture-legal-owner" })
  let lookup
  fakeFetch(async () => { throw new Error("unexpected Gemini request") }, (url, options) => {
    lookup = { url: new URL(url), options }
    return Response.json(consentDocument())
  })
  const account = await auth.requireAIAccount(request(profile(), { authorization: `Bearer ${token}` }))
  assert.equal(account.uid, "fixture-legal-owner")
  assert.equal(lookup.url.pathname, "/v1/projects/test-project/databases/(default)/documents/users/fixture-legal-owner/settings/legal")
  assert.deepEqual(lookup.url.searchParams.getAll("mask.fieldPaths"),
    ["usageTermsVersion", "privacyVersion", "healthVersion", "adultConfirmed", "acceptedAt"])
  assert.equal(lookup.options.headers.Authorization, `Bearer ${token}`)
  assert.equal(lookup.options.cache, "no-store")
})

test("native preflight is explicit, does not authorize AI and rejects unknown origins or headers", async () => {
  const preflight = (origin, headers = {}) => new Request("https://app.test/api/generate-guide", {
    method: "OPTIONS", headers: { origin, "access-control-request-method": "POST",
      "access-control-request-headers": "Authorization, Content-Type", ...headers },
  })
  for (const origin of ["capacitor://localhost", "https://localhost"]) {
    const response = generate.OPTIONS(preflight(origin))
    assert.equal(response.status, 204)
    assert.equal(response.headers.get("access-control-allow-origin"), origin)
    assert.equal(response.headers.get("access-control-allow-credentials"), null)
    const unauthenticated = await generate.POST(request(profile(), { origin, authorization: "", "sec-fetch-site": "cross-site" }))
    assert.equal(unauthenticated.status, 401)
    assert.equal(unauthenticated.headers.get("access-control-allow-origin"), origin)
  }
  const rejected = generate.OPTIONS(preflight("https://attacker.test"))
  assert.equal(rejected.status, 403)
  assert.equal(rejected.headers.get("access-control-allow-origin"), null)
  assert.equal(generate.OPTIONS(preflight("capacitor://localhost", { "access-control-request-headers": "X-Unauthorized" })).status, 403)
  assert.equal(generate.OPTIONS(preflight("capacitor://localhost", { "access-control-request-method": "DELETE" })).status, 403)
})

test("additional web origins require exact configuration and wildcard cannot enable them", () => {
  const original = process.env.AI_ALLOWED_ORIGINS
  try {
    process.env.AI_ALLOWED_ORIGINS = "*"
    const req = new Request("https://app.test/api/ai-status", { headers: { origin: "https://other.test" } })
    const status = loadSource(path.join(root, "app/api/ai-status/route.ts"))
    assert.equal(status.GET(req).status, 403)
    process.env.AI_ALLOWED_ORIGINS = "https://other.test"
    const response = status.GET(req)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get("access-control-allow-origin"), "https://other.test")
    assert.equal(response.headers.get("cache-control"), "no-store, private")
  } finally {
    if (original === undefined) delete process.env.AI_ALLOWED_ORIGINS
    else process.env.AI_ALLOWED_ORIGINS = original
  }
})
