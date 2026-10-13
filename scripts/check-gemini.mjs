// Explicit server-side connectivity check using fixed synthetic data only.
// This never reads account records or changes the authorization of app API routes.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const started = Date.now()
const providerStatuses = []
const originalFetch = globalThis.fetch
let result = { liveGeneration: "FAIL", code: "CHECK_FAILED" }

try {
  require("@next/env").loadEnvConfig(root, false, { info() {}, error() {} })
  const ts = require("typescript")
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
      if (name.startsWith(".")) return loadSource(path.resolve(path.dirname(absolute), `${name}.ts`))
      return require(name)
    }
    new Function("module", "exports", "require", output)(module, module.exports, localRequire)
    return module.exports
  }
  const gemini = loadSource(path.join(root, "lib/ai/gemini.ts"))
  const { AIRequestError } = loadSource(path.join(root, "lib/ai/http.ts"))
  const schema = { type: "object", properties: { status: { type: "string", enum: ["ok"] } },
    required: ["status"], additionalProperties: false }
  globalThis.fetch = async (...args) => {
    const response = await originalFetch(...args)
    providerStatuses.push(response.status)
    return response
  }
  try {
    const output = await gemini.generateStructuredJSON({
      system: "This is a synthetic connectivity check. Return only the requested JSON object.",
      input: { requestedStatus: "ok" }, schema,
      signal: new AbortController().signal, maxOutputTokens: 256,
    })
    const { matchesSchema } = loadSource(path.join(root, "lib/ai/validation.ts"))
    result = matchesSchema(output, schema)
      ? { liveGeneration: "PASS", code: "OK" }
      : { liveGeneration: "FAIL", code: "INVALID_AI_OUTPUT" }
  } catch (error) {
    result = { liveGeneration: "FAIL", code: error instanceof AIRequestError ? error.code : "CHECK_FAILED" }
  }
  const model = (process.env.GEMINI_MODEL || gemini.DEFAULT_GEMINI_MODEL).trim()
  result = { ...result, keyPresent: Boolean(process.env.GEMINI_API_KEY?.trim()),
    aiEnabled: process.env.AI_ENABLED === "true",
    model: /^gemini-[a-z0-9][a-z0-9.-]{1,80}$/.test(model) ? model : "invalid-model-configuration" }
} catch {
  // Never print an exception, request, environment value, or upstream response body.
} finally {
  globalThis.fetch = originalFetch
}

console.log(JSON.stringify({ ...result, providerStatuses, durationMs: Date.now() - started,
  accountAuthorization: "Not tested; use a verified signed-in account in the app." }))
if (result.liveGeneration !== "PASS") process.exitCode = 1
