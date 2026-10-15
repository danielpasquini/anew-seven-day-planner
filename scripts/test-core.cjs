const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

const root = path.resolve(__dirname, "..")
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
    if (name.startsWith("@/")) return loadSource(path.join(root, `${name.slice(2)}.ts`))
    if (name.startsWith(".")) return loadSource(path.resolve(path.dirname(absolute), `${name}.ts`))
    return require(name)
  }
  new Function("module", "exports", "require", output)(module, module.exports, localRequire)
  cache.set(absolute, module.exports)
  return module.exports
}

const { GUIDE_TEMPLATES } = loadSource(path.join(root, "lib/guide-data.ts"))
const backup = loadSource(path.join(root, "lib/backup-validation.ts"))
const dates = loadSource(path.join(root, "lib/date-utils.ts"))
const { SyncEngine } = loadSource(path.join(root, "lib/sync/sync-engine.ts"))
const { SessionGuard } = loadSource(path.join(root, "lib/auth/session-guard.ts"))
const { performAccountDeletion, accountDataKeys, ensureExistingGoogleAccount } = loadSource(path.join(root, "lib/auth/account-deletion.ts"))
const { resolveApiUrl } = loadSource(path.join(root, "lib/api-url.ts"))
const onboarding = loadSource(path.join(root, "lib/onboarding.ts"))
const onboardingDraft = loadSource(path.join(root, "lib/onboarding-draft.ts"))
const { BibleProvider } = loadSource(path.join(root, "lib/bible/bible-provider.ts"))
const { createDemoBackup, MemoryDemoStorage, DemoSessionController } = loadSource(path.join(root, "lib/demo-data.ts"))
const nativeWorkspace = loadSource(path.join(root, "native/src/workspace.ts"))
const testAccess = loadSource(path.join(root, "lib/test-access.ts"))
const planner = loadSource(path.join(root, "lib/planner.ts"))
const guideRevision = loadSource(path.join(root, "lib/guide-revision.ts"))
const weekPlanning = loadSource(path.join(root, "lib/week-planning.ts"))
const weekSetup = loadSource(path.join(root, "lib/week-setup.ts"))
const weekOptions = loadSource(path.join(root, "lib/week-options.ts"))
const nativeAI = loadSource(path.join(root, "native/src/ai.ts"))
const { titleCase } = loadSource(path.join(root, "lib/title-case.ts"))
const clone = (value) => JSON.parse(JSON.stringify(value))
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function week(overrides = {}) {
  return { id: "fixture-week", guideId: GUIDE_TEMPLATES[0].id, title: "Semana de teste",
    startDate: "2026-10-12", endDate: "2026-10-18", createdAt: "2026-10-12T12:00:00.000Z",
    updatedAt: "2026-10-12T12:00:00.000Z", status: "active",
    data: { text: { reflection: "Hoje escolhi descansar." }, done: { "fixture-task": false } },
    programacao: { dias: 7, activities: [{ id: "fixture-task", dayIndex: 0, time: "10:00", description: "Pausa", order: 0 }] },
    ...overrides }
}
function payload(overrides = {}) {
  return { schemaVersion: 4, guides: clone(GUIDE_TEMPLATES), activeGuideId: GUIDE_TEMPLATES[0].id,
    weeks: [week()], activeWeekId: "fixture-week",
    settings: { theme: "light", palette: "sage", locale: "pt-BR", bibleVersion: "ARA" },
    updatedAt: "2026-10-12T12:00:00.000Z", ...overrides }
}

test("the actual Portuguese and English guide templates pass backup validation", () => {
  assert.ok(GUIDE_TEMPLATES.length >= 2)
  for (const guide of GUIDE_TEMPLATES) assert.equal(backup.isValidGuide(guide), true, guide.id)
  assert.equal(backup.isValidBackup(payload()), true)
  assert.equal(backup.isValidBackup({ weeks: [week()] }), true)
})

test("backup import rejects unknown schemas, orphan guides, duplicate weeks and malformed records", () => {
  assert.equal(backup.isValidBackup(payload({ schemaVersion: 900 })), false)
  assert.equal(backup.isValidBackup(payload({ schemaVersion: "4" })), false)
  assert.equal(backup.isValidBackup(payload({ weeks: [week({ guideId: "unrecognized-guide" })] })), false)
  assert.equal(backup.isValidBackup({ weeks: [week({ guideId: "unrecognized-guide" })] }), false)
  assert.equal(backup.isValidBackup(payload({ weeks: [week(), week()] })), false)
  assert.equal(backup.isValidBackup(payload({ weeks: [week({ data: { text: { reflection: {} }, done: {} } })] })), false)
  assert.equal(backup.isValidBackup(payload({ weeks: [week({ data: { text: {}, done: { task: "true" } } })] })), false)
  assert.equal(backup.isValidBackup(payload({ weeks: [week({ data: { text: JSON.parse('{"__proto__":"bad"}'), done: {} } })] })), false)
})

test("malformed scripture and unsafe interactive field shapes are rejected", () => {
  const guide = clone(GUIDE_TEMPLATES[0])
  guide.sections[0].scripture = { verses: [{ ref: "Unknown", ara: {}, nvt: "" }], comentario: "", oracao: "" }
  assert.equal(backup.isValidGuide(guide), false)
  assert.equal(backup.isValidBlock({ type: "fields", fields: [{ kind: "textarea", id: "__proto__", label: "Reflexão" }] }), false)
  assert.equal(backup.isValidBlock({ type: "scale", max: 10 }), false)
  assert.equal(backup.isValidBlock({ type: "fields", fields: [{ kind: "scale", id: "safe-field", label: "Como foi?", max: -1 }] }), false)
})

test("import refuses values that could crash the renderer or allocate an oversized scale", () => {
  assert.equal(backup.isValidBlock({ type: "fields", fields: [{ kind: "scale", id: "safe-field", label: "Como foi?", max: 1_000_000_000 }] }), false)
  for (const mutate of [
    (guide) => { guide.config.category = {} },
    (guide) => { guide.safetyNotes = [{}] },
    (guide) => { guide.quickSheets = [{ id: "sheet", title: "Ficha", summary: {} }] },
  ]) {
    const guide = clone(GUIDE_TEMPLATES[0])
    mutate(guide)
    assert.equal(backup.isValidGuide(guide), false)
  }
  const snapshot = { totalTasks: 1, completedTasks: 0, completionPercentage: 0,
    taskResults: [{ id: "task", description: {}, done: false }] }
  assert.equal(backup.isValidBackup(payload({ weeks: [week({ completionSnapshot: snapshot })] })), false)
})

test("inclusive seven-day dates survive month, year and leap-year boundaries", () => {
  assert.equal(dates.calculateInclusiveEndDate("2026-12-28"), "2027-01-03")
  assert.equal(dates.calculateInclusiveEndDate("2028-02-26"), "2028-03-03")
  assert.equal(dates.getNextDayDate("2028-02-28"), "2028-02-29")
  assert.equal(dates.getNextDayDate("2028-02-29"), "2028-03-01")
  assert.equal(backup.isValidDate("2026-02-30"), false)
  assert.equal(backup.isValidDate("2028-02-29"), true)
  assert.deepEqual(dates.getWeekDays("2026-12-28").map((day) => day.dateStr),
    ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"])
})

test("local persistence coalesces rapid edits and can flush synchronously before navigation", async () => {
  const engine = new SyncEngine()
  const saved = []
  try {
    engine.scheduleSync(payload(), (value) => saved.push(value))
    engine.scheduleSync(payload({ activeWeekId: "latest-edit" }), (value) => saved.push(value))
    assert.equal(saved.length, 0)
    assert.equal(engine.flushLocalPersist(), true)
    assert.equal(saved.length, 1)
    assert.equal(saved[0].activeWeekId, "latest-edit")
    assert.equal(await engine.flushPendingSync(), true)
    assert.equal(engine.getStatus(), "saved")
  } finally { engine.dispose() }
})

test("storage failure is not labeled saved and recovery retries the real pending write", async () => {
  const engine = new SyncEngine()
  let unavailable = true
  let saved = 0
  try {
    engine.scheduleSync(payload(), () => { if (unavailable) throw new Error("fixture quota exhausted"); saved += 1 })
    assert.equal(await engine.flushPendingSync(), false)
    assert.equal(engine.getStatus(), "error")
    assert.equal(saved, 0)
    unavailable = false
    assert.equal(await engine.flushPendingSync(), true)
    assert.equal(engine.getStatus(), "saved")
    assert.equal(saved, 1)
  } finally { engine.dispose() }
})

test("dispose cancels pending local writes instead of recreating deleted records", async () => {
  const engine = new SyncEngine()
  let saved = 0
  engine.scheduleSync(payload(), () => { saved += 1 })
  engine.dispose()
  await pause(190)
  assert.equal(saved, 0)
})

test("the actual offline engine flushes on reconnection and releases event listeners", async () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window")
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator")
  const listeners = new Map()
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: (name, handler) => { if (listeners.get(name) === handler) listeners.delete(name) },
  } })
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { onLine: false } })
  const writes = []
  const engine = new SyncEngine({ saveUserData: async (uid, value) => { writes.push({ uid, value }) } })
  try {
    engine.setUserId("fixture-offline-account")
    const unsubscribe = engine.subscribe(() => {})
    engine.scheduleSync(payload(), () => {})
    assert.equal(engine.getStatus(), "offline")
    assert.equal(await engine.flushPendingSync(), false)
    assert.equal(writes.length, 0)
    listeners.get("online")()
    await pause(5)
    assert.equal(writes.length, 1)
    assert.equal(writes[0].uid, "fixture-offline-account")
    assert.equal(engine.getStatus(), "saved")
    unsubscribe()
    engine.dispose()
    assert.equal(listeners.size, 0)
  } finally {
    engine.dispose()
    if (windowDescriptor) Object.defineProperty(globalThis, "window", windowDescriptor)
    else delete globalThis.window
    if (navigatorDescriptor) Object.defineProperty(globalThis, "navigator", navigatorDescriptor)
    else delete globalThis.navigator
  }
})

test("reconciliation preserves authored language, user text and newer task state across two fixtures", () => {
  const local = payload()
  const remote = payload({ updatedAt: "2026-10-12T13:00:00.000Z",
    settings: { theme: "dark", palette: "blue", locale: "en-US", bibleVersion: "KJV" },
    weeks: [week({ updatedAt: "2026-10-12T13:00:00.000Z", data: { text: { newNote: "Escrevi em português." }, done: { "fixture-task": true } } })] })
  const result = SyncEngine.reconcileStates(local, remote)
  assert.equal(result.settings.locale, "en-US")
  assert.equal(result.guides[0].contentLocale, GUIDE_TEMPLATES[0].contentLocale)
  assert.equal(result.weeks[0].data.text.reflection, "Hoje escolhi descansar.")
  assert.equal(result.weeks[0].data.text.newNote, "Escrevi em português.")
  assert.equal(result.weeks[0].data.done["fixture-task"], true)
  assert.equal(result.weeks[0].progresso.percentual, 100)
})

test("legal reads started before or during a write cannot override the later acceptance", () => {
  const guard = new SessionGuard()
  guard.transition("fixture-a")
  const before = guard.capture("fixture-a")
  const write = guard.beginLegalWrite("fixture-a")
  const during = guard.capture("fixture-a")
  assert.equal(guard.matches(before, true), false)
  assert.equal(guard.finishLegalWrite(write), true)
  assert.equal(guard.matches(during, true), false)
  assert.equal(guard.matches(guard.capture("fixture-a"), true), true)
})

test("logout, account switching and signing back into the same UID invalidate stale callbacks", () => {
  const guard = new SessionGuard()
  guard.transition("fixture-a")
  const old = guard.capture("fixture-a")
  guard.transition(null)
  assert.equal(guard.matches(old), false)
  guard.transition("fixture-a")
  assert.equal(guard.matches(old), false)
  const write = guard.beginLegalWrite("fixture-a")
  guard.transition("fixture-b")
  assert.equal(guard.finishLegalWrite(write), false)
  assert.equal(guard.matches(guard.capture("fixture-b")), true)
  guard.reset()
  assert.equal(guard.matches(guard.capture("fixture-b")), false)
})

test("web uses relative APIs while native fails closed without an explicit HTTPS backend", () => {
  assert.equal(resolveApiUrl("/api/ai-status", undefined, false), "/api/ai-status")
  assert.equal(resolveApiUrl("/api/analyze-week", "", true), null)
  assert.equal(resolveApiUrl("/api/generate-guide", "https://backend.example/", true), "https://backend.example/api/generate-guide")
  for (const base of ["http://backend.example", "javascript:alert(1)", "https://name:secret@backend.example", "https://backend.example/?key=value", "https://backend.example/prefix"])
    assert.equal(resolveApiUrl("/api/analyze-week", base, true), null)
  assert.equal(resolveApiUrl("https://attacker.test/api/analyze-week", "https://backend.example", true), null)
  assert.equal(resolveApiUrl("/api/../private", "https://backend.example", true), null)
})

function deletionFixture() {
  const uid = "fixture-deletion-a"
  const guard = new SessionGuard()
  guard.transition(uid)
  const ticket = guard.beginLegalWrite(uid)
  const storage = new Map([...accountDataKeys(uid), ...accountDataKeys("fixture-deletion-b"), "guia-theme"].map((key) => [key, "fixture-original"]))
  const events = []
  const engine = new SyncEngine()
  let currentUid = uid
  let completion = null
  const steps = {
    uid,
    isCurrent: () => currentUid === uid && guard.matches(ticket),
    canReportCompletion: () => currentUid === null,
    prepareLocal: () => {
      events.push("prepare")
      const saved = engine.flushLocalPersist()
      if (saved) engine.dispose()
      return saved
    },
    resumeLocal: () => events.push("resume"),
    removeAcknowledgements: async () => { events.push("acknowledgements") },
    acknowledgementsRemoved: () => { events.push("limited-access"); guard.finishLegalWrite(ticket) },
    removeAccount: async () => { events.push("account"); currentUid = null; guard.transition(null) },
    removeLocalKey: (key) => { events.push(`remove:${key}`); storage.delete(key) },
    reportCompletion: (result) => { events.push("completion"); completion = result },
  }
  return { uid, storage, events, engine, steps, completion: () => completion,
    switchAccount: (nextUid) => { currentUid = nextUid; guard.transition(nextUid) } }
}

test("account deletion flushes actual queued edits before remote removal and only erases its own keys", async () => {
  const fixture = deletionFixture()
  fixture.engine.scheduleSync(payload(), () => { fixture.events.push("persist"); fixture.storage.set(accountDataKeys(fixture.uid)[0], "fixture-latest") })
  const result = await performAccountDeletion(fixture.steps)
  assert.deepEqual(fixture.events.slice(0, 5), ["prepare", "persist", "acknowledgements", "limited-access", "account"])
  assert.deepEqual(result, { cloudCompleted: true, localDataRemoved: true })
  assert.deepEqual(fixture.completion(), result)
  for (const key of accountDataKeys(fixture.uid)) assert.equal(fixture.storage.has(key), false)
  for (const key of accountDataKeys("fixture-deletion-b")) assert.equal(fixture.storage.get(key), "fixture-original")
  assert.equal(fixture.storage.get("guia-theme"), "fixture-original")
  await pause(190)
  assert.equal(fixture.events.filter((event) => event === "persist").length, 1)
})

test("failed acknowledgement removal preserves flushed notes and permits local recovery", async () => {
  const fixture = deletionFixture()
  fixture.engine.scheduleSync(payload(), () => fixture.storage.set(accountDataKeys(fixture.uid)[0], "fixture-latest"))
  fixture.steps.removeAcknowledgements = async () => { throw new Error("fixture-network-error") }
  await assert.rejects(performAccountDeletion(fixture.steps), /fixture-network-error/)
  assert.equal(fixture.storage.get(accountDataKeys(fixture.uid)[0]), "fixture-latest")
  for (const key of accountDataKeys(fixture.uid)) assert.equal(fixture.storage.has(key), true)
  assert.equal(fixture.events.includes("account"), false)
  assert.equal(fixture.events.includes("resume"), true)
  assert.equal(fixture.completion(), null)
  let recovered = false
  fixture.engine.scheduleSync(payload(), () => { recovered = true })
  assert.equal(fixture.engine.flushLocalPersist(), true)
  assert.equal(recovered, true)
  fixture.engine.dispose()
})

test("unrecoverable pending storage cancels deletion before any remote request", async () => {
  const fixture = deletionFixture()
  fixture.engine.scheduleSync(payload(), () => { throw new Error("fixture-quota") })
  await assert.rejects(performAccountDeletion(fixture.steps), /DELETION_STORAGE_BLOCKED/)
  assert.equal(fixture.events.includes("acknowledgements"), false)
  assert.equal(fixture.events.includes("account"), false)
  for (const key of accountDataKeys(fixture.uid)) assert.equal(fixture.storage.get(key), "fixture-original")
  fixture.engine.dispose()
})

test("Auth deletion failure after metadata removal reports incomplete deletion without erasing notes", async () => {
  const fixture = deletionFixture()
  fixture.steps.removeAccount = async () => { throw new Error("fixture-recent-login-required") }
  await assert.rejects(performAccountDeletion(fixture.steps), (failure) => failure.code === "ACCOUNT_DELETION_INCOMPLETE")
  assert.equal(fixture.events.includes("limited-access"), true)
  assert.equal(fixture.events.includes("resume"), true)
  assert.equal(fixture.completion(), null)
  for (const key of accountDataKeys(fixture.uid)) assert.equal(fixture.storage.has(key), true)
  fixture.engine.dispose()
})

test("switching to B during A metadata removal never deletes B or reports A as completed", async () => {
  const fixture = deletionFixture()
  let finishMetadata
  fixture.steps.removeAcknowledgements = () => new Promise((resolve) => { finishMetadata = resolve })
  const deletion = performAccountDeletion(fixture.steps)
  fixture.switchAccount("fixture-deletion-b")
  finishMetadata()
  await assert.rejects(deletion, (failure) => failure.code === "ACCOUNT_DELETION_INCOMPLETE")
  assert.equal(fixture.events.includes("account"), false)
  assert.equal(fixture.events.includes("limited-access"), false)
  assert.equal(fixture.completion(), null)
  for (const key of [...accountDataKeys(fixture.uid), ...accountDataKeys("fixture-deletion-b")]) assert.equal(fixture.storage.has(key), true)
  fixture.engine.dispose()
})

test("switching to B while A Auth deletion is pending preserves B's session and storage", async () => {
  const fixture = deletionFixture()
  let finishAuth
  fixture.steps.removeAccount = () => new Promise((resolve) => { finishAuth = resolve })
  const deletion = performAccountDeletion(fixture.steps)
  await Promise.resolve()
  fixture.switchAccount("fixture-deletion-b")
  finishAuth()
  const result = await deletion
  assert.equal(result.cloudCompleted, true)
  assert.equal(fixture.completion(), null)
  for (const key of accountDataKeys(fixture.uid)) assert.equal(fixture.storage.has(key), false)
  for (const key of accountDataKeys("fixture-deletion-b")) assert.equal(fixture.storage.get(key), "fixture-original")
  fixture.engine.dispose()
})

test("local cleanup failure still reports completed remote deletion and attempts all account keys", async () => {
  const fixture = deletionFixture()
  const attempted = []
  fixture.steps.removeLocalKey = (key) => { attempted.push(key); if (attempted.length === 1) throw new Error("fixture-storage-policy"); fixture.storage.delete(key) }
  const result = await performAccountDeletion(fixture.steps)
  assert.deepEqual(result, { cloudCompleted: true, localDataRemoved: false })
  assert.deepEqual(attempted, accountDataKeys(fixture.uid))
  assert.deepEqual(fixture.completion(), result)
  fixture.engine.dispose()
})

test("existing-account Google route removes only a newly provisioned temporary account", async () => {
  let removals = 0
  const removeTemporary = async () => { removals += 1 }
  await ensureExistingGoogleAccount(false, removeTemporary)
  assert.equal(removals, 0)
  await assert.rejects(ensureExistingGoogleAccount(true, removeTemporary), /NO_EXISTING_GOOGLE_ACCOUNT/)
  assert.equal(removals, 1)
  await assert.rejects(ensureExistingGoogleAccount(true, async () => { throw new Error("fixture-offline") }), /NEW_GOOGLE_ACCOUNT_CLEANUP_FAILED/)
})

// Compare authored suggestions rather than a fingerprint or generated field IDs.
function guideContent(value) {
  if (Array.isArray(value)) return value.map(guideContent)
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["id", "scheduleTaskIds", "createdAt", "updatedAt", "version"].includes(key))
    .map(([key, nested]) => [key, guideContent(nested)]))
  return value
}

function memoryStorage(entries = []) {
  const values = new Map(entries)
  return { values,
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test("onboarding offers exactly ten distinct optional questions with recognized choices", () => {
  assert.equal(onboarding.QUESTIONS.length, 10)
  assert.equal(new Set(onboarding.QUESTIONS.map((question) => question.id)).size, 10)
  assert.equal(onboarding.hasOnboardingAnswers({}), false)
  assert.deepEqual(onboarding.getOnboardingSummary({}), [])
  for (const question of onboarding.QUESTIONS) {
    assert.ok(question.choices.length >= 2, question.id)
    assert.equal(new Set(question.choices.map((choice) => choice.id)).size, question.choices.length)
    for (const choice of question.choices) {
      assert.equal(typeof choice.id, "string")
      assert.ok(choice.title.length > 0)
      assert.equal(onboarding.hasOnboardingAnswers({ [question.id]: choice.id }), true)
      assert.deepEqual(onboarding.getOnboardingSummary({ [question.id]: choice.id }), [{ label: question.label, value: choice.title }])
    }
  }
})

test("skipping every question creates a valid English guide with no clinical scoring or religious exercise", () => {
  const guide = onboarding.buildPersonalizedGuide({})
  assert.equal(backup.isValidGuide(guide), true)
  assert.equal(guide.contentLocale, "en-US")
  assert.equal(guide.theologyEnabled, false)
  assert.equal(guide.completionConfig.theologyReviewEnabled, false)
  assert.equal(guide.bibleVersion, null)
  assert.equal(guide.intro.oracao, "")
  assert.ok(Object.values(guide.intro.salmo).every((verse) => verse === ""))
  assert.equal(guide.sections.length, 8)
  assert.equal(guide.weeklyPlan.length, 7)
  assert.deepEqual(guide.weeklyPlan.map((activity) => activity.dayIndex), [0, 1, 2, 3, 4, 5, 6])
  assert.ok(guide.weeklyPlan.every((activity) => backup.isValidActivity(activity)))
  for (const section of guide.sections) {
    assert.equal(section.scripture, undefined)
    for (const block of section.blocks) {
      assert.notEqual(block.type, "scale")
      if (block.type === "fields") assert.ok(block.fields.every((field) => field.kind !== "scale"))
    }
  }
})

test("invalid keys, free text, malformed values and inherited answers never personalize or enter a guide", () => {
  const neutral = onboarding.buildPersonalizedGuide({})
  const marker = "fixture-private-intake-not-allowed"
  const invalid = Object.fromEntries(onboarding.QUESTIONS.map((question) => [question.id, marker]))
  invalid.extraNotes = marker
  for (const value of [invalid, null, [], marker, { activity: { id: "move" } }, Object.create({ activity: "move" })]) {
    assert.equal(onboarding.hasOnboardingAnswers(value), false)
    assert.deepEqual(onboarding.getOnboardingSummary(value), [])
    assert.deepEqual(onboarding.buildPersonalizedGuide(value), neutral)
  }
  const recognized = { activity: "move", anchor: "morning", time: "10" }
  const withExtras = { ...recognized, support: marker, extraNotes: marker, __proto__: { intention: "meaning" } }
  assert.deepEqual(onboarding.buildPersonalizedGuide(withExtras), onboarding.buildPersonalizedGuide(recognized))
  assert.equal(JSON.stringify(onboarding.buildPersonalizedGuide(withExtras)).includes(marker), false)
})

test("every offered choice changes authored guide content rather than only the guide fingerprint", () => {
  for (const question of onboarding.QUESTIONS) {
    const variants = question.choices.map((choice) => onboarding.buildPersonalizedGuide({ [question.id]: choice.id }))
    for (const guide of variants) assert.equal(backup.isValidGuide(guide), true, question.id)
    const authored = variants.map((guide) => JSON.stringify(guideContent(guide)))
    assert.equal(new Set(authored).size, question.choices.length, question.id)
  }
})

test("selected activity, available time, anchor, pace and support make useful practical changes", () => {
  const writing = onboarding.buildPersonalizedGuide({ activity: "write", time: "5", anchor: "morning", pace: "small", support: "own" })
  const movement = onboarding.buildPersonalizedGuide({ activity: "move", time: "15", anchor: "evening", pace: "structure", support: "professional" })
  assert.match(JSON.stringify(writing.sections.slice(0, 3)), /Write about something in the present/)
  assert.match(JSON.stringify(movement.sections.slice(0, 3)), /accessible and comfortable/)
  assert.ok(writing.weeklyPlan.every((activity) => activity.time === "08:00" && activity.description.includes("5 minutes")))
  assert.ok(movement.weeklyPlan.every((activity) => activity.time === "20:00" && activity.description.includes("15 minutes")))
  assert.equal(writing.weeklyPlan.filter((activity) => activity.countsTowardCompletion).length, 3)
  assert.equal(movement.weeklyPlan.filter((activity) => activity.countsTowardCompletion).length, 7)
  assert.match(JSON.stringify(writing.sections), /No sharing or social contact is required/)
  assert.match(JSON.stringify(movement.sections), /does not choose a therapy/)
  assert.match(movement.weeklyPlan[5].description, /qualified professional/)
})

test("personalization is deterministic, has no network/storage side effects and never aliases defaults", () => {
  const originalDefaults = clone(GUIDE_TEMPLATES)
  const answers = Object.freeze({ intention: "routine", activity: "move", time: "10", format: "action", structure: "checklist" })
  const originalFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch")
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage")
  let sideEffects = 0
  const forbidden = () => { sideEffects += 1; throw new Error("fixture-forbidden-side-effect") }
  Object.defineProperty(globalThis, "fetch", { configurable: true, value: forbidden })
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: forbidden, setItem: forbidden, removeItem: forbidden } })
  try {
    const first = onboarding.buildPersonalizedGuide(answers)
    const second = onboarding.buildPersonalizedGuide(answers)
    assert.deepEqual(first, second)
    first.sections[0].title = "fixture-mutated-title"
    first.sections[0].blocks[0].text = "fixture-mutated-lead"
    first.weeklyPlan[0].description = "fixture-mutated-task"
    first.config.category = "fixture-mutated-category"
    first.completionConfig.analysisDimensions.push("fixture-mutated-dimension")
    assert.deepEqual(onboarding.buildPersonalizedGuide(answers), second)
    assert.deepEqual(GUIDE_TEMPLATES, originalDefaults)
    assert.equal(sideEffects, 0)
  } finally {
    if (originalFetch) Object.defineProperty(globalThis, "fetch", originalFetch)
    else delete globalThis.fetch
    if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage)
    else delete globalThis.localStorage
  }
})

test("personalized guides and their matching first week survive JSON backup validation", () => {
  for (const structure of ["gentle", "checklist", "open"]) {
    const guide = onboarding.buildPersonalizedGuide({ intention: "meaning", activity: "write", support: "trusted", focus: "connection", time: "10", structure })
    const firstWeek = week({ guideId: guide.id, templateId: guide.id, guideVersion: guide.version,
      guideSnapshot: clone(guide), completionConfig: clone(guide.completionConfig), data: { text: {}, done: {} },
      programacao: { dias: 7, activities: clone(guide.weeklyPlan) } })
    const personalized = payload({ guides: [guide, ...clone(GUIDE_TEMPLATES)], activeGuideId: guide.id,
      weeks: [firstWeek], settings: { theme: "light", palette: "sage", locale: "en-US", bibleVersion: "KJV" } })
    assert.equal(backup.isValidBackup(clone(personalized)), true, structure)
  }
})

test("every presentation choice exposes the live week grid for editing and recording chosen activities", () => {
  for (const structure of [undefined, "gentle", "checklist", "open"]) {
    const guide = onboarding.buildPersonalizedGuide(structure ? { structure } : {})
    const liveWeeks = guide.sections.flatMap((section) => section.blocks.filter((block) => block.type === "schedule"))
    assert.equal(liveWeeks.length, 1, structure || "all questions skipped")
    assert.ok(liveWeeks[0].rows.length > 0)
    assert.equal(backup.isValidGuide(guide), true)
  }
})

test("onboarding staging never replaces any existing UID workspace, including a corrupt original", () => {
  const guide = onboarding.buildPersonalizedGuide({ activity: "move" })
  for (const original of [JSON.stringify(payload()), "fixture-corrupt-original"]) {
    const storage = memoryStorage([["guia-retomada-v2:fixture-a", original]])
    assert.equal(onboardingDraft.stageOnboardingGuide(storage, "fixture-a", guide), false)
    assert.equal(storage.getItem("guia-retomada-v2:fixture-a"), original)
    assert.equal(storage.getItem(onboardingDraft.onboardingDraftKey("fixture-a")), null)
  }
})

test("derived onboarding drafts are validated, scoped to their UID and preserve malformed recovery data", () => {
  const storage = memoryStorage()
  const guideA = onboarding.buildPersonalizedGuide({ activity: "move", support: "professional" })
  const guideB = onboarding.buildPersonalizedGuide({ activity: "write", support: "own" })
  assert.equal(onboardingDraft.stageOnboardingGuide(storage, "fixture-a", guideA), true)
  assert.equal(onboardingDraft.readOnboardingGuide(storage, "fixture-b"), null)
  assert.equal(onboardingDraft.stageOnboardingGuide(storage, "fixture-b", guideB), true)
  assert.deepEqual(onboardingDraft.readOnboardingGuide(storage, "fixture-a"), guideA)
  assert.deepEqual(onboardingDraft.readOnboardingGuide(storage, "fixture-b"), guideB)
  assert.equal(onboardingDraft.stageOnboardingGuide(storage, "fixture-c", GUIDE_TEMPLATES[0]), false)
  const malformed = "fixture-invalid-derived-guide"
  storage.setItem(onboardingDraft.onboardingDraftKey("fixture-a"), malformed)
  assert.equal(onboardingDraft.readOnboardingGuide(storage, "fixture-a"), null)
  assert.equal(storage.getItem(onboardingDraft.onboardingDraftKey("fixture-a")), malformed)
  assert.deepEqual(onboardingDraft.readOnboardingGuide(storage, "fixture-b"), guideB)
})

test("gentle sound stays silent until opted in and cancels opening voices when muted or backgrounded", async () => {
  const descriptors = new Map(["window", "localStorage", "AudioContext"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const storage = memoryStorage()
  const contexts = []
  class FixtureAudioContext {
    constructor() {
      this.state = "suspended"
      this.currentTime = 0
      this.destination = {}
      this.voices = []
      this.suspensions = 0
      contexts.push(this)
    }
    createOscillator() {
      const voice = { type: "", frequency: { value: 0 }, stops: [], connect() {}, disconnect() {},
        start: () => {}, stop: (time) => voice.stops.push(time) }
      this.voices.push(voice)
      return voice
    }
    createGain() { return { gain: { value: .00001, setValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} }, connect() {}, disconnect() {} } }
    async resume() { this.state = "running" }
    async suspend() { this.state = "suspended"; this.suspensions += 1 }
  }
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} })
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage })
  Object.defineProperty(globalThis, "AudioContext", { configurable: true, value: FixtureAudioContext })
  const sound = loadSource(path.join(root, "lib/sounds.ts"))
  try {
    sound.initializeSounds()
    sound.beginOpeningSound()
    sound.unlockGentleSound()
    sound.gentleFeedback()
    assert.equal(sound.soundSnapshot(), false)
    assert.equal(contexts.length, 0)
    sound.setGentleSound(true)
    await Promise.resolve()
    assert.equal(sound.soundSnapshot(), true)
    assert.equal(contexts.length, 1)
    const audio = contexts[0]
    assert.ok(audio.voices.length > 0)
    assert.ok(audio.voices.every((voice) => voice.stops.length === 1))
    sound.setGentleSound(false)
    assert.equal(sound.soundSnapshot(), false)
    assert.equal(audio.state, "suspended")
    assert.ok(audio.voices.every((voice) => voice.stops.length === 2))
    const mutedVoices = audio.voices.length
    sound.gentleFeedback()
    assert.equal(audio.voices.length, mutedVoices)
    sound.setGentleSound(true)
    await Promise.resolve()
    const resumedVoices = audio.voices.slice(mutedVoices)
    assert.ok(resumedVoices.length > 0)
    sound.quietOnBackground()
    assert.equal(audio.state, "suspended")
    assert.ok(resumedVoices.every((voice) => voice.stops.length === 2))
    sound.gentleFeedback()
    assert.equal(audio.voices.length, mutedVoices + resumedVoices.length)
  } finally {
    sound.setGentleSound(false)
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
})

test("optional scripture resolution requires the exact known book and complete verse range", () => {
  for (const reference of ["Unknown 139:23-24", "John 139:23-24", "Psalm 139:23", "Psalm 139:24-23", "Psalm 139", "139:23-24", "Psalm 0:23-24"])
    assert.equal(BibleProvider.findPassage(reference), null, reference)
  const psalm = BibleProvider.findPassage("Psalm 139:23-24")
  assert.ok(psalm)
  assert.deepEqual(BibleProvider.findPassage("Salmos 139:23–24"), psalm)
  const firstJohn = BibleProvider.findPassage("1 John 4:18")
  assert.ok(firstJohn)
  assert.deepEqual(BibleProvider.findPassage("1 João 4:18"), firstJohn)
  assert.deepEqual(BibleProvider.findPassage("1John 4:18"), firstJohn)
  assert.equal(BibleProvider.findPassage("John 4:18"), null)
  assert.equal(BibleProvider.findPassage("2 John 4:18"), null)
})

test("optional scripture uses the selected language even when a legacy translation preference conflicts", () => {
  const known = BibleProvider.findPassage("Psalm 139:23-24")
  const english = BibleProvider.resolvePassage("Psalm 139:23-24", "ARA", "en-US")
  assert.equal(english.version, "KJV")
  assert.equal(english.text, known.kjv)
  assert.equal(english.ref, "Psalm 139:23-24")
  const portuguese = BibleProvider.resolvePassage("Psalm 139:23-24", "NIV", "pt-BR")
  assert.equal(portuguese.version, "ARA")
  assert.equal(portuguese.text, known.ara)
  assert.equal(portuguese.ref, "Salmos 139:23-24")
  assert.equal(BibleProvider.resolvePassage("Psalm 139:23-24").version, "KJV")
  assert.equal(BibleProvider.resolvePassage("Unknown 139:23-24", "NIV", "en-US").text, "")
})

test("demo remains unavailable without its explicit feature gate", () => {
  let entryGuardCalls = 0
  const controller = new DemoSessionController(false, () => { entryGuardCalls += 1; return true })
  assert.equal(controller.available, false)
  assert.equal(controller.start(), null)
  assert.equal(controller.start(onboarding.buildPersonalizedGuide({ activity: "move" })), null)
  assert.equal(controller.start(undefined, "first-visit"), null)
  assert.equal(controller.start(undefined, "returning-user"), null)
  assert.equal(controller.reset(), null)
  controller.exit()
  assert.equal(controller.session, null)
  assert.equal(entryGuardCalls, 0)
})

test("test entry waits for real pending account saves and rechecks only after leaving a test session", () => {
  const accountKey = "guia-retomada-v2:fixture-test-entry-account"
  const accountStorage = memoryStorage([[accountKey, "fixture-preserved-original"]])
  const engine = new SyncEngine()
  let storageBlocked = true
  let entryGuardCalls = 0
  const controller = new DemoSessionController(true, () => {
    entryGuardCalls += 1
    return engine.flushLocalPersist()
  })
  const latest = payload()
  latest.weeks[0].data.text["fixture-latest-account-note"] = "fixture-pending-account-edit"
  try {
    engine.scheduleSync(latest, (value) => {
      if (storageBlocked) throw new Error("fixture-storage-quota")
      accountStorage.setItem(accountKey, JSON.stringify(value))
    })
    assert.equal(controller.start(undefined, "first-visit"), null)
    assert.equal(controller.session, null)
    assert.equal(entryGuardCalls, 1)
    assert.equal(accountStorage.getItem(accountKey), "fixture-preserved-original")

    storageBlocked = false
    const firstVisit = controller.start(undefined, "first-visit")
    assert.ok(firstVisit)
    assert.equal(firstVisit.scenario, "first-visit")
    assert.equal(entryGuardCalls, 2)
    assert.equal(JSON.parse(accountStorage.getItem(accountKey)).weeks[0].data.text["fixture-latest-account-note"], "fixture-pending-account-edit")
    const savedAccountRecord = accountStorage.getItem(accountKey)

    storageBlocked = true
    engine.scheduleSync(payload(), () => { throw new Error("fixture-guard-must-not-run-inside-demo") })
    const reset = controller.reset()
    assert.equal(reset.scenario, "first-visit")
    assert.notEqual(reset.id, firstVisit.id)
    const returning = controller.start(undefined, "returning-user")
    assert.equal(returning.scenario, "returning-user")
    assert.equal(backup.isValidBackup(JSON.parse(returning.storage.getItem(returning.storageKey))), true)
    assert.equal(entryGuardCalls, 2)
    assert.equal(accountStorage.getItem(accountKey), savedAccountRecord)
    assert.equal(firstVisit.storage.getItem(firstVisit.storageKey), null)
    assert.equal(reset.storage.getItem(reset.storageKey), null)

    controller.exit()
    assert.equal(controller.start(undefined, "returning-user"), null)
    assert.equal(controller.session, null)
    assert.equal(entryGuardCalls, 3)
    assert.equal(accountStorage.getItem(accountKey), savedAccountRecord)
  } finally { engine.dispose(); controller.exit() }
})

test("first-visit test access starts with no workspace or history while returning access has example records", () => {
  const controller = new DemoSessionController(true)
  try {
    const firstVisit = controller.start(undefined, "first-visit")
    assert.equal(firstVisit.scenario, "first-visit")
    assert.equal(firstVisit.storage.getItem(firstVisit.storageKey), null)
    assert.equal(firstVisit.storage.getItem("guia-locale"), "en-US")
    assert.equal(firstVisit.storage.getItem("guia-bible-version"), "KJV")
    assert.equal(firstVisit.storage.getItem("anew-planner-tour:demo:v1"), null)

    const returning = controller.start(undefined, "returning-user")
    assert.equal(returning.scenario, "returning-user")
    const records = JSON.parse(returning.storage.getItem(returning.storageKey))
    assert.equal(backup.isValidBackup(records), true)
    assert.ok(records.weeks.some((entry) => entry.status === "completed"))
    assert.ok(records.weeks.some((entry) => Object.keys(entry.data.text).length > 0))
    assert.equal(returning.storage.getItem("anew-planner-tour:demo:v1"), "seen")
    assert.equal(firstVisit.storage.getItem("guia-locale"), null)
  } finally { controller.exit() }
})

test("resetting first-visit access removes authored records and pending saves while retaining the chosen scenario", () => {
  const controller = new DemoSessionController(true)
  const engine = new SyncEngine()
  try {
    const firstVisit = controller.start(undefined, "first-visit")
    firstVisit.storage.setItem(firstVisit.storageKey, JSON.stringify(payload()))
    firstVisit.storage.setItem("anew-planner-tour:demo:v1", "seen")
    firstVisit.storage.setItem("guia-novo-draft:demo", "fixture-new-user-draft")
    firstVisit.storage.setItem("guia-locale", "pt-BR")
    engine.scheduleSync(payload(), (value) => firstVisit.storage.setItem(firstVisit.storageKey, JSON.stringify(value)))

    const reset = controller.reset()
    assert.equal(reset.scenario, "first-visit")
    assert.notEqual(reset.id, firstVisit.id)
    assert.notEqual(reset.storageKey, firstVisit.storageKey)
    assert.equal(engine.flushLocalPersist(), true)
    assert.equal(reset.storage.getItem(reset.storageKey), null)
    assert.equal(reset.storage.getItem("guia-locale"), "en-US")
    assert.equal(reset.storage.getItem("anew-planner-tour:demo:v1"), null)
    assert.equal(reset.storage.getItem("guia-novo-draft:demo"), null)
    firstVisit.storage.setItem("fixture-late-write", "fixture-discarded")
    for (const key of [firstVisit.storageKey, "anew-planner-tour:demo:v1", "guia-novo-draft:demo", "fixture-late-write"])
      assert.equal(firstVisit.storage.getItem(key), null)
  } finally { engine.dispose(); controller.exit() }
})

test("returning-user resets preserve their scenario and custom seed without carrying test edits", () => {
  const guide = onboarding.buildPersonalizedGuide({ activity: "write", support: "trusted" })
  const original = clone(guide)
  const controller = new DemoSessionController(true)
  try {
    const session = controller.start(guide, "returning-user")
    const changed = JSON.parse(session.storage.getItem(session.storageKey))
    changed.weeks[0].data.text["fixture-returning-note"] = "fixture-only-in-old-session"
    session.storage.setItem(session.storageKey, JSON.stringify(changed))
    guide.title = "fixture-caller-change"

    const reset = controller.reset()
    assert.equal(reset.scenario, "returning-user")
    const records = JSON.parse(reset.storage.getItem(reset.storageKey))
    assert.equal(backup.isValidBackup(records), true)
    assert.equal(records.guides[0].title, `Demo: ${original.title}`)
    assert.equal(JSON.stringify(records).includes("fixture-only-in-old-session"), false)
    assert.equal(reset.storage.getItem("anew-planner-tour:demo:v1"), "seen")
    assert.equal(session.storage.getItem(session.storageKey), null)
  } finally { controller.exit() }
})

test("switching test scenarios never reads or changes account records, introduction flags or preferences", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage")
  const existing = [
    ["guia-retomada-v2:fixture-account-a", "fixture-account-a-records"],
    ["guia-retomada-v2:fixture-account-b", "fixture-account-b-records"],
    ["guia-retomada-v2", "fixture-legacy-records"],
    ["anew-onboarding-guide-v1:fixture-account-a", "fixture-account-a-draft"],
    ["anew-first-open-v1", "seen"],
    ["anew-introduction-seen-v1", "seen"],
    ["anew-planner-tour:fixture-account-a:v1", "seen"],
    ["guia-theme", "dark"],
    ["guia-palette", "terracotta"],
    ["guia-locale", "pt-BR"],
    ["guia-bible-version", "NVT"],
    ["anew-gentle-sound", "on"],
  ]
  const realValues = new Map(existing)
  let accountStorageCalls = 0
  const forbidden = () => { accountStorageCalls += 1; throw new Error("fixture-account-storage-forbidden") }
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: forbidden, setItem: forbidden, removeItem: forbidden, clear: forbidden } })
  const controller = new DemoSessionController(true)
  try {
    const firstVisit = controller.start(undefined, "first-visit")
    firstVisit.storage.setItem("anew-first-open-v1", "seen")
    firstVisit.storage.setItem("anew-introduction-seen-v1", "seen")
    firstVisit.storage.setItem("guia-theme", "light")
    firstVisit.storage.setItem("anew-gentle-sound", "off")
    controller.reset()
    const returning = controller.start(undefined, "returning-user")
    assert.equal(returning.storage.getItem("guia-theme"), null)
    assert.equal(returning.storage.getItem("anew-gentle-sound"), null)
    assert.equal(returning.storage.getItem("guia-locale"), "en-US")
    const nextFirstVisit = controller.start(undefined, "first-visit")
    assert.equal(nextFirstVisit.storage.getItem(nextFirstVisit.storageKey), null)
    assert.equal(returning.storage.getItem(returning.storageKey), null)
    controller.exit()
    assert.equal(controller.session, null)
    assert.equal(accountStorageCalls, 0)
    assert.deepEqual([...realValues], existing)
  } finally {
    controller.exit()
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor)
    else delete globalThis.localStorage
  }
})

test("public test access normalizes only the email and requires the exact demonstration password", () => {
  assert.equal(testAccess.matchesTestAccess(testAccess.TEST_EMAIL, testAccess.TEST_PASSWORD), true)
  assert.equal(testAccess.matchesTestAccess(`  ${testAccess.TEST_EMAIL.toUpperCase()}  `, testAccess.TEST_PASSWORD), true)
  for (const password of [testAccess.TEST_PASSWORD.toLowerCase(), ` ${testAccess.TEST_PASSWORD}`, `${testAccess.TEST_PASSWORD} `, `${testAccess.TEST_PASSWORD}\n`, ""])
    assert.equal(testAccess.matchesTestAccess(testAccess.TEST_EMAIL, password), false)
  for (const email of ["", `other-${testAccess.TEST_EMAIL}`, `${testAccess.TEST_EMAIL}.example`, testAccess.TEST_EMAIL.replace("@", "+other@")])
    assert.equal(testAccess.matchesTestAccess(email, testAccess.TEST_PASSWORD), false)
})

test("malformed public test credentials cannot match by coercion or invoke getters", () => {
  for (const value of [null, undefined, false, 0, {}, [], new String(testAccess.TEST_EMAIL)]) {
    assert.equal(testAccess.matchesTestAccess(value, testAccess.TEST_PASSWORD), false)
    assert.equal(testAccess.matchesTestAccess(testAccess.TEST_EMAIL, value), false)
  }
  const deceptive = { toString() { throw new Error("fixture-unsafe-coercion") } }
  assert.equal(testAccess.matchesTestAccess(deceptive, testAccess.TEST_PASSWORD), false)
})

test("matching public credentials never enables a disabled demo or creates an authentication identity", () => {
  assert.equal(testAccess.matchesTestAccess(testAccess.TEST_EMAIL, testAccess.TEST_PASSWORD), true)
  const unavailable = new DemoSessionController(false)
  assert.equal(unavailable.start(), null)
  const available = new DemoSessionController(true)
  const session = available.start()
  assert.ok(session)
  const data = JSON.parse(session.storage.getItem(session.storageKey))
  assert.equal(backup.isValidBackup(data), true)
  for (const name of ["user", "uid", "idToken", "refreshToken", "legalAccepted"])
    assert.equal(Object.prototype.hasOwnProperty.call(data, name), false)
  available.exit()
  assert.equal(session.storage.getItem(session.storageKey), null)
})

test("real demo factories produce coherent valid backups with distinct guides and completed example history", () => {
  for (const initialGuide of [undefined, onboarding.buildPersonalizedGuide({ pace: "small", activity: "move", support: "professional" }), { id: "fixture-invalid-guide" }]) {
    const fixture = createDemoBackup(initialGuide, "2026-12-31")
    assert.equal(backup.isValidBackup(clone(fixture)), true)
    assert.equal(fixture.locale, "en-US")
    assert.equal(fixture.guides.length, 2)
    assert.equal(new Set(fixture.guides.map((guide) => guide.id)).size, 2)
    assert.equal(fixture.weeks.length, 3)
    const guideIds = new Set(fixture.guides.map((guide) => guide.id))
    for (const entry of fixture.weeks) {
      assert.ok(guideIds.has(entry.guideId))
      assert.equal(entry.templateId, entry.guideId)
      assert.equal(entry.guideSnapshot.id, entry.guideId)
      assert.equal(entry.endDate, dates.calculateInclusiveEndDate(entry.startDate))
      assert.ok(entry.programacao.activities.every((activity) => backup.isValidActivity(activity)))
      assert.equal(entry.aiReview, null)
    }
    const completed = fixture.weeks.find((entry) => entry.status === "completed")
    assert.ok(completed?.completionSnapshot)
    const countable = completed.programacao.activities.filter((activity) => activity.countsTowardCompletion !== false)
    assert.equal(completed.completionSnapshot.totalTasks, countable.length)
    assert.equal(completed.completionSnapshot.completedTasks, countable.filter((activity) => completed.data.done[activity.id]).length)
    assert.equal(fixture.weeks.find((entry) => entry.id === fixture.activeWeekId).guideId, fixture.activeGuideId)
  }
})

test("demo fixtures never alias defaults, caller guides or the reset seed", () => {
  const defaults = clone(GUIDE_TEMPLATES)
  const personalized = onboarding.buildPersonalizedGuide({ intention: "meaning", activity: "write" })
  const original = clone(personalized)
  const fixture = createDemoBackup(personalized, "2026-10-12")
  fixture.guides[0].sections[0].blocks[0].text = "fixture-demo-edited"
  fixture.guides[0].weeklyPlan[0].description = "fixture-demo-task-edit"
  fixture.weeks[0].data.text["fixture-extra-note"] = "fixture-demo-note"
  assert.deepEqual(personalized, original)
  assert.deepEqual(GUIDE_TEMPLATES, defaults)
  assert.equal(JSON.stringify(createDemoBackup(personalized, "2026-10-12")).includes("fixture-demo-edited"), false)
  const controller = new DemoSessionController(true)
  controller.start(personalized)
  personalized.title = "fixture-caller-mutated-after-start"
  const reset = controller.reset()
  assert.equal(backup.isValidBackup(JSON.parse(reset.storage.getItem(reset.storageKey))), true)
  assert.equal(JSON.parse(reset.storage.getItem(reset.storageKey)).guides[0].title, `Demo: ${original.title}`)
  controller.exit()
})

test("demo helpers never read real local storage, Firebase or a network endpoint", () => {
  const descriptors = new Map(["localStorage", "fetch"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  let sideEffects = 0
  const forbidden = () => { sideEffects += 1; throw new Error("fixture-real-service-forbidden") }
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: forbidden, setItem: forbidden, removeItem: forbidden, clear: forbidden } })
  Object.defineProperty(globalThis, "fetch", { configurable: true, value: forbidden })
  try {
    const storage = new MemoryDemoStorage()
    storage.setItem("fixture", "sample")
    assert.equal(storage.getItem("fixture"), "sample")
    storage.removeItem("fixture")
    assert.equal(storage.getItem("fixture"), null)
    assert.equal(backup.isValidBackup(createDemoBackup(undefined, "2026-10-12")), true)
    const controller = new DemoSessionController(true)
    const session = controller.start()
    session.storage.setItem("guia-resource-favorites:demo", '["fixture-resource"]')
    session.storage.setItem("guia-novo-draft:demo", "fixture-draft")
    controller.reset()
    controller.exit()
    assert.equal(sideEffects, 0)
  } finally {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
})

test("resetting or exiting a demo revokes pending persistence and cannot resurrect notes or favorites", async () => {
  const realStorage = memoryStorage([["guia-retomada-v2:fixture-real", "fixture-real-original"]])
  const controller = new DemoSessionController(true)
  const first = controller.start()
  first.storage.setItem("guia-resource-favorites:demo", '["fixture-favorite"]')
  first.storage.setItem("guia-novo-draft:demo", "fixture-draft")
  const engine = new SyncEngine()
  try {
    engine.scheduleSync(payload(), (value) => first.storage.setItem(first.storageKey, JSON.stringify(value)))
    const second = controller.reset()
    assert.notEqual(second.id, first.id)
    assert.notEqual(second.storageKey, first.storageKey)
    assert.equal(engine.flushLocalPersist(), true)
    for (const key of [first.storageKey, "guia-resource-favorites:demo", "guia-novo-draft:demo"]) assert.equal(first.storage.getItem(key), null)
    assert.equal(backup.isValidBackup(JSON.parse(second.storage.getItem(second.storageKey))), true)
    second.storage.setItem("guia-resource-favorites:demo", '["fixture-another-favorite"]')
    engine.scheduleSync(payload(), (value) => second.storage.setItem(second.storageKey, JSON.stringify(value)))
    controller.exit()
    assert.equal(controller.session, null)
    assert.equal(engine.flushLocalPersist(), true)
    second.storage.setItem("fixture-stale-callback", "fixture-resurrection")
    for (const key of [second.storageKey, "guia-resource-favorites:demo", "fixture-stale-callback"]) assert.equal(second.storage.getItem(key), null)
    assert.equal(realStorage.getItem("guia-retomada-v2:fixture-real"), "fixture-real-original")
    await pause(190)
    assert.equal(first.storage.getItem(first.storageKey), null)
    assert.equal(second.storage.getItem(second.storageKey), null)
  } finally { engine.dispose(); controller.exit() }
})

test("demo sound preferences stay in memory and restore the real preference without rewriting it", () => {
  const descriptors = new Map(["window", "localStorage"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const realStorage = memoryStorage([["anew-gentle-sound", "on"], ["guia-retomada-v2:fixture-real", "fixture-real-original"]])
  const demoStorage = new MemoryDemoStorage()
  const sound = loadSource(path.join(root, "lib/sounds.ts"))
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} })
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: realStorage })
  try {
    sound.initializeSounds(undefined, true)
    assert.equal(sound.soundSnapshot(), true)
    sound.initializeSounds(demoStorage, true)
    assert.equal(sound.soundSnapshot(), false)
    sound.setGentleSound(true)
    assert.equal(demoStorage.getItem("anew-gentle-sound"), "on")
    sound.setGentleSound(false)
    assert.equal(demoStorage.getItem("anew-gentle-sound"), "off")
    assert.equal(realStorage.getItem("anew-gentle-sound"), "on")
    sound.initializeSounds(undefined, true)
    assert.equal(sound.soundSnapshot(), true)
    assert.equal(realStorage.getItem("anew-gentle-sound"), "on")
    assert.equal(realStorage.getItem("guia-retomada-v2:fixture-real"), "fixture-real-original")
    demoStorage.dispose()
  } finally {
    sound.quietOnBackground()
    sound.initializeSounds(new MemoryDemoStorage(), true)
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
})

function asyncMemoryStorage(entries = []) {
  const values = new Map(entries)
  const writes = []
  return { values, writes,
    getItem: async (key) => values.has(key) ? values.get(key) : null,
    setItem: async (key, value) => { writes.push({ key, value }); values.set(key, value) },
    removeItem: async (key) => { values.delete(key) },
  }
}

test("native blank and demo workspaces are valid English backups and never alias their seed guides", () => {
  const guide = onboarding.buildPersonalizedGuide({ activity: "move", pace: "small", support: "trusted" })
  const original = clone(guide)
  const workspace = nativeWorkspace.createBlankWorkspace(guide)
  assert.equal(backup.isValidBackup(workspace), true)
  assert.equal(workspace.locale, "en-US")
  assert.equal(workspace.activeGuideId, guide.id)
  assert.equal(workspace.weeks[0].guideSnapshot.id, guide.id)
  assert.deepEqual(workspace.weeks[0].data, { text: {}, done: {} })
  assert.equal(workspace.weeks[0].progresso.total, 3)
  workspace.guides[0].sections[0].blocks[0].text = "fixture-native-edit"
  workspace.weeks[0].programacao.activities[0].description = "fixture-native-task-edit"
  workspace.weeks[0].guideSnapshot.completionConfig.analysisDimensions.push("fixture-native-dimension")
  assert.deepEqual(guide, original)
  assert.equal(backup.isValidBackup(nativeWorkspace.createNativeDemoWorkspace(guide)), true)
  const boundaryWeek = nativeWorkspace.blankWeek(guide, "Boundary week", "2028-02-26")
  assert.equal(boundaryWeek.endDate, "2028-03-03")
  assert.throws(() => nativeWorkspace.blankWeek(guide, "Impossible date", "2026-02-30"), /INVALID_WORKSPACE/)
})

test("native first-visit tests start with one clean week while returning tests include completed sample history", () => {
  const guide = onboarding.buildPersonalizedGuide({ activity: "move", pace: "small", support: "trusted" })
  const original = clone(guide)
  const firstVisit = nativeWorkspace.createNativeDemoWorkspace(guide, "first-visit")
  assert.equal(backup.isValidBackup(firstVisit), true)
  assert.equal(firstVisit.starterPreview, true)
  assert.equal(firstVisit.locale, "en-US")
  assert.ok(firstVisit.guides.every((entry) => entry.theologyEnabled !== true))
  assert.equal(firstVisit.weeks.length, 1)
  assert.equal(firstVisit.weeks[0].status, "active")
  assert.equal(firstVisit.weeks[0].completedAt, null)
  assert.equal(firstVisit.weeks[0].completionSnapshot, null)
  assert.equal(firstVisit.weeks[0].aiReview, null)
  assert.deepEqual(firstVisit.weeks[0].data, { text: {}, done: {} })
  assert.deepEqual(firstVisit.resourceFavorites, [])
  assert.equal(firstVisit.activeGuideId, guide.id)
  assert.equal(firstVisit.activeWeekId, firstVisit.weeks[0].id)
  const restored = nativeWorkspace.parseNativeWorkspace(JSON.stringify(firstVisit))
  assert.equal(backup.isValidBackup(restored), true)
  assert.equal(restored.starterPreview, true)
  assert.deepEqual(restored.weeks[0].data, { text: {}, done: {} })

  firstVisit.guides[0].title = "fixture-first-test-edited-title"
  firstVisit.weeks[0].programacao.activities[0].description = "fixture-first-test-edited-task"
  assert.deepEqual(guide, original)
  const returning = nativeWorkspace.createNativeDemoWorkspace(guide, "returning-user")
  assert.equal(backup.isValidBackup(returning), true)
  assert.ok(returning.weeks.some((entry) => entry.status === "completed" && entry.completionSnapshot))
  assert.ok(returning.weeks.some((entry) => Object.keys(entry.data.text).length > 0))
  assert.equal(returning.guides[0].title, `Demo: ${original.title}`)
  assert.equal(JSON.stringify(returning).includes("fixture-first-test-edited"), false)
  assert.deepEqual(guide, original)
})

test("native parser preserves valid legacy guide associations, snapshots and authored notes", () => {
  const template = GUIDE_TEMPLATES[0]
  const legacyWeek = week({ guideSnapshot: { id: template.id, title: template.title, version: template.version,
    completionConfig: clone(template.completionConfig), theologyEnabled: false, contentLocale: template.contentLocale } })
  const legacy = { weeks: [legacyWeek] }
  assert.equal(backup.isValidBackup(legacy), true)
  const parsed = nativeWorkspace.parseNativeWorkspace(JSON.stringify(legacy))
  assert.ok(parsed)
  assert.equal(backup.isValidBackup(parsed), true)
  assert.equal(parsed.weeks[0].guideId, template.id)
  assert.equal(parsed.weeks[0].guideSnapshot.id, template.id)
  assert.equal(parsed.guides.find((guide) => guide.id === template.id).contentLocale, template.contentLocale)
  assert.deepEqual(parsed.weeks[0].data, legacyWeek.data)
  assert.equal(parsed.activeGuideId, template.id)
})

test("native parsing rejects malformed recovery records and returns detached valid normalized state", () => {
  const workspace = nativeWorkspace.createBlankWorkspace()
  workspace.resourceFavorites = ["fixture-resource", "fixture-resource"]
  const parsed = nativeWorkspace.parseNativeWorkspace(JSON.stringify(workspace))
  assert.ok(parsed)
  assert.deepEqual(parsed.resourceFavorites, ["fixture-resource"])
  assert.equal(backup.isValidBackup(parsed), true)
  parsed.guides[0].title = "fixture-native-parsed-title"
  assert.notEqual(workspace.guides[0].title, parsed.guides[0].title)
  for (const raw of ["fixture-invalid-json", JSON.stringify({ schemaVersion: 99, weeks: [] }), JSON.stringify({ ...workspace, resourceFavorites: [{}] }), JSON.stringify({ ...workspace, resourceFavorites: Array(501).fill("fixture-resource") })])
    assert.equal(nativeWorkspace.parseNativeWorkspace(raw), null)
})

test("native account storage rejects ambiguous owners and keeps A and B independently scoped", async () => {
  for (const uid of ["", "demo", "../fixture-account", "fixture:a", "fixture account", "a".repeat(129)])
    assert.throws(() => nativeWorkspace.workspaceStorageKey(uid), /INVALID_ACCOUNT_OWNER/)
  const storage = asyncMemoryStorage()
  const ownerA = new nativeWorkspace.NativeWorkspaceStorage(storage, "fixture-a")
  const ownerB = new nativeWorkspace.NativeWorkspaceStorage(storage, "fixture-b")
  assert.notEqual(ownerA.key, ownerB.key)
  const workspace = nativeWorkspace.createBlankWorkspace()
  assert.equal(await ownerA.save(workspace), false)
  assert.equal(storage.writes.length, 0)
  assert.equal((await ownerA.load()).kind, "empty")
  workspace.weeks[0].data.text["fixture-owner-a-note"] = "fixture-owned-by-a"
  assert.equal(await ownerA.save(workspace), true)
  assert.equal((await ownerB.load()).kind, "empty")
  assert.equal(await storage.getItem(ownerB.key), null)
  assert.equal(JSON.parse(await storage.getItem(ownerA.key)).weeks[0].data.text["fixture-owner-a-note"], "fixture-owned-by-a")
})

test("native getters hide the prior owner's notes immediately when authenticated access changes", () => {
  const workspace = nativeWorkspace.createBlankWorkspace()
  workspace.weeks[0].data.text["fixture-private-note"] = "fixture-a-only"
  assert.equal(nativeWorkspace.visibleNativeWorkspace(workspace, "fixture-a", "fixture-a"), workspace)
  for (const currentUid of ["fixture-b", null])
    assert.equal(nativeWorkspace.visibleNativeWorkspace(workspace, "fixture-a", currentUid), null)
  const example = nativeWorkspace.createNativeDemoWorkspace()
  assert.equal(nativeWorkspace.visibleNativeWorkspace(example, null, "fixture-a"), example)
  assert.equal(nativeWorkspace.visibleNativeWorkspace(example, null, null), example)
})

test("an owner-bound native preview cannot personalize a later account or signed-out visitor", () => {
  const personalized = onboarding.buildPersonalizedGuide({ activity: "move", support: "trusted" })
  assert.equal(nativeWorkspace.scopedPreviewGuide(personalized, null, "fixture-a"), personalized)
  assert.equal(nativeWorkspace.scopedPreviewGuide(personalized, "fixture-a", "fixture-a"), personalized)
  for (const currentUid of ["fixture-b", null]) {
    const safe = nativeWorkspace.scopedPreviewGuide(personalized, "fixture-a", currentUid)
    assert.notEqual(safe.id, personalized.id)
    assert.equal(safe.contentLocale, "en-US")
    assert.equal(backup.isValidGuide(safe), true)
    const empty = nativeWorkspace.createBlankWorkspace(safe)
    assert.deepEqual(empty.weeks[0].data, { text: {}, done: {} })
    assert.equal(JSON.stringify(empty).includes(personalized.id), false)
  }
})

test("failed legal writes release the current native session without accepting stale acknowledgement reads", () => {
  const guard = new SessionGuard()
  guard.transition("fixture-a")
  const beforeWrite = guard.capture("fixture-a")
  const failedWrite = guard.beginLegalWrite("fixture-a")
  const duringWrite = guard.capture("fixture-a")
  assert.equal(guard.finishLegalWrite(failedWrite), true)
  assert.equal(guard.matches(beforeWrite, true), false)
  assert.equal(guard.matches(duringWrite, true), false)
  assert.equal(guard.matches(guard.capture("fixture-a"), true), true)
  const anotherWrite = guard.beginLegalWrite("fixture-a")
  guard.transition("fixture-b")
  const currentB = guard.capture("fixture-b")
  assert.equal(guard.finishLegalWrite(anotherWrite), false)
  assert.equal(guard.matches(currentB, true), true)
})

test("native onboarding stages only the validated derived guide under its account owner", async () => {
  const storage = asyncMemoryStorage()
  const guide = onboarding.buildPersonalizedGuide({ activity: "move", pace: "small", support: "trusted" })
  const staging = new nativeWorkspace.NativeGuideDraftStorage(storage, "fixture-a")
  assert.equal(await staging.stage(guide), true)
  const raw = storage.values.get(nativeWorkspace.nativeGuideDraftKey("fixture-a"))
  assert.deepEqual(JSON.parse(raw), guide)
  assert.equal(backup.isValidGuide(JSON.parse(raw)), true)
  assert.equal(storage.values.has(nativeWorkspace.workspaceStorageKey("fixture-a")), false)
  assert.equal(await nativeWorkspace.readNativeGuideDraft(storage, "fixture-b"), null)
  const recovered = await nativeWorkspace.readNativeGuideDraft(storage, "fixture-a")
  assert.deepEqual(recovered, guide)
  recovered.sections[0].title = "fixture-recovered-guide-edit"
  assert.deepEqual(await nativeWorkspace.readNativeGuideDraft(storage, "fixture-a"), guide)
  for (const invalid of [null, { ...guide, contentLocale: "pt-BR" }, { ...guide, theologyEnabled: true }]) {
    const other = new nativeWorkspace.NativeGuideDraftStorage(storage, "fixture-b")
    assert.equal(await other.stage(invalid), false)
    assert.equal(storage.values.has(nativeWorkspace.nativeGuideDraftKey("fixture-b")), false)
  }
})

test("native staging refuses every existing workspace and preserves malformed staged originals", async () => {
  const guide = onboarding.buildPersonalizedGuide({ time: "brief" })
  const workspaceKey = nativeWorkspace.workspaceStorageKey("fixture-a")
  const draftKey = nativeWorkspace.nativeGuideDraftKey("fixture-a")
  for (const original of ["", "fixture-unread-workspace", JSON.stringify(nativeWorkspace.createBlankWorkspace())]) {
    const storage = asyncMemoryStorage([[workspaceKey, original]])
    const staging = new nativeWorkspace.NativeGuideDraftStorage(storage, "fixture-a")
    assert.equal(await staging.stage(guide), false)
    assert.equal(storage.values.get(workspaceKey), original)
    assert.equal(storage.values.has(draftKey), false)
    assert.equal(storage.writes.length, 0)
  }
  for (const original of ["", "fixture-unread-draft", JSON.stringify({ answers: "fixture-raw-intake" })]) {
    const storage = asyncMemoryStorage([[draftKey, original]])
    const staging = new nativeWorkspace.NativeGuideDraftStorage(storage, "fixture-a")
    assert.equal(await staging.stage(guide), false)
    assert.equal(await nativeWorkspace.readNativeGuideDraft(storage, "fixture-a"), null)
    assert.equal(storage.values.get(draftKey), original)
  }
})

test("native derived-guide queues serialize actor instances and snapshot each requested guide", async () => {
  const storage = asyncMemoryStorage()
  const writes = []
  let releaseFirst
  storage.setItem = (key, value) => {
    writes.push(value)
    if (writes.length === 1) return new Promise((resolve) => { releaseFirst = () => { storage.values.set(key, value); resolve() } })
    storage.values.set(key, value)
    return Promise.resolve()
  }
  const firstGuide = onboarding.buildPersonalizedGuide({ activity: "move" })
  const originalFirst = clone(firstGuide)
  const secondGuide = onboarding.buildPersonalizedGuide({ support: "trusted" })
  const firstActor = new nativeWorkspace.NativeGuideDraftStorage(storage, "fixture-a")
  const secondActor = new nativeWorkspace.NativeGuideDraftStorage(storage, "fixture-a")
  const first = firstActor.stage(firstGuide)
  firstGuide.title = "fixture-caller-mutation"
  const second = secondActor.stage(secondGuide)
  for (let turn = 0; turn < 8 && !releaseFirst; turn++) await Promise.resolve()
  assert.equal(writes.length, 1)
  assert.deepEqual(JSON.parse(writes[0]), originalFirst)
  releaseFirst()
  assert.equal(await first, true)
  assert.equal(await second, true)
  assert.equal(writes.length, 2)
  assert.deepEqual(await nativeWorkspace.readNativeGuideDraft(storage, "fixture-a"), secondGuide)
})

test("revoking native onboarding staging during a read prevents a late account write", async () => {
  const storage = asyncMemoryStorage()
  let releaseRead
  storage.getItem = () => new Promise((resolve) => { releaseRead = () => resolve(null) })
  const staging = new nativeWorkspace.NativeGuideDraftStorage(storage, "fixture-a")
  const pending = staging.stage(onboarding.buildPersonalizedGuide({}))
  await Promise.resolve()
  staging.revoke()
  releaseRead()
  assert.equal(await pending, false)
  assert.equal(storage.writes.length, 0)
  assert.equal(await staging.stage(onboarding.buildPersonalizedGuide({})), false)
})

test("native draft clearing drains pending stages and deletes only that owner's derived guide", async () => {
  const keyA = nativeWorkspace.nativeGuideDraftKey("fixture-a")
  const keyB = nativeWorkspace.nativeGuideDraftKey("fixture-b")
  const storage = asyncMemoryStorage([[keyB, "fixture-b-staged-original"]])
  let releaseWrite
  storage.setItem = (key, value) => new Promise((resolve) => { releaseWrite = () => { storage.values.set(key, value); resolve() } })
  const staging = new nativeWorkspace.NativeGuideDraftStorage(storage, "fixture-a")
  const pending = staging.stage(onboarding.buildPersonalizedGuide({ support: "trusted" }))
  for (let turn = 0; turn < 8 && !releaseWrite; turn++) await Promise.resolve()
  const clearing = nativeWorkspace.clearNativeGuideDraft(storage, "fixture-a")
  releaseWrite()
  assert.equal(await pending, true)
  await clearing
  assert.equal(storage.values.has(keyA), false)
  assert.equal(storage.values.get(keyB), "fixture-b-staged-original")
})

test("native storage preserves unread corrupt originals and only an explicit valid replacement permits writes", async () => {
  const key = nativeWorkspace.workspaceStorageKey("fixture-a")
  const original = "fixture-corrupt-native-original"
  const storage = asyncMemoryStorage([[key, original]])
  const owner = new nativeWorkspace.NativeWorkspaceStorage(storage, "fixture-a")
  assert.deepEqual(await owner.load(), { kind: "invalid", raw: original })
  const fresh = nativeWorkspace.createBlankWorkspace()
  assert.equal(await owner.save(fresh), false)
  assert.equal(storage.values.get(key), original)
  assert.equal(await owner.replace(fresh), true)
  assert.equal(backup.isValidBackup(JSON.parse(storage.values.get(key))), true)
})

test("native replacement waits for its owner read to finish before accepting explicit recovery", async () => {
  const storage = asyncMemoryStorage()
  let releaseRead
  storage.getItem = () => new Promise((resolve) => { releaseRead = () => resolve("fixture-unread-original") })
  const owner = new nativeWorkspace.NativeWorkspaceStorage(storage, "fixture-a")
  const fresh = nativeWorkspace.createBlankWorkspace()
  assert.equal(owner.loadComplete, false)
  assert.equal(await owner.replace(fresh), false)
  const loading = owner.load()
  assert.equal(owner.loadComplete, false)
  assert.equal(await owner.replace(fresh), false)
  assert.equal(storage.writes.length, 0)
  releaseRead()
  assert.deepEqual(await loading, { kind: "invalid", raw: "fixture-unread-original" })
  assert.equal(owner.loadComplete, true)
  assert.equal(await owner.replace(fresh), true)
  owner.revoke()
  assert.equal(owner.loadComplete, false)
  assert.equal(await owner.replace(fresh), false)
})

test("a later corrupt or unavailable native reload revokes permission to overwrite the unread account data", async () => {
  for (const unavailable of [false, true]) {
    const storage = asyncMemoryStorage()
    const owner = new nativeWorkspace.NativeWorkspaceStorage(storage, "fixture-a")
    assert.equal((await owner.load()).kind, "empty")
    const original = "fixture-original-after-storage-change"
    storage.values.set(owner.key, original)
    if (unavailable) storage.getItem = async () => { throw new Error("fixture-storage-unavailable") }
    assert.equal((await owner.load()).kind, unavailable ? "unavailable" : "invalid")
    assert.equal(await owner.save(nativeWorkspace.createBlankWorkspace()), false)
    assert.equal(storage.values.get(owner.key), original)
  }
})

test("native asynchronous writes stay serialized and snapshot each edit before the caller mutates it", async () => {
  const storage = asyncMemoryStorage()
  let releaseFirst
  const order = []
  storage.setItem = (key, value) => new Promise((resolve) => {
    order.push(value)
    if (order.length === 1) releaseFirst = () => { storage.values.set(key, value); resolve() }
    else { storage.values.set(key, value); resolve() }
  })
  const owner = new nativeWorkspace.NativeWorkspaceStorage(storage, "fixture-a")
  await owner.load()
  const workspace = nativeWorkspace.createBlankWorkspace()
  workspace.weeks[0].data.text["fixture-note"] = "first edit"
  const first = owner.save(workspace)
  workspace.weeks[0].data.text["fixture-note"] = "second edit"
  const second = owner.save(workspace)
  await Promise.resolve()
  assert.equal(order.length, 1)
  assert.equal(JSON.parse(order[0]).weeks[0].data.text["fixture-note"], "first edit")
  releaseFirst()
  assert.equal(await first, true)
  assert.equal(await second, true)
  assert.equal(order.length, 2)
  assert.equal(JSON.parse(storage.values.get(owner.key)).weeks[0].data.text["fixture-note"], "second edit")
})

test("native quota failure reports failure and flush retries the actual latest queued edit", async () => {
  const storage = asyncMemoryStorage()
  let unavailable = true
  storage.setItem = async (key, value) => { if (unavailable) throw new Error("fixture-native-quota"); storage.values.set(key, value) }
  const owner = new nativeWorkspace.NativeWorkspaceStorage(storage, "fixture-a")
  await owner.load()
  const workspace = nativeWorkspace.createBlankWorkspace()
  workspace.weeks[0].data.text["fixture-note"] = "recover this latest edit"
  assert.equal(await owner.save(workspace), false)
  assert.equal(await owner.flush(), false)
  assert.equal(storage.values.has(owner.key), false)
  unavailable = false
  assert.equal(await owner.flush(), true)
  assert.equal(JSON.parse(storage.values.get(owner.key)).weeks[0].data.text["fixture-note"], "recover this latest edit")
})

test("native flush includes edits queued while the first write is still pending", async () => {
  const storage = asyncMemoryStorage()
  let releaseFirst
  let writes = 0
  storage.setItem = (key, value) => {
    writes += 1
    if (writes === 1) return new Promise((resolve) => { releaseFirst = () => { storage.values.set(key, value); resolve() } })
    return Promise.reject(new Error("fixture-latest-edit-quota"))
  }
  const owner = new nativeWorkspace.NativeWorkspaceStorage(storage, "fixture-a")
  await owner.load()
  const first = owner.save(nativeWorkspace.createBlankWorkspace())
  await Promise.resolve()
  const flushing = owner.flush()
  const later = nativeWorkspace.createBlankWorkspace()
  later.weeks[0].data.text["fixture-latest-note"] = "queued after flush began"
  const second = owner.save(later)
  releaseFirst()
  assert.equal(await first, true)
  assert.equal(await flushing, false)
  assert.equal(await second, false)
  assert.equal(JSON.parse(storage.values.get(owner.key)).weeks[0].data.text["fixture-latest-note"], undefined)
})

test("revoking A during an asynchronous load never applies A's records to B", async () => {
  const fixtureA = nativeWorkspace.createBlankWorkspace()
  fixtureA.weeks[0].data.text["fixture-private-note"] = "fixture-a-only"
  const keyA = nativeWorkspace.workspaceStorageKey("fixture-a")
  const storage = asyncMemoryStorage([[keyA, JSON.stringify(fixtureA)]])
  let releaseRead
  storage.getItem = (key) => key === keyA ? new Promise((resolve) => { releaseRead = () => resolve(storage.values.get(key)) }) : Promise.resolve(storage.values.get(key) ?? null)
  const ownerA = new nativeWorkspace.NativeWorkspaceStorage(storage, "fixture-a")
  const oldRead = ownerA.load()
  ownerA.revoke()
  const ownerB = new nativeWorkspace.NativeWorkspaceStorage(storage, "fixture-b")
  assert.equal((await ownerB.load()).kind, "empty")
  releaseRead()
  assert.deepEqual(await oldRead, { kind: "revoked" })
  assert.equal(await ownerA.save(fixtureA), false)
  assert.equal(await ownerB.save(nativeWorkspace.createBlankWorkspace()), true)
  assert.equal(JSON.stringify(JSON.parse(storage.values.get(ownerB.key))).includes("fixture-a-only"), false)
  assert.equal(JSON.parse(storage.values.get(ownerA.key)).weeks[0].data.text["fixture-private-note"], "fixture-a-only")
})

test("native deletion waits for an in-flight write, cancels queued writes and removes only its own account", async () => {
  const keyB = nativeWorkspace.workspaceStorageKey("fixture-b")
  const storage = asyncMemoryStorage([[keyB, "fixture-b-original"]])
  let releaseWrite
  let writes = 0
  storage.setItem = (key, value) => { writes += 1; return new Promise((resolve) => { releaseWrite = () => { storage.values.set(key, value); resolve() } }) }
  const owner = new nativeWorkspace.NativeWorkspaceStorage(storage, "fixture-a")
  await owner.load()
  const first = owner.save(nativeWorkspace.createBlankWorkspace())
  const second = owner.save(nativeWorkspace.createBlankWorkspace())
  await Promise.resolve()
  const deletion = owner.remove()
  releaseWrite()
  assert.equal(await first, false)
  assert.equal(await second, false)
  await deletion
  assert.equal(writes, 1)
  assert.equal(storage.values.has(owner.key), false)
  assert.equal(storage.values.get(keyB), "fixture-b-original")
  assert.equal(await owner.save(nativeWorkspace.createBlankWorkspace()), false)
  assert.equal(await owner.flush(), false)
})

test("native removal failure rejects and preserves records without reviving its cancelled write queue", async () => {
  const fixtureA = nativeWorkspace.createBlankWorkspace()
  fixtureA.weeks[0].data.text["fixture-private-note"] = "fixture-a-preserved"
  const keyA = nativeWorkspace.workspaceStorageKey("fixture-a")
  const keyB = nativeWorkspace.workspaceStorageKey("fixture-b")
  const original = JSON.stringify(fixtureA)
  const storage = asyncMemoryStorage([[keyA, original], [keyB, "fixture-b-preserved"]])
  storage.removeItem = async () => { throw new Error("fixture-remove-unavailable") }
  const owner = new nativeWorkspace.NativeWorkspaceStorage(storage, "fixture-a")
  assert.equal((await owner.load()).kind, "ready")
  await assert.rejects(owner.remove(), /fixture-remove-unavailable/)
  assert.equal(storage.values.get(keyA), original)
  assert.equal(storage.values.get(keyB), "fixture-b-preserved")
  assert.equal(owner.loadComplete, false)
  assert.equal(await owner.save(nativeWorkspace.createBlankWorkspace()), false)
  assert.equal(await owner.replace(nativeWorkspace.createBlankWorkspace()), false)
  assert.equal(await owner.flush(), false)
  assert.equal(storage.writes.length, 0)
})

test("every local planner preset is a valid detached seven-day guide with optional secular steps", () => {
  for (const locale of ["en-US", "pt-BR"]) {
    assert.deepEqual(planner.getPlannerPresets(locale).map((preset) => preset.id), ["rest", "gentle", "routine", "balance", "focus", "momentum", "active", "blank"])
    assert.deepEqual(planner.getPlannerPresets(locale).map((preset) => preset.effort), [0, 1, 2, 3, 4, 5, 6, 0])
    for (const preset of planner.getPlannerPresets(locale)) {
      const first = planner.buildPresetGuide(preset.id, locale)
      const second = planner.buildPresetGuide(preset.id, locale)
      assert.equal(backup.isValidGuide(first), true, `${locale}/${preset.id}`)
      assert.equal(first.contentLocale, locale)
      assert.equal(first.theologyEnabled, false)
      assert.equal(first.completionConfig.theologyReviewEnabled, false)
      assert.equal(first.intro.oracao, "")
      assert.equal(first.intro.salmo.ref, "")
      assert.equal(first.weeklyPlan.length, preset.id === "blank" ? 0 : 7)
      assert.deepEqual(first.weeklyPlan.map((task) => task.dayIndex), preset.id === "blank" ? [] : [0, 1, 2, 3, 4, 5, 6])
      assert.deepEqual(first.scheduleTaskIds, first.weeklyPlan.map((task) => task.id))
      assert.ok(first.weeklyPlan.every((task) => task.countsTowardCompletion === (preset.id !== "rest")))
      assert.equal(Object.hasOwn(first, "clinicalScore"), false)
      assert.notEqual(first.id, second.id)
      assert.equal(new Set([...first.weeklyPlan, ...second.weeklyPlan].map((task) => task.id)).size, first.weeklyPlan.length + second.weeklyPlan.length)
      first.sections[0].title = "fixture changed section"
      first.sections[0].blocks[1].fields[0].label = "fixture changed field"
      if (first.weeklyPlan[0]) first.weeklyPlan[0].description = "fixture changed activity"
      assert.notEqual(second.sections[0].title, "fixture changed section")
      assert.notEqual(second.sections[0].blocks[1].fields[0].label, "fixture changed field")
      if (second.weeklyPlan[0]) assert.notEqual(second.weeklyPlan[0].description, "fixture changed activity")
    }
  }
})

test("the first-dashboard starter is stable, brief, detached, and never replaces an existing workspace", () => {
  const first = planner.createStarterGuide()
  const second = planner.createStarterGuide()
  assert.deepEqual(first, second)
  assert.equal(backup.isValidGuide(first), true)
  assert.equal(first.contentLocale, "en-US")
  assert.equal(first.sections.length, 1)
  assert.equal(first.weeklyPlan.length, 7)
  const fields = first.sections.flatMap((section) => section.blocks.filter((block) => block.type === "fields").flatMap((block) => block.fields))
  assert.equal(fields.length, 1)
  assert.ok(first.weeklyPlan.every((task) => task.description.length < 150))
  first.sections[0].blocks[1].fields[0].label = "fixture mutated starter"
  first.weeklyPlan[0].description = "fixture mutated starter task"
  assert.notEqual(second.sections[0].blocks[1].fields[0].label, "fixture mutated starter")
  assert.notEqual(second.weeklyPlan[0].description, "fixture mutated starter task")
  const original = payload()
  const before = JSON.stringify(original)
  planner.createStarterGuide("pt-BR")
  assert.equal(JSON.stringify(original), before)
})

test("local goal presets include the user's chosen goal and instructions without contacting providers", () => {
  const originalFetch = global.fetch
  const originalWindow = global.window
  const originalStorage = global.localStorage
  const forbidden = () => { throw new Error("fixture planner must stay local") }
  global.fetch = forbidden
  global.window = { localStorage: { getItem: forbidden, setItem: forbidden } }
  global.localStorage = global.window.localStorage
  try {
    const options = { preset: "focus", name: "  My chosen week  ", goal: "learn a chord", intensity: "light",
      routine: "after lunch", whatHelps: "an acoustic instrument", thingsToAvoid: "late-night activities",
      instructions: "Keep the activity seated", additionalNotes: "Practice is optional" }
    const before = JSON.stringify(options)
    const guide = planner.createPlannerGuide(options)
    assert.equal(JSON.stringify(options), before)
    assert.equal(guide.title, "My chosen week")
    assert.match(guide.weeklyPlan[0].description, /learn a chord/)
    assert.match(guide.weeklyPlan[2].description, /10 minutes/)
    const preferences = guide.sections[1].blocks.map((block) => block.text)
    for (const value of ["learn a chord", "after lunch", "an acoustic instrument", "late-night activities", "Keep the activity seated", "Practice is optional"]) {
      assert.ok(preferences.includes(value), value)
    }
    assert.equal(backup.isValidGuide(guide), true)
    assert.equal(planner.createPlannerGuide().contentLocale, "en-US")
    assert.equal(planner.buildPresetGuide("unknown-fixture").weeklyPlan.length, 7)
  } finally {
    global.fetch = originalFetch
    if (originalWindow === undefined) delete global.window; else global.window = originalWindow
    if (originalStorage === undefined) delete global.localStorage; else global.localStorage = originalStorage
  }
})

test("local planner preferences are bounded before a guide can be exported", () => {
  const guide = planner.createPlannerGuide({ preset: "focus", name: "x".repeat(1000), goal: "g".repeat(3000),
    routine: "r".repeat(6000), instructions: "i".repeat(6000), additionalNotes: "n".repeat(6000) })
  assert.equal(guide.title.length, 100)
  assert.equal(guide.sections[1].blocks[0].text.length, 300)
  assert.ok(guide.sections[1].blocks.every((block) => block.text.length <= 1200))
  assert.equal(backup.isValidGuide(guide), true)
})

test("section revisions preserve existing field identities and notes through reorder, rename, add, and delete", () => {
  const guide = planner.createPlannerGuide({ name: "Fixture original", goal: "learn a chord" })
  const oldField = guide.sections[0].blocks[1].fields[0]
  const oldGuide = clone(guide)
  const oldWeek = week({ guideId: guide.id, templateId: guide.id, guideVersion: guide.version,
    guideSnapshot: { id: guide.id, title: guide.title, version: guide.version, completionConfig: clone(guide.completionConfig), sections: clone(guide.sections) },
    data: { text: { [oldField.id]: "fixture authored note" }, done: { [guide.weeklyPlan[0].id]: true } },
    programacao: { dias: 7, activities: clone(guide.weeklyPlan) } })
  const oldWeekSerialized = JSON.stringify(oldWeek)
  const sections = clone(guide.sections).reverse()
  sections[1].title = "Fixture renamed notes"
  sections[1].blocks[1].fields[0].label = "Fixture revised prompt"
  sections.push({ id: "fixture-custom-section", number: "09", title: "Fixture custom", kicker: "OPTIONAL",
    blocks: [{ type: "fields", fields: [{ kind: "textarea", id: "fixture-new-field", label: "Fixture custom note" }] }] })
  const revision = planner.reviseGuideSections(guide, sections)
  assert.ok(revision)
  assert.equal(revision.id, guide.id)
  assert.equal(revision.version, guide.version + 1)
  assert.equal(revision.customized, true)
  assert.deepEqual(revision.sections.map((section) => section.number), ["01", "02", "03"])
  assert.equal(revision.sections[1].blocks[1].fields[0].id, oldField.id)
  assert.equal(revision.sections[1].blocks[1].fields[0].label, "Fixture revised prompt")
  assert.deepEqual(guide, oldGuide)
  assert.equal(JSON.stringify(oldWeek), oldWeekSerialized)
  assert.equal(backup.isValidBackup(payload({ guides: [revision], activeGuideId: guide.id, weeks: [oldWeek] })), true)
  sections[1].blocks[1].fields[0].label = "fixture mutation after save"
  assert.equal(revision.sections[1].blocks[1].fields[0].label, "Fixture revised prompt")
  const deleted = planner.reviseGuideSections(revision, revision.sections.filter((section) => section.id !== guide.sections[0].id))
  assert.ok(deleted)
  assert.equal(JSON.stringify(oldWeek), oldWeekSerialized)
  assert.equal(oldWeek.data.text[oldField.id], "fixture authored note")
  assert.equal(oldWeek.data.done[guide.weeklyPlan[0].id], true)
  assert.equal(oldWeek.guideSnapshot.version, 1)
  assert.equal(oldWeek.guideSnapshot.sections[0].blocks[1].fields[0].label, oldField.label)
})

test("invalid custom section revisions are refused before changing the original guide", () => {
  const guide = planner.createPlannerGuide()
  const original = JSON.stringify(guide)
  const duplicate = clone(guide.sections)
  duplicate.push(clone(duplicate[0]))
  assert.equal(planner.reviseGuideSections(guide, duplicate), null)
  const malformed = clone(guide.sections)
  malformed[0].blocks = [{ type: "fields", fields: [{ kind: "scale", id: "fixture-scale", label: "Fixture rating", max: 1000000 }] }]
  assert.equal(planner.reviseGuideSections(guide, malformed), null)
  assert.equal(planner.reviseGuideSections(guide, Array.from({ length: 61 }, (_, index) => ({ id: `fixture-${index}`, number: "01", title: "Fixture", kicker: "", blocks: [] }))), null)
  assert.equal(JSON.stringify(guide), original)
  assert.ok(planner.reviseGuideSections(guide, []), "people can remove every optional section")
})

test("duplicate answer IDs and malformed historical sections cannot enter a planner backup", () => {
  const guide = planner.createPlannerGuide()
  const repeatedField = clone(guide.sections[0].blocks[1].fields[0])
  const duplicateSections = clone(guide.sections)
  duplicateSections.push({ id: "fixture-second-section", number: "02", title: "Fixture second section", kicker: "",
    blocks: [{ type: "fields", fields: [repeatedField] }] })
  assert.equal(planner.reviseGuideSections(guide, duplicateSections), null)
  assert.equal(backup.isValidGuide({ ...guide, sections: duplicateSections }), false)
  const original = week({ guideId: guide.id, templateId: guide.id, guideSnapshot: {
    id: guide.id, title: guide.title, version: guide.version, completionConfig: clone(guide.completionConfig), sections: clone(guide.sections),
  } })
  assert.equal(backup.isValidBackup(payload({ guides: [guide], activeGuideId: guide.id, weeks: [original] })), true)
  original.guideSnapshot.sections = duplicateSections
  assert.equal(backup.isValidBackup(payload({ guides: [guide], activeGuideId: guide.id, weeks: [original] })), false)
  original.guideSnapshot.sections = [{ id: "fixture-section", number: "01", title: "Fixture malformed", kicker: "", blocks: [{ type: "unsupported" }] }]
  assert.equal(backup.isValidBackup(payload({ guides: [guide], activeGuideId: guide.id, weeks: [original] })), false)
})

function draftSuggestions(overrides = {}) {
  return { name: "Fixture Week", focus: "One small task", routineSchedule: "", whatHelps: "", thingsToAvoid: "", additionalNotes: "", ...overrides }
}

async function withNativeAIEnvironment(action) {
  const originalBase = process.env.EXPO_PUBLIC_API_BASE_URL
  const originalFetch = global.fetch
  process.env.EXPO_PUBLIC_API_BASE_URL = "https://fixture-planner.invalid"
  try { await action() } finally {
    if (originalBase === undefined) delete process.env.EXPO_PUBLIC_API_BASE_URL; else process.env.EXPO_PUBLIC_API_BASE_URL = originalBase
    global.fetch = originalFetch
  }
}

test("native AI requires an explicit HTTPS origin and validates all suggested fields", () => {
  for (const base of ["", "http://fixture-planner.invalid", "/api", "https://fixture-planner.invalid/path", "https://fixture-planner.invalid?query=1", "https://fixture-planner.invalid#fragment", "https://user:password@fixture-planner.invalid"]) {
    assert.equal(nativeAI.nativeAIUrl(base), null, base)
  }
  assert.equal(nativeAI.nativeAIUrl(" https://fixture-planner.invalid/ "), "https://fixture-planner.invalid/api/generate-guide")
  assert.equal(nativeAI.validDraftSuggestions(draftSuggestions()), true)
  assert.equal(nativeAI.validDraftSuggestions(draftSuggestions({ name: "x".repeat(101) })), false)
  assert.equal(nativeAI.validDraftSuggestions(draftSuggestions({ focus: "x".repeat(1201) })), false)
  assert.equal(nativeAI.validDraftSuggestions(draftSuggestions({ unknown: "fixture extra" })), false)
  assert.equal(nativeAI.validDraftSuggestions(draftSuggestions({ name: 42 })), false)
  const missing = draftSuggestions(); delete missing.routineSchedule
  assert.equal(nativeAI.validDraftSuggestions(missing), false)
  assert.equal(nativeAI.validDraftSuggestions(null), false)
  assert.equal(nativeAI.validDraftSuggestions([]), false)
})

test("native guide AI never contacts providers without consent, configuration, current access, or an uncancelled request", async () => {
  await withNativeAIEnvironment(async () => {
    let tokenCalls = 0, requests = 0
    global.fetch = async () => { requests += 1; throw new Error("fixture network must not be reached") }
    const token = async () => { tokenCalls += 1; return "fixture-token" }
    await assert.rejects(nativeAI.requestNativeGuideAI({ mode: "assist", aiConsent: false }, token), /Confirm/)
    assert.equal(tokenCalls, 0)
    delete process.env.EXPO_PUBLIC_API_BASE_URL
    await assert.rejects(nativeAI.requestNativeGuideAI({ mode: "assist", aiConsent: true }, token), /configured HTTPS backend/)
    assert.equal(tokenCalls, 0)
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://fixture-planner.invalid"
    await assert.rejects(nativeAI.requestNativeGuideAI({ mode: "assist", aiConsent: true }, async () => { throw new Error("fixture demo or account access denied") }), /access denied/)
    const controller = new AbortController(); controller.abort()
    await assert.rejects(nativeAI.requestNativeGuideAI({ mode: "assist", aiConsent: true }, token, controller.signal), /cancelled/)
    assert.equal(requests, 0)
  })
})

test("native AI authenticates a validated result twice and rejects malformed or stale responses", async () => {
  await withNativeAIEnvironment(async () => {
    let tokenCalls = 0, requests = 0, outgoing
    const body = { mode: "assist", aiConsent: true, focus: "fixture selected goal" }
    const token = async () => { tokenCalls += 1; return "fixture-token" }
    global.fetch = async (url, options) => {
      requests += 1; outgoing = { url, options }
      return new Response(JSON.stringify({ draftSuggestions: draftSuggestions() }), { status: 200, headers: { "Content-Type": "application/json" } })
    }
    assert.deepEqual(await nativeAI.requestNativeGuideAI(body, token), { draftSuggestions: draftSuggestions() })
    assert.equal(requests, 1)
    assert.equal(tokenCalls, 2)
    assert.equal(outgoing.url, "https://fixture-planner.invalid/api/generate-guide")
    assert.equal(outgoing.options.headers.Authorization, "Bearer fixture-token")
    assert.deepEqual(JSON.parse(outgoing.options.body), body)
    let access = 0
    await assert.rejects(nativeAI.requestNativeGuideAI(body, async () => {
      access += 1
      if (access > 1) throw new Error("fixture owner changed")
      return "fixture-token"
    }), /owner changed/)
    global.fetch = async () => new Response(JSON.stringify({ draftSuggestions: draftSuggestions({ name: {} }) }), { status: 200 })
    await assert.rejects(nativeAI.requestNativeGuideAI(body, token), /incomplete or invalid/)
    global.fetch = async () => new Response("{malformed fixture", { status: 200 })
    await assert.rejects(nativeAI.requestNativeGuideAI(body, token), /incomplete response/)
    global.fetch = async () => new Response(JSON.stringify({ error: "fixture service refused" }), { status: 503 })
    await assert.rejects(nativeAI.requestNativeGuideAI(body, token), /fixture service refused/)
    const guide = planner.createPlannerGuide()
    global.fetch = async () => new Response(JSON.stringify({ guideTemplate: guide }), { status: 200 })
    assert.deepEqual(await nativeAI.requestNativeGuideAI({ mode: "generate", aiConsent: true }, token), { guideTemplate: guide })
    guide.sections[0].blocks = [{ type: "unsupported" }]
    await assert.rejects(nativeAI.requestNativeGuideAI({ mode: "generate", aiConsent: true }, token), /incomplete or invalid/)
  })
})

test("cancelling native AI during its final access check discards the otherwise valid result", async () => {
  await withNativeAIEnvironment(async () => {
    const controller = new AbortController()
    let tokenCalls = 0
    global.fetch = async () => new Response(JSON.stringify({ draftSuggestions: draftSuggestions() }), { status: 200 })
    await assert.rejects(nativeAI.requestNativeGuideAI({ mode: "assist", aiConsent: true }, async () => {
      tokenCalls += 1
      if (tokenCalls === 2) controller.abort()
      return "fixture-token"
    }, controller.signal), /cancelled/)
  })
})

test("native starter flags and historical sections survive backup parsing without aliasing the current guide", () => {
  const guide = planner.createStarterGuide()
  const fixture = nativeWorkspace.createBlankWorkspace(guide)
  fixture.starterPreview = true
  const field = fixture.guides[0].sections[0].blocks[1].fields[0]
  fixture.weeks[0].data.text[field.id] = "fixture original note"
  fixture.weeks[0].guideSnapshot.sections[0].title = "Fixture Historical Section"
  fixture.guides[0].sections[0].title = "Fixture Current Section"
  const original = JSON.stringify(fixture)
  const parsed = nativeWorkspace.parseNativeWorkspace(original)
  assert.ok(parsed)
  assert.equal(parsed.starterPreview, true)
  assert.equal(parsed.guides[0].sections[0].title, "Fixture Current Section")
  assert.equal(parsed.weeks[0].guideSnapshot.sections[0].title, "Fixture Historical Section")
  assert.equal(parsed.weeks[0].data.text[field.id], "fixture original note")
  parsed.guides[0].sections[0].title = "Fixture Mutated Current Section"
  assert.equal(parsed.weeks[0].guideSnapshot.sections[0].title, "Fixture Historical Section")
  assert.equal(JSON.stringify(fixture), original)
  for (const flag of ["true", 1, null]) {
    assert.equal(nativeWorkspace.parseNativeWorkspace(JSON.stringify({ ...fixture, starterPreview: flag })), null)
  }
  assert.ok(nativeWorkspace.parseNativeWorkspace(JSON.stringify({ ...fixture, starterPreview: false })))
  const legacy = clone(fixture); delete legacy.starterPreview
  assert.ok(nativeWorkspace.parseNativeWorkspace(JSON.stringify(legacy)))
})

test("display titles capitalize English and Portuguese while preserving acronyms, brands, punctuation, and stored text", () => {
  const saved = { title: "my guide · meu guia", note: "iOS and eBay work with AI" }
  const original = clone(saved)
  assert.equal(titleCase(saved.title), "My Guide · Meu Guia")
  assert.equal(titleCase("ações e instruções — my weekly-plan / 7 days"), "Ações E Instruções — My Weekly-Plan / 7 Days")
  assert.equal(titleCase(saved.note), "iOS And eBay Work With AI")
  assert.equal(titleCase("Google Gemini, JSON, Anew. and Anew's guide"), "Google Gemini, JSON, Anew. And Anew's Guide")
  assert.equal(titleCase(""), "")
  assert.equal(titleCase(titleCase(saved.title)), titleCase(saved.title))
  assert.deepEqual(saved, original)
})

test("web Guide edits preserve every open and completed Week snapshot, answer, and activity", () => {
  const guide = planner.createPlannerGuide({ name: "Fixture Anchor", goal: "A small start" })
  const otherGuide = planner.createPlannerGuide({ name: "Fixture Other Anchor" })
  const open = guideRevision.createWeekFromGuide([guide], guide.id, { id: "fixture-open-week", title: "Fixture Open Week", startDate: "2026-10-12", createdAt: "2026-10-12T12:00:00.000Z" })
  const completed = guideRevision.createWeekFromGuide([guide], guide.id, { id: "fixture-completed-week", title: "Fixture Completed Week", startDate: "2026-10-19", createdAt: "2026-10-19T12:00:00.000Z" })
  const fieldId = guide.sections[0].blocks[1].fields[0].id
  open.data.text[fieldId] = "Fixture week-only note"
  open.data.done[guide.weeklyPlan[0].id] = true
  open.programacao.activities[0].description = "Fixture week-only activity"
  open.guideSnapshot.sections[0].title = "Fixture Week-only Section"
  completed.status = "completed"
  completed.completedAt = "2026-10-25T18:00:00.000Z"
  completed.completionSnapshot = { totalTasks: 7, completedTasks: 0, completionPercentage: 0, completedAt: completed.completedAt,
    taskResults: completed.programacao.activities.map((activity) => ({ ...activity, done: false, countsTowardCompletion: activity.countsTowardCompletion !== false })) }
  completed.aiReview = { verdict: "Fixture saved reflection", summary: "Fixture preserved summary", whatWorked: [], difficulties: [], observedPatterns: [], nextWeekSuggestions: [], generatedAt: completed.completedAt, analysisVersion: 1 }
  const workspace = { guides: [guide, otherGuide], weeks: [open, completed] }
  const original = JSON.stringify(workspace)
  const sections = clone(guide.sections).reverse()
  sections[1].blocks[1].fields[0].label = "Fixture Future Prompt"
  const weeklyPlan = clone(guide.weeklyPlan).slice(0, 2)
  weeklyPlan[0].description = "Fixture Future Activity"
  const revised = guideRevision.reviseGuideInWorkspace(workspace, guide.id,
    { title: " Fixture Revised Anchor ", description: "Fixture revised defaults", sections, weeklyPlan }, "2026-10-26T12:00:00.000Z")
  assert.ok(revised)
  assert.equal(revised.weeks, workspace.weeks)
  assert.equal(revised.weeks[0], open)
  assert.equal(revised.weeks[1], completed)
  assert.equal(JSON.stringify(workspace), original)
  assert.equal(revised.guides[1], otherGuide)
  const anchor = revised.guides[0]
  assert.equal(anchor.id, guide.id)
  assert.equal(anchor.version, guide.version + 1)
  assert.equal(anchor.createdAt, guide.createdAt)
  assert.equal(anchor.schemaVersion, guide.schemaVersion)
  assert.equal(anchor.customized, true)
  assert.equal(anchor.title, "Fixture Revised Anchor")
  assert.equal(anchor.intro.title, anchor.title)
  assert.equal(anchor.description, "Fixture revised defaults")
  assert.deepEqual(anchor.scheduleTaskIds, weeklyPlan.map((activity) => activity.id))
  assert.deepEqual(anchor.sections.map((section) => section.number), ["01", "02"])
  assert.equal(anchor.sections[1].blocks[1].fields[0].id, fieldId)
  assert.equal(anchor.theologyEnabled, guide.theologyEnabled)
  assert.equal(anchor.bibleVersion, guide.bibleVersion)
  assert.equal(backup.isValidBackup(payload({ guides: revised.guides, activeGuideId: guide.id, weeks: revised.weeks, activeWeekId: open.id })), true)
  sections[1].blocks[1].fields[0].label = "Fixture changed editor draft"
  weeklyPlan[0].description = "Fixture changed routine draft"
  assert.equal(anchor.sections[1].blocks[1].fields[0].label, "Fixture Future Prompt")
  assert.equal(anchor.weeklyPlan[0].description, "Fixture Future Activity")
  assert.equal(JSON.stringify(workspace), original)
})

test("Add Week uses the selected revised Guide defaults and never inherits earlier Week edits", () => {
  const guide = planner.createPlannerGuide({ name: "Fixture Original Anchor" })
  const previous = guideRevision.createWeekFromGuide([guide], guide.id, { id: "fixture-earlier-week", title: "Fixture Earlier Week", startDate: "2026-10-12", createdAt: "2026-10-12T12:00:00.000Z" })
  const oldFieldId = guide.sections[0].blocks[1].fields[0].id
  previous.data.text[oldFieldId] = "Fixture retained note"
  previous.data.done[guide.weeklyPlan[0].id] = true
  previous.programacao.activities = [{ id: "fixture-week-only-task", dayIndex: 6, time: "21:00", description: "Fixture one-week change", order: 0 }]
  previous.guideSnapshot.sections[0].title = "Fixture Historical Prompt"
  const before = JSON.stringify(previous)
  const revised = guideRevision.reviseGuideInWorkspace({ guides: [guide], weeks: [previous] }, guide.id,
    { title: "Fixture Next Anchor", description: "Fixture next defaults", sections: [{ id: "fixture-future-section", number: "09", title: "Fixture Future Section", kicker: "OPTIONAL", blocks: [{ type: "fields", fields: [{ kind: "textarea", id: "fixture-future-note", label: "Fixture Future Note" }] }] }],
      weeklyPlan: [{ id: "fixture-default-task", dayIndex: 2, time: "08:30", description: "Fixture reusable default", order: 0, countsTowardCompletion: true }, { id: "fixture-optional-task", dayIndex: 3, time: "11:00", description: "Fixture informational default", order: 0, countsTowardCompletion: false }] }, "2026-10-19T12:00:00.000Z")
  const next = guideRevision.createWeekFromGuide(revised.guides, guide.id, { id: "fixture-next-week", title: "Fixture Next Week", startDate: "2026-12-28", createdAt: "2026-12-28T12:00:00.000Z" })
  assert.ok(next)
  assert.equal(next.guideId, guide.id)
  assert.equal(next.templateId, guide.id)
  assert.equal(next.guideVersion, guide.version + 1)
  assert.equal(next.guideSnapshot.title, "Fixture Next Anchor")
  assert.deepEqual(next.guideSnapshot.sections, revised.guides[0].sections)
  assert.deepEqual(next.programacao.activities, revised.guides[0].weeklyPlan)
  assert.deepEqual(next.data, { text: {}, done: {} })
  assert.deepEqual(next.progresso, { total: 1, concluidas: 0, percentual: 0 })
  assert.equal(next.startDate, "2026-12-28")
  assert.equal(next.endDate, "2027-01-03")
  assert.equal(next.status, "active")
  assert.equal(next.aiReview, null)
  assert.equal(next.completionSnapshot, null)
  assert.equal(JSON.stringify(previous), before)
  assert.equal(guideRevision.sectionsForWeek(previous, revised.guides[0]), previous.guideSnapshot.sections)
  assert.equal(previous.guideSnapshot.sections[0].title, "Fixture Historical Prompt")
  assert.equal(previous.data.text[oldFieldId], "Fixture retained note")
  assert.equal(backup.isValidBackup(payload({ guides: revised.guides, activeGuideId: guide.id, weeks: [previous, next], activeWeekId: next.id })), true)
})

test("new web Weeks detach nested defaults from their Guide and each other", () => {
  const guide = planner.createPlannerGuide({ name: "Fixture Detached Anchor" })
  const other = planner.createPlannerGuide({ name: "Fixture Unselected Anchor", preset: "blank" })
  const make = (id) => guideRevision.createWeekFromGuide([other, guide], guide.id, { id, title: "Fixture Week", startDate: "2026-10-12", createdAt: "2026-10-12T12:00:00.000Z" })
  const first = make("fixture-first-week")
  const sameOperation = make("fixture-first-week")
  const second = make("fixture-second-week")
  assert.equal(first.guideId, guide.id, "the selected Guide is used even when it is not the first anchor")
  assert.equal(first.guideSnapshot.title, "Fixture Detached Anchor")
  assert.deepEqual(first, sameOperation, "the caller supplies one stable ID and timestamp")
  assert.notEqual(first.guideSnapshot.sections, guide.sections)
  assert.notEqual(first.guideSnapshot.sections[0].blocks, guide.sections[0].blocks)
  assert.notEqual(first.guideSnapshot.completionConfig.analysisDimensions, guide.completionConfig.analysisDimensions)
  assert.notEqual(first.programacao.activities[0], guide.weeklyPlan[0])
  const originalGuide = JSON.stringify(guide)
  const originalSecond = JSON.stringify(second)
  first.guideSnapshot.sections[0].blocks[1].fields[0].label = "Fixture local prompt"
  first.guideSnapshot.completionConfig.analysisDimensions.push("Fixture local review dimension")
  first.programacao.activities[0].description = "Fixture local routine"
  first.data.text["fixture-note"] = "Fixture local note"
  first.data.done[first.programacao.activities[0].id] = true
  assert.equal(JSON.stringify(guide), originalGuide)
  assert.equal(JSON.stringify(second), originalSecond)
  guide.sections[0].title = "Fixture changed reusable section"
  guide.weeklyPlan[0].description = "Fixture changed reusable routine"
  assert.equal(JSON.stringify(second), originalSecond)
})

test("web Guide transitions reject unknown anchors and invalid edits without changing records", () => {
  const guide = planner.createPlannerGuide()
  const originalWeek = guideRevision.createWeekFromGuide([guide], guide.id, { id: "fixture-valid-week", title: "Fixture Valid Week", startDate: "2026-10-12", createdAt: "2026-10-12T12:00:00.000Z" })
  const workspace = { guides: [guide], weeks: [originalWeek] }
  const original = JSON.stringify(workspace)
  const updates = { title: guide.title, description: guide.description, sections: clone(guide.sections), weeklyPlan: clone(guide.weeklyPlan) }
  const revise = (changes, id = guide.id) => guideRevision.reviseGuideInWorkspace(workspace, id, { ...updates, ...changes }, "2026-10-13T12:00:00.000Z")
  assert.equal(revise({}, "fixture-unknown-guide"), null)
  assert.equal(revise({ title: " " }), null)
  assert.equal(revise({ title: "x".repeat(301) }), null)
  assert.equal(revise({ sections: [...updates.sections, clone(updates.sections[0])] }), null)
  assert.equal(revise({ weeklyPlan: [...updates.weeklyPlan, clone(updates.weeklyPlan[0])] }), null)
  assert.equal(revise({ weeklyPlan: [{ ...updates.weeklyPlan[0], dayIndex: 7 }] }), null)
  assert.equal(revise({ weeklyPlan: [null] }), null)
  assert.equal(guideRevision.createWeekFromGuide([guide], "fixture-unknown-guide", { id: "fixture-new-week", title: "Fixture Week", startDate: "2026-10-12", createdAt: "2026-10-12T12:00:00.000Z" }), null)
  assert.equal(guideRevision.createWeekFromGuide([guide], guide.id, { id: "fixture-new-week", title: "Fixture Week", startDate: "2026-02-30", createdAt: "2026-10-12T12:00:00.000Z" }), null)
  assert.equal(JSON.stringify(workspace), original)
  const empty = revise({ sections: [], weeklyPlan: [] })
  assert.ok(empty, "every section and default task remains optional")
  const emptyWeek = guideRevision.createWeekFromGuide(empty.guides, guide.id, { id: "fixture-empty-week", title: "Fixture Empty Week", startDate: "2026-10-19", createdAt: "2026-10-19T12:00:00.000Z" })
  assert.deepEqual(emptyWeek.guideSnapshot.sections, [])
  assert.deepEqual(emptyWeek.programacao.activities, [])
  assert.deepEqual(emptyWeek.progresso, { total: 0, concluidas: 0, percentual: 0 })
  assert.deepEqual(guideRevision.sectionsForWeek(emptyWeek, guide), [])
  const legacy = { ...originalWeek, guideSnapshot: null }
  assert.equal(guideRevision.sectionsForWeek(legacy, guide), guide.sections)
  assert.equal(JSON.stringify(workspace), original)
})

function plannedWeekFixture() {
  const guide = planner.buildPresetGuide("gentle", "en-US", { name: "Fixture Internal Plan" }, { id: "fixture-planned-source", createdAt: "2026-10-12T12:00:00.000Z" })
  const first = guideRevision.createWeekFromGuide([guide], guide.id, { id: "fixture-selected-week", title: "Fixture Selected Week", startDate: "2026-10-12", createdAt: "2026-10-12T12:00:00.000Z" })
  first.setup = { pattern: "gentle", expectation: "Keep my chosen step", name: "Fixture Selected Week", routine: "After lunch", whatHelps: "A quiet place", thingsToAvoid: "Late tasks", additionalNotes: "Every step is optional", intensity: "light", burdens: ["worry", "other"], burdensOther: "Fixture chosen burden", discipline: ["consistency", "other"], disciplineOther: "Fixture chosen routine", psychology: "humanistic", psychologyOther: "Fixture inactive psychology text", spirituality: false, theology: "none", theologyOther: "Fixture inactive tradition text" }
  first.programacao.activities[0].description = "Fixture actual week-only activity"
  first.programacao.activities[0].time = "14:30"
  first.guideSnapshot.sections[0].title = "Fixture Customized Notes"
  const fieldId = first.guideSnapshot.sections[0].blocks[1].fields[0].id
  first.data.text = { [fieldId]: "Fixture daily words\nPreserve spacing  ", "fixture-removed-field": "Fixture note from a removed field" }
  first.data.done[first.programacao.activities[0].id] = true
  const otherGuide = planner.buildPresetGuide("blank", "en-US", {}, { id: "fixture-other-source", createdAt: "2026-12-28T12:00:00.000Z" })
  const other = guideRevision.createWeekFromGuide([otherGuide], otherGuide.id, { id: "fixture-other-week", title: "Fixture Other Week", startDate: "2026-12-28", createdAt: "2026-12-28T12:00:00.000Z" })
  return { guides: [guide, otherGuide], weeks: [first, other], activeWeekId: first.id, activeGuideId: guide.id }
}
const plannedOptions = { id: "fixture-next-week", guideId: "fixture-next-source", createdAt: "2027-01-04T12:00:00.000Z", today: "2026-10-13", locale: "en-US" }

test("Week setup hydration preserves every explicit preference and never reads daily answers", () => {
  const fixture = plannedWeekFixture()
  const previous = fixture.weeks[0]
  const before = JSON.stringify(fixture)
  const hydrated = weekPlanning.setupFromPreviousWeek(previous, fixture.guides[0])
  assert.deepEqual(hydrated, previous.setup)
  hydrated.burdens.push("low-energy")
  hydrated.expectation = "Fixture edited next-week expectation"
  assert.equal(JSON.stringify(fixture), before)
  const legacy = { ...previous }; delete legacy.setup
  Object.defineProperty(legacy, "data", { get() { throw new Error("fixture hydration must not read daily notes") } })
  const guessed = weekPlanning.setupFromPreviousWeek(legacy, fixture.guides[0])
  assert.deepEqual(guessed, { pattern: "gentle", expectation: "", name: previous.title, psychology: "none", spirituality: false, theology: "none" })
  assert.equal(weekPlanning.setupFromPreviousWeek(fixture.weeks[1], fixture.guides[1]).pattern, "blank")
  assert.equal(weekPlanning.setupFromPreviousWeek().pattern, "gentle")
})

test("adding the same Week pattern copies exact daily notes and actual activities while resetting results", () => {
  const fixture = plannedWeekFixture()
  const previous = fixture.weeks[0]
  previous.status = "completed"
  previous.completedAt = "2026-10-18T18:00:00.000Z"
  previous.completionSnapshot = { totalTasks: 7, completedTasks: 1, completionPercentage: 14, completedAt: previous.completedAt,
    taskResults: previous.programacao.activities.map((activity) => ({ ...activity, done: Boolean(previous.data.done[activity.id]), countsTowardCompletion: true })) }
  previous.aiReview = { verdict: "Fixture previous reflection", summary: "Fixture retained summary", whatWorked: [], difficulties: [], observedPatterns: [], nextWeekSuggestions: [], generatedAt: previous.completedAt, analysisVersion: 1 }
  const before = JSON.stringify(fixture)
  const submitted = weekPlanning.setupFromPreviousWeek(previous, fixture.guides[0])
  submitted.expectation = "Fixture new expectation"
  const next = weekPlanning.createPlannedWeekInWorkspace(fixture, submitted, plannedOptions)
  assert.ok(next)
  const created = next.newWeek
  assert.equal(created.startDate, "2027-01-04", "the latest end date across every internal template determines the default")
  assert.equal(created.endDate, "2027-01-10")
  assert.deepEqual(created.setup, submitted)
  assert.deepEqual(created.data.text, previous.data.text)
  assert.notEqual(created.data.text, previous.data.text)
  assert.deepEqual(created.data.done, {})
  assert.deepEqual(created.programacao.activities, previous.programacao.activities)
  assert.notEqual(created.programacao.activities[0], previous.programacao.activities[0])
  assert.deepEqual(created.guideSnapshot.sections, previous.guideSnapshot.sections)
  assert.notEqual(created.guideSnapshot.sections[0].blocks, previous.guideSnapshot.sections[0].blocks)
  assert.equal(created.status, "active")
  assert.equal(created.completedAt, null)
  assert.equal(created.completionSnapshot, null)
  assert.equal(created.aiReview, null)
  assert.equal(created.aiReviewOutdated, false)
  assert.deepEqual(created.progresso, { total: 7, concluidas: 0, percentual: 0 })
  assert.equal(next.weeks[0], previous)
  assert.equal(next.weeks[1], fixture.weeks[1])
  assert.equal(next.guides[0], fixture.guides[0])
  assert.equal(next.guides[1], fixture.guides[1])
  assert.equal(JSON.stringify(fixture), before)
  assert.equal(backup.isValidBackup({ schemaVersion: 4, ...next }), true)
  const repeated = weekPlanning.createPlannedWeekInWorkspace(fixture, submitted, plannedOptions)
  assert.deepEqual(repeated, next, "explicit identities, dates, and timestamps make the transition deterministic")
  created.data.text["fixture-removed-field"] = "Fixture changed new-week note"
  created.setup.burdens.push("low-energy")
  created.programacao.activities[0].description = "Fixture changed new-week task"
  created.guideSnapshot.sections[0].title = "Fixture changed new-week section"
  assert.equal(JSON.stringify(fixture), before)
})

test("changing Week patterns rebuilds the selected voluntary plan without losing prior notes or custom sections", () => {
  const fixture = plannedWeekFixture()
  const before = JSON.stringify(fixture)
  for (const pattern of ["rest", "routine", "balance", "focus", "momentum", "active", "blank"]) {
    const selected = { ...clone(fixture.weeks[0].setup), pattern, expectation: "Fixture chosen expectation", name: "Fixture New Name" }
    const next = weekPlanning.createPlannedWeekInWorkspace(fixture, selected, plannedOptions)
    assert.ok(next, pattern)
    assert.equal(next.newWeek.setup.pattern, pattern)
    assert.equal(next.newWeek.setup.expectation, selected.expectation)
    assert.equal(next.newWeek.title, selected.name)
    assert.deepEqual(next.newWeek.data.text, fixture.weeks[0].data.text)
    assert.deepEqual(next.newWeek.data.done, {})
    assert.deepEqual(next.newWeek.guideSnapshot.sections, fixture.weeks[0].guideSnapshot.sections)
    assert.equal(next.newWeek.programacao.activities.length, pattern === "blank" ? 0 : 7)
    assert.deepEqual(next.newWeek.programacao.activities.map((activity) => activity.dayIndex), pattern === "blank" ? [] : [0, 1, 2, 3, 4, 5, 6])
    assert.ok(next.newWeek.programacao.activities.every((activity) => activity.id.startsWith(plannedOptions.guideId)))
    assert.ok(next.newWeek.programacao.activities.every((activity) => activity.countsTowardCompletion === (pattern !== "rest")))
    assert.equal(next.newWeek.progresso.total, pattern === "rest" || pattern === "blank" ? 0 : 7)
    assert.equal(JSON.stringify(fixture), before)
  }
})

test("Week customization changes only the addressed open Week and retains field identities and every daily answer", () => {
  const fixture = plannedWeekFixture()
  const before = JSON.stringify(fixture)
  const target = fixture.weeks[0]
  const sections = clone(target.guideSnapshot.sections)
  const fieldId = sections[0].blocks[1].fields[0].id
  sections[0].blocks[1].fields[0].label = "Fixture Revised Weekly Prompt"
  const activities = clone(target.programacao.activities).slice(0, 2)
  activities[1].description = "Fixture new weekly step"
  const revised = weekPlanning.updateWeekPlanInWorkspace(fixture, target.id, { title: "Fixture Renamed Week", sections, weeklyPlan: activities }, "2026-10-14T12:00:00.000Z")
  assert.ok(revised)
  assert.equal(revised.guides, fixture.guides)
  assert.equal(revised.weeks[1], fixture.weeks[1])
  assert.equal(revised.weeks[0].data, target.data)
  assert.equal(revised.weeks[0].guideSnapshot.sections[0].blocks[1].fields[0].id, fieldId)
  assert.equal(revised.weeks[0].data.text[fieldId], target.data.text[fieldId])
  assert.equal(revised.weeks[0].data.text["fixture-removed-field"], target.data.text["fixture-removed-field"])
  assert.deepEqual(revised.weeks[0].progresso, { total: 2, concluidas: 1, percentual: 50 })
  assert.equal(JSON.stringify(fixture), before)
  sections[0].blocks[1].fields[0].label = "Fixture later editor mutation"
  activities[0].description = "Fixture later activity mutation"
  assert.equal(revised.weeks[0].guideSnapshot.sections[0].blocks[1].fields[0].label, "Fixture Revised Weekly Prompt")
  assert.equal(revised.weeks[0].programacao.activities[0].description, target.programacao.activities[0].description)
  assert.equal(weekPlanning.updateWeekPlanInWorkspace(fixture, "fixture-unknown-week", { title: "Fixture", sections: [], weeklyPlan: [] }, "2026-10-14T12:00:00.000Z"), null)
  const completed = { ...fixture, weeks: [{ ...target, status: "completed" }, fixture.weeks[1]] }
  assert.equal(weekPlanning.updateWeekPlanInWorkspace(completed, target.id, { title: "Fixture", sections: [], weeklyPlan: [] }, "2026-10-14T12:00:00.000Z"), null)
  assert.equal(JSON.stringify(fixture), before)
})

test("editing saved Week choices with the same pattern preserves renamed title, dates, activities, checks, and daily fields", () => {
  const fixture = plannedWeekFixture()
  const target = fixture.weeks[0]
  target.title = "Fixture Renamed Through Week Details"
  target.data.done["fixture-custom-note-check"] = true
  target.aiReview = { verdict: "Fixture earlier review", summary: "Fixture retained reflection", whatWorked: [], difficulties: [], observedPatterns: [], nextWeekSuggestions: [], generatedAt: "2026-10-13T10:00:00.000Z", analysisVersion: 1 }
  const before = JSON.stringify(fixture)
  const setup = { ...weekPlanning.setupFromPreviousWeek(target, fixture.guides[0]), name: target.title,
    expectation: "Fixture revised expectation", routine: "After 18:00", thingsToAvoid: "Leave Saturday open", burdens: ["other"], burdensOther: "Fixture changed preference" }
  const revised = weekPlanning.updateWeekSetupInWorkspace(fixture, target.id, setup, "2026-10-14T12:00:00.000Z", "en-US")
  assert.ok(revised)
  const saved = revised.weeks[0]
  assert.equal(saved.title, target.title, "editing choices uses the current name, not stale setup metadata")
  assert.deepEqual(saved.setup, setup)
  assert.notEqual(saved.setup, setup)
  assert.equal(saved.startDate, target.startDate)
  assert.equal(saved.endDate, target.endDate)
  assert.equal(saved.createdAt, target.createdAt)
  assert.deepEqual(saved.programacao, target.programacao)
  assert.deepEqual(saved.data, target.data)
  assert.deepEqual(saved.progresso, target.progresso)
  assert.deepEqual(saved.guideSnapshot.sections, target.guideSnapshot.sections)
  assert.equal(saved.guideSnapshot.sections[0].blocks[1].fields[0].id, target.guideSnapshot.sections[0].blocks[1].fields[0].id)
  assert.equal(saved.data.done["fixture-custom-note-check"], true)
  assert.equal(saved.aiReview, target.aiReview)
  assert.equal(saved.aiReviewOutdated, true)
  assert.equal(revised.activeWeekId, fixture.activeWeekId)
  assert.equal(revised.activeGuideId, fixture.activeGuideId)
  assert.equal(revised.guides, fixture.guides)
  assert.equal(revised.weeks[1], fixture.weeks[1])
  assert.equal(backup.isValidBackup({ schemaVersion: 4, ...revised }), true)
  assert.equal(JSON.stringify(fixture), before)
  setup.burdens.push("worry")
  assert.deepEqual(saved.setup.burdens, ["other"], "submitted choices remain detached")
  assert.equal(JSON.stringify(fixture), before)
})

test("changing a saved Week pattern replaces only activity results while preserving custom notes, checks, and history", () => {
  const fixture = plannedWeekFixture()
  const target = fixture.weeks[0]
  target.setup.spirituality = true; target.setup.theology = "christianity"
  target.guideSnapshot.theologyEnabled = true; target.guideSnapshot.bibleVersion = "KJV"
  target.guideSnapshot.sections[0].scripture = { verses: [{ ref: "Fixture reference", ara: "Fixture verse", nvt: "Fixture verse", kjv: "Fixture verse", niv: "Fixture verse" }], comentario: "Fixture commentary", oracao: "Fixture prayer" }
  target.data.done["fixture-custom-note-check"] = true
  target.data.done["fixture-another-note-check"] = false
  target.completedAt = "2026-10-13T10:00:00.000Z"
  target.completionSnapshot = { totalTasks: 7, completedTasks: 1, completionPercentage: 14, completedAt: target.completedAt,
    taskResults: target.programacao.activities.map((activity) => ({ ...activity, done: Boolean(target.data.done[activity.id]), countsTowardCompletion: true })) }
  target.aiReview = { verdict: "Fixture old review", summary: "Fixture earlier activities", whatWorked: [], difficulties: [], observedPatterns: [], nextWeekSuggestions: [], generatedAt: target.completedAt, analysisVersion: 1 }
  const before = JSON.stringify(fixture)
  const expectedSections = target.guideSnapshot.sections.map(({ scripture, ...section }) => section)
  for (const pattern of ["rest", "routine", "balance", "focus", "momentum", "active", "blank"]) {
    const setup = { ...clone(target.setup), pattern, spirituality: pattern !== "rest", theology: "other", theologyOther: "Fixture chosen tradition" }
    const revised = weekPlanning.updateWeekSetupInWorkspace(fixture, target.id, setup, "2026-10-14T12:00:00.000Z", "en-US")
    assert.ok(revised, pattern)
    const saved = revised.weeks[0]
    assert.deepEqual(saved.data.text, target.data.text)
    assert.deepEqual(saved.data.done, { "fixture-custom-note-check": true, "fixture-another-note-check": false })
    assert.ok(saved.programacao.activities.every((activity) => !saved.data.done[activity.id]))
    assert.deepEqual(saved.guideSnapshot.sections, expectedSections)
    assert.equal(saved.guideSnapshot.bibleVersion, null)
    assert.equal(saved.guideSnapshot.theologyEnabled, setup.spirituality)
    assert.equal(saved.guideSnapshot.completionConfig.theologyReviewEnabled, setup.spirituality)
    assert.equal(saved.programacao.activities.length, pattern === "blank" ? 0 : 7)
    assert.deepEqual(saved.programacao.activities.map((activity) => activity.dayIndex), pattern === "blank" ? [] : [0, 1, 2, 3, 4, 5, 6])
    assert.ok(saved.programacao.activities.every((activity) => activity.countsTowardCompletion === (pattern !== "rest")))
    assert.deepEqual(saved.progresso, { total: pattern === "rest" || pattern === "blank" ? 0 : 7, concluidas: 0, percentual: 0 })
    assert.equal(saved.startDate, target.startDate)
    assert.equal(saved.endDate, target.endDate)
    assert.equal(saved.completionSnapshot, null, "a reopened Week must not retain an obsolete completion snapshot")
    assert.equal(saved.completedAt, null)
    assert.equal(saved.aiReview, target.aiReview)
    assert.equal(saved.aiReviewOutdated, true)
    assert.equal(revised.guides, fixture.guides)
    assert.equal(revised.weeks[1], fixture.weeks[1])
    assert.equal(revised.activeWeekId, fixture.activeWeekId)
    assert.equal(backup.isValidBackup({ schemaVersion: 4, ...revised }), true)
    assert.equal(JSON.stringify(fixture), before)
  }
  const legacy = clone(fixture)
  legacy.guides[0].sections = clone(target.guideSnapshot.sections)
  delete legacy.weeks[0].guideSnapshot.sections
  const legacyBefore = JSON.stringify(legacy)
  const savedLegacy = weekPlanning.updateWeekSetupInWorkspace(legacy, target.id,
    { ...target.setup, pattern: "rest", spirituality: false }, "2026-10-14T12:00:00.000Z", "en-US")
  assert.ok(savedLegacy)
  assert.deepEqual(savedLegacy.weeks[0].guideSnapshot.sections, expectedSections, "legacy section fallback is captured before disabling scripture")
  assert.equal(JSON.stringify(legacy), legacyBefore)
})

test("saved Week choices reject absent, closed, or invalid targets and malformed workspace without mutation", () => {
  const fixture = plannedWeekFixture()
  const target = fixture.weeks[0]
  const before = JSON.stringify(fixture)
  const stamp = "2026-10-14T12:00:00.000Z"
  assert.equal(weekPlanning.updateWeekSetupInWorkspace(fixture, "fixture-missing-week", target.setup, stamp), null)
  assert.equal(weekPlanning.updateWeekSetupInWorkspace({ ...fixture, weeks: [{ ...target, status: "completed" }, fixture.weeks[1]] }, target.id, target.setup, stamp), null)
  assert.equal(weekPlanning.updateWeekSetupInWorkspace(fixture, target.id, { ...target.setup, burdens: ["worry", "worry"] }, stamp), null)
  assert.equal(weekPlanning.updateWeekSetupInWorkspace(fixture, target.id, { ...target.setup, expectation: "x".repeat(1201) }, stamp), null)
  assert.equal(weekPlanning.updateWeekSetupInWorkspace(fixture, target.id, target.setup, undefined), null)
  assert.equal(weekPlanning.updateWeekSetupInWorkspace(fixture, target.id, target.setup, stamp, "invalid"), null)
  const malformed = clone(fixture); malformed.weeks[1].data.text["fixture-invalid-note"] = 42
  assert.equal(weekPlanning.updateWeekSetupInWorkspace(malformed, target.id, target.setup, stamp), null)
  assert.equal(JSON.stringify(fixture), before)
})

test("Week setup backup validation accepts legacy records and rejects unknown, duplicated, forged, or oversized preferences", () => {
  const fixture = plannedWeekFixture()
  const setup = clone(fixture.weeks[0].setup)
  assert.equal(weekSetup.isValidWeekSetup(setup), true)
  assert.equal(backup.isValidBackup({ schemaVersion: 4, ...fixture }), true)
  const restored = JSON.parse(JSON.stringify({ schemaVersion: 4, ...fixture }))
  assert.deepEqual(restored.weeks[0].setup, setup)
  assert.equal(backup.isValidBackup(restored), true)
  const legacy = clone(fixture); delete legacy.weeks[0].setup
  assert.equal(backup.isValidBackup({ schemaVersion: 4, ...legacy }), true)
  for (const change of [{ pattern: "unsupported" }, { expectation: "x".repeat(1201) }, { name: "x".repeat(101) },
    { burdens: ["worry", "worry"] }, { burdens: ["unsupported"] }, { burdens: "worry" }, { discipline: ["none"] },
    { psychology: "unsupported" }, { theology: "unsupported" }, { spirituality: "true" },
    { burdensOther: "x".repeat(1201) }, { intensity: "high" }, { privateAnswers: "fixture forbidden setup field" }]) {
    const malformed = { ...setup, ...change }
    assert.equal(weekSetup.isValidWeekSetup(malformed), false, JSON.stringify(Object.keys(change)))
    const invalid = clone(fixture); invalid.weeks[0].setup = malformed
    assert.equal(backup.isValidBackup({ schemaVersion: 4, ...invalid }), false)
  }
  const getter = { ...setup }; Object.defineProperty(getter, "expectation", { enumerable: true, get() { throw new Error("fixture getter cannot be read") } })
  assert.equal(weekSetup.isValidWeekSetup(getter), false)
  for (const key of Object.keys(weekSetup.WEEK_SETUP_LIMITS)) {
    assert.equal(weekSetup.isValidWeekSetup({ ...setup, [key]: "x".repeat(weekSetup.WEEK_SETUP_LIMITS[key]) }), true, key)
  }
})

test("only selected Week preferences and active Other fields appear as ordinary local notes", () => {
  assert.equal(weekOptions.selectedWeekPreference("burdens", ["worry"], "Fixture unselected text"), "Worry or overthinking")
  assert.equal(weekOptions.selectedWeekPreference("burdens", ["other"], " Fixture selected text "), "Fixture selected text")
  assert.equal(weekOptions.selectedWeekPreference("psychology", "none", "Fixture unselected psychology"), "")
  assert.equal(weekOptions.selectedWeekPreference("psychology", "other", " Fixture chosen approach "), "Fixture chosen approach")
  assert.equal(weekOptions.selectedWeekPreference("theology", "other", " Fixture chosen tradition ", "pt-BR"), "Fixture chosen tradition")
  assert.equal(weekOptions.selectedSpiritualPreference(false, "christianity", "Fixture inactive tradition"), "")
  assert.equal(weekOptions.selectedSpiritualPreference(true, "none", "Fixture inactive tradition"), "No specific tradition")
  assert.equal(weekOptions.selectedSpiritualPreference(true, "other", ""), "Other (not specified)")
  assert.equal(weekOptions.selectedSpiritualPreference(true, "christianity", "Fixture inactive tradition"), "Christianity")
  assert.equal(weekOptions.selectedSpiritualPreference(true, "other", " Fixture chosen tradition "), "Fixture chosen tradition")
  const fixture = plannedWeekFixture()
  const originalFetch = global.fetch
  global.fetch = () => { throw new Error("fixture local preferences cannot contact providers") }
  try {
    const notes = weekPlanning.weekPreferenceNotes(fixture.weeks[0].setup)
    assert.equal(notes.length, 8)
    assert.ok(notes.every((note) => typeof note.label === "string" && typeof note.text === "string"))
    const text = JSON.stringify(notes)
    assert.ok(text.includes("Fixture chosen burden"))
    assert.ok(text.includes("Fixture chosen routine"))
    assert.ok(text.includes("Humanistic / person-centered"))
    for (const included of ["Fixture Selected Week", "After lunch", "A quiet place", "Late tasks", "Every step is optional"]) assert.ok(text.includes(included))
    for (const omitted of ["Fixture inactive psychology text", "Fixture inactive tradition text", "Fixture daily words"]) assert.equal(text.includes(omitted), false)
    assert.deepEqual(weekPlanning.weekPreferenceNotes({ pattern: "blank", expectation: "", psychology: "none", theology: "none", spirituality: false }), [])
    const explicit = weekPlanning.weekPreferenceNotes({ pattern: "rest", expectation: "", spirituality: true, theology: "other", theologyOther: "Fixture my own tradition" })
    assert.equal(explicit.length, 1)
    assert.equal(explicit[0].text, "Fixture my own tradition")
    assert.deepEqual(weekPlanning.weekPreferenceNotes({ pattern: "rest", expectation: "", spirituality: true, theology: "none", theologyOther: "Fixture inactive tradition" }), [
      { label: "Spiritual preference", text: "No specific tradition" },
    ])
    assert.deepEqual(weekPlanning.weekPreferenceNotes({ pattern: "rest", expectation: "", spirituality: true, theology: "other", theologyOther: "" }), [
      { label: "Spiritual preference", text: "Other (not specified)" },
    ])
  } finally { global.fetch = originalFetch }
})

test("Week navigation crosses every legacy template without mutating their chronological records", () => {
  const fixture = plannedWeekFixture()
  const before = JSON.stringify(fixture)
  const first = fixture.weeks[0], last = fixture.weeks[1]
  const middle = { ...clone(first), id: "fixture-middle-week", guideId: last.guideId, startDate: "2026-10-19", endDate: "2026-10-25" }
  const unordered = [last, first, middle]
  const chosen = weekPlanning.navigationForWeeks(unordered, middle.id)
  assert.equal(chosen.activeWeek, middle)
  assert.equal(chosen.previousWeek, first)
  assert.equal(chosen.nextWeek, last)
  assert.equal(weekPlanning.navigationForWeeks(unordered, first.id).previousWeek, null)
  assert.equal(weekPlanning.navigationForWeeks(unordered, last.id).nextWeek, null)
  assert.equal(weekPlanning.navigationForWeeks(unordered, "fixture-stale-id").activeWeek, first)
  assert.deepEqual(weekPlanning.navigationForWeeks([], null), { activeWeek: null, previousWeek: null, nextWeek: null })
  assert.deepEqual(unordered.map((item) => item.id), [last.id, first.id, middle.id])
  assert.equal(JSON.stringify(fixture), before)
})

test("new Week spirituality requires opt-in and preserves authored notes when inherited scripture is disabled", () => {
  const fixture = plannedWeekFixture()
  const previous = fixture.weeks[0]
  previous.guideSnapshot.theologyEnabled = true
  previous.guideSnapshot.bibleVersion = "KJV"
  previous.guideSnapshot.completionConfig.theologyReviewEnabled = true
  previous.guideSnapshot.sections[0].scripture = { verses: [{ ref: "Fixture reference", ara: "Fixture verse", nvt: "Fixture verse", kjv: "Fixture verse" }], comentario: "Fixture app-authored commentary", oracao: "Fixture app-authored prayer" }
  previous.data.text["fixture-authored-prayer"] = "Fixture personal prayer and scripture notes stay exactly as written."
  const before = JSON.stringify(fixture)
  for (const selection of [{ spirituality: false, theology: "christianity" }, { spirituality: true, theology: "islam" }, {}]) {
    const setup = { pattern: "gentle", expectation: "Fixture chosen expectation", ...selection }
    const next = weekPlanning.createPlannedWeekInWorkspace(fixture, setup, plannedOptions)
    assert.ok(next)
    assert.equal(next.newWeek.guideSnapshot.sections[0].scripture, undefined)
    assert.equal(next.newWeek.guideSnapshot.bibleVersion, null)
    assert.deepEqual(next.newWeek.data.text, previous.data.text)
    assert.equal(next.newWeek.guideSnapshot.theologyEnabled, selection.spirituality === true)
    assert.equal(JSON.stringify(fixture), before)
  }
  const explicit = weekPlanning.createPlannedWeekInWorkspace(fixture, { pattern: "gentle", expectation: "", spirituality: true, theology: "christianity" }, plannedOptions)
  assert.deepEqual(explicit.newWeek.guideSnapshot.sections[0].scripture, previous.guideSnapshot.sections[0].scripture)
  assert.equal(explicit.newWeek.guideSnapshot.bibleVersion, "KJV")
  assert.deepEqual(explicit.newWeek.data.text, previous.data.text)
  assert.equal(JSON.stringify(fixture), before)
})

test("invalid planned Week transitions preserve all records before any identity or date can be applied", () => {
  const fixture = plannedWeekFixture()
  const before = JSON.stringify(fixture)
  const setup = clone(fixture.weeks[0].setup)
  for (const options of [{ ...plannedOptions, startDate: "2026-02-30" }, { ...plannedOptions, title: "x".repeat(501) },
    { ...plannedOptions, id: fixture.weeks[0].id }, { ...plannedOptions, guideId: fixture.guides[0].id },
    { ...plannedOptions, guideId: "__proto__" }]) {
    assert.equal(weekPlanning.createPlannedWeekInWorkspace(fixture, setup, options), null)
    assert.equal(JSON.stringify(fixture), before)
  }
  assert.equal(weekPlanning.createPlannedWeekInWorkspace(fixture, { ...setup, pattern: "unknown" }, plannedOptions), null)
  const explicit = weekPlanning.createPlannedWeekInWorkspace(fixture, setup, { ...plannedOptions, startDate: "2028-02-26", title: "Fixture Explicit Name" })
  assert.equal(explicit.newWeek.startDate, "2028-02-26")
  assert.equal(explicit.newWeek.endDate, "2028-03-03")
  assert.equal(explicit.newWeek.title, "Fixture Explicit Name")
  assert.deepEqual(explicit.newWeek.setup, setup)
  assert.equal(JSON.stringify(fixture), before)
})

test("an empty first-real-Week workspace starts today without inherited results or notes", () => {
  const starter = planner.createStarterGuide()
  const source = { guides: [starter], weeks: [], activeGuideId: starter.id, activeWeekId: null }
  const before = JSON.stringify(source)
  const created = weekPlanning.createPlannedWeekInWorkspace(source, { pattern: "gentle", expectation: "Fixture first real choice" }, plannedOptions)
  assert.ok(created)
  assert.equal(created.weeks.length, 1)
  assert.equal(created.newWeek.startDate, plannedOptions.today)
  assert.equal(created.newWeek.endDate, "2026-10-19")
  assert.equal(created.newWeek.title, "Week 1")
  assert.deepEqual(created.newWeek.data, { text: {}, done: {} })
  assert.equal(created.newWeek.completedAt, null)
  assert.equal(created.newWeek.completionSnapshot, null)
  assert.equal(created.newWeek.aiReview, null)
  assert.equal(created.guides[0], starter)
  assert.equal(JSON.stringify(source), before)
  assert.equal(backup.isValidBackup({ schemaVersion: 4, ...created }), true)
})
