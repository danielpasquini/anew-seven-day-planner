import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
require("@next/env").loadEnvConfig(process.cwd(), false, { info() {}, error() {} })
const ts = require("typescript"), cache = new Map()
function source(file) {
  const filename = path.resolve(file)
  if (cache.has(filename)) return cache.get(filename)
  const module = { exports: {} }; cache.set(filename, module.exports)
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  new Function("module", "exports", "require", compiled)(module, module.exports, name => name === "server-only" ? {} : name.startsWith(".") ? source(path.resolve(path.dirname(filename), `${name}.ts`)) : require(name))
  return module.exports
}
const originalFetch = globalThis.fetch
globalThis.fetch = async (...args) => {
  if (process.argv.includes("--loose-array-bounds")) {
    const body = JSON.parse(args[1].body)
    function unbound(value) { if (!value || typeof value !== "object") return; delete value.minItems; delete value.maxItems; Object.values(value).forEach(child => Array.isArray(child) ? child.forEach(unbound) : unbound(child)) }
    unbound(body.response_format.schema)
    args[1] = { ...args[1], body: JSON.stringify(body) }
  }
  if (process.argv.includes("--generate-content")) {
    const body = JSON.parse(args[1].body)
    args[0] = `https://generativelanguage.googleapis.com/v1beta/models/${body.model}:generateContent`
    args[1] = { ...args[1], body: JSON.stringify({ store: false, systemInstruction: { parts: [{ text: body.system_instruction }] }, contents: [{ role: "user", parts: [{ text: body.input }] }], generationConfig: { maxOutputTokens: body.generation_config.max_output_tokens, responseFormat: { text: { mimeType: "APPLICATION_JSON", schema: body.response_format.schema } } } }) }
  }
  if (process.argv.includes("--typed-unions")) {
    const body = JSON.parse(args[1].body)
    function typeUnions(value) { if (!value || typeof value !== "object") return; if (Array.isArray(value.anyOf)) value.type = "object"; Object.values(value).forEach(child => Array.isArray(child) ? child.forEach(typeUnions) : typeUnions(child)) }
    typeUnions(body.response_format.schema)
    args[1] = { ...args[1], body: JSON.stringify(body) }
  }
  const response = await originalFetch(...args)
  const diagnostic = { upstreamStatus: response.status }
  if (!response.ok) {
    try {
      const error = (await response.clone().json()).error
      diagnostic.status = error?.status ?? error?.code
      diagnostic.reason = String(error?.message ?? "").replaceAll(process.env.GEMINI_API_KEY || "unused", "[redacted]").slice(0, 1100)
    } catch {}
  } else {
    try {
      const body = await response.clone().json()
      diagnostic.envelopeStatus = body.status
      diagnostic.stepTypes = body.steps?.map(step => step.type)
      diagnostic.contentTypes = body.steps?.flatMap(step => step.content?.map(part => part.type) ?? [])
      if (process.argv.includes("--generate-content") && Array.isArray(body.candidates)) {
        const candidate = body.candidates[0]
        diagnostic.finishReason = candidate.finishReason
        const text = candidate.content?.parts?.filter(part => typeof part.text === "string" && part.thought !== true).map(part => part.text).join("")
        const adapted = Response.json({ status: "completed", steps: [{ type: "model_output", content: [{ type: "text", text }] }] })
        console.log(JSON.stringify(diagnostic))
        return adapted
      }
    } catch {}
  }
  console.log(JSON.stringify(diagnostic))
  return response
}
let stage = "adapter"
function mismatch(value, schema, at = "$", depth = 0) {
  const { matchesSchema } = source("lib/ai/validation.ts")
  if (matchesSchema(value, schema)) return []
  if (schema.anyOf) return schema.anyOf.map(branch => mismatch(value, branch, at, depth + 1)).sort((a,b) => a.length-b.length)[0]
  const issues = []
  if (schema.enum && !schema.enum.includes(value)) issues.push(`${at}:enum`)
  if (schema.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of schema.required ?? []) if (!(key in value)) issues.push(`${at}.${key}:missing`)
    for (const [key, child] of Object.entries(value)) {
      if (schema.properties?.[key]) issues.push(...mismatch(child, schema.properties[key], `${at}.${key}`, depth+1))
      else if (schema.additionalProperties === false) issues.push(`${at}.${key}:unexpected`)
    }
  } else if (schema.type === "array" && Array.isArray(value)) {
    if (value.length < (schema.minItems ?? 0) || value.length > (schema.maxItems ?? 100)) issues.push(`${at}:array-length`)
    value.forEach((child,index) => issues.push(...mismatch(child,schema.items,`${at}[${index}]`,depth+1)))
  } else if (!issues.length) issues.push(`${at}:type-or-bound`)
  return issues
}
try {
  const { guideOutputSchema } = source("lib/ai/schemas.ts")
  const { generateStructuredJSON } = source("lib/ai/gemini.ts")
  const { checkedOutput, checkOutputSafety } = source("lib/ai/validation.ts")
  const routeText = fs.readFileSync("app/api/generate-guide/route.ts", "utf8")
  const routeAst = ts.createSourceFile("route.ts", routeText, ts.ScriptTarget.ESNext, true)
  let promptSource
  function findPrompt(node) { if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === "system") promptSource = node.initializer.getText(routeAst); ts.forEachChild(node, findPrompt) }
  findPrompt(routeAst)
  const system = new Function("locale", "spiritualityEnabled", `return (${promptSource})`)("en-US", false)
  const output = await generateStructuredJSON({ system, input: { profile: { focus: "Make time for a short walk." }, intensity: "light", spiritualityEnabled: false }, schema: guideOutputSchema, signal: new AbortController().signal, maxOutputTokens: 12000 })
  stage = "schema"
  console.log(JSON.stringify({ blockTags: output.sections?.flatMap(section => section.blocks?.map(block => block.type) ?? []) }))
  console.log(JSON.stringify({ schemaIssues: mismatch(output, guideOutputSchema).slice(0,25) }))
  checkedOutput(output, guideOutputSchema)
  stage = "safety"
  checkOutputSafety(output, false)
  console.log(JSON.stringify({ fullGuideSchema: "PASS", days: [...new Set(output.weeklyPlan.map(task => task.dayIndex))].sort(), sections: output.sections.length }))
} catch (error) {
  console.log(JSON.stringify({ fullGuideSchema: "FAIL", stage, code: error?.code || "CHECK_FAILED" }))
  process.exitCode = 1
} finally { globalThis.fetch = originalFetch }
