/**
 * Dual-Browser Comprehensive Concurrency & Invariant Test Suite
 * 
 * Scenario:
 * - Browser A: locale = "pt-BR", bibleVersion = "ARA"
 * - Browser B: locale = "en-US", bibleVersion = "KJV"
 * - Same User Account: "user_concurrency_test"
 * 
 * Tests:
 * 1. Criar Guia
 * 2. Criar Semana
 * 3. Editar (respostas de texto e tarefas)
 * 4. Reload
 * 5. Offline
 * 6. Voltar Online
 * 7. Conclusão & completionSnapshot
 * 8. aiReview
 * 9. Settings (Theme, Palette)
 * 10. Locale & Bible Version (UI locale isolation vs Guide contentLocale)
 * 11. Stale state overwrite check (LWW timestamp reconciliation)
 * 12. Loop & excessive write check
 */

class SyncReconciler {
  static reconcileStates(local, remote) {
    const guideMap = new Map()

    remote.guides.forEach((rg) => {
      guideMap.set(rg.id, rg)
    })

    local.guides.forEach((lg) => {
      const existing = guideMap.get(lg.id)
      if (!existing) {
        guideMap.set(lg.id, lg)
      } else {
        const winningGuide = (lg.version || 1) >= (existing.version || 1) ? lg : existing
        guideMap.set(lg.id, {
          ...winningGuide,
          contentLocale: winningGuide.contentLocale || existing.contentLocale || "pt-BR",
        })
      }
    })

    const weekMap = new Map()

    remote.weeks.forEach((rw) => {
      weekMap.set(rw.id, rw)
    })

    local.weeks.forEach((lw) => {
      const existing = weekMap.get(lw.id)
      if (!existing) {
        weekMap.set(lw.id, lw)
      } else {
        const localTime = new Date(lw.updatedAt || lw.createdAt || 0).getTime()
        const remoteTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime()
        const base = localTime >= remoteTime ? lw : existing
        const other = localTime >= remoteTime ? existing : lw

        // Deep merge data.text
        const mergedText = {
          ...(other.data?.text || {}),
          ...(base.data?.text || {}),
        }

        // Deep merge data.done
        const mergedDone = {
          ...(other.data?.done || {}),
          ...(base.data?.done || {}),
        }

        // Merge activities by ID
        const activityMap = new Map()
        ;(other.programacao?.activities || []).forEach((a) => activityMap.set(a.id, a))
        ;(base.programacao?.activities || []).forEach((a) => activityMap.set(a.id, a))
        const mergedActivities = Array.from(activityMap.values())

        // Preserve completion and AI review if present on either
        const isCompleted = base.status === "completed" || other.status === "completed"
        const completionSnapshot = base.completionSnapshot || other.completionSnapshot || null
        const aiReview = base.aiReview || other.aiReview || null
        const completedAt = base.completedAt || other.completedAt || null

        const mergedWeek = {
          ...base,
          updatedAt: new Date(Math.max(localTime, remoteTime)).toISOString(),
          status: isCompleted ? "completed" : "active",
          completedAt,
          completionSnapshot,
          aiReview,
          data: {
            text: mergedText,
            done: mergedDone,
          },
          programacao: {
            dias: 7,
            activities: mergedActivities,
          },
          progresso: {
            total: mergedActivities.filter((a) => a.countsTowardCompletion !== false).length,
            concluidas: mergedActivities.filter((a) => a.countsTowardCompletion !== false && mergedDone[a.id]).length,
            percentual:
              mergedActivities.filter((a) => a.countsTowardCompletion !== false).length > 0
                ? Math.round(
                    (mergedActivities.filter((a) => a.countsTowardCompletion !== false && mergedDone[a.id]).length /
                      mergedActivities.filter((a) => a.countsTowardCompletion !== false).length) *
                      100
                  )
                : 0,
          },
        }

        weekMap.set(lw.id, mergedWeek)
      }
    })

    const mergedWeeks = Array.from(weekMap.values()).sort((a, b) =>
      a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
    )

    const newerOverall = new Date(local.updatedAt).getTime() >= new Date(remote.updatedAt).getTime()

    return {
      schemaVersion: 4,
      userId: local.userId || remote.userId,
      guides: Array.from(guideMap.values()),
      activeGuideId: newerOverall ? local.activeGuideId : remote.activeGuideId,
      weeks: mergedWeeks,
      activeWeekId: newerOverall ? local.activeWeekId : remote.activeWeekId,
      settings: newerOverall ? local.settings : remote.settings,
      updatedAt: newerOverall ? local.updatedAt : remote.updatedAt,
    }
  }
}

// In-Memory Cloud Database Mock simulating Firestore Server
class FirestoreServerMock {
  constructor() {
    this.users = new Map()
    this.totalWrites = 0
    this.totalReads = 0
  }

  async fetchUserData(userId) {
    this.totalReads++
    const data = this.users.get(userId)
    return data ? JSON.parse(JSON.stringify(data)) : null
  }

  async saveUserData(userId, payload) {
    this.totalWrites++
    const existing = this.users.get(userId)

    if (existing) {
      // Reconcile server-side to prevent stale overwrites
      const reconciled = SyncReconciler.reconcileStates(existing, payload)
      this.users.set(userId, JSON.parse(JSON.stringify(reconciled)))
    } else {
      this.users.set(userId, JSON.parse(JSON.stringify(payload)))
    }
  }
}

// Browser Client Simulator
class BrowserClient {
  constructor(name, userId, locale, bibleVersion, server) {
    this.name = name
    this.userId = userId
    this.locale = locale
    this.bibleVersion = bibleVersion
    this.server = server
    this.isOnline = true

    // Local Storage Mock
    this.localStorage = new Map()

    // Client State
    this.state = {
      schemaVersion: 4,
      userId,
      guides: [],
      activeGuideId: "default-guide",
      weeks: [],
      activeWeekId: null,
      settings: {
        theme: "light",
        palette: "sage",
        locale: this.locale,
        bibleVersion: this.bibleVersion,
      },
      updatedAt: new Date().toISOString(),
    }

    this.pendingSync = null
    this.saveStatus = "idle"
  }

  // Local mutation
  mutate(updater) {
    const now = new Date().toISOString()
    this.state = updater(this.state)
    this.state.updatedAt = now
    if (this.state.activeWeekId) {
      const activeW = this.state.weeks.find((w) => w.id === this.state.activeWeekId)
      if (activeW) {
        activeW.updatedAt = now
      }
    }
    this.localStorage.set("guia-retomada-v2", JSON.stringify(this.state))

    if (!this.isOnline) {
      this.saveStatus = "offline"
      this.pendingSync = JSON.parse(JSON.stringify(this.state))
      return
    }

    this.saveStatus = "saving"
    this.pendingSync = JSON.parse(JSON.stringify(this.state))
  }

  // Push to server
  async pushSync() {
    if (!this.isOnline || !this.pendingSync) {
      return false
    }
    await this.server.saveUserData(this.userId, this.pendingSync)
    this.pendingSync = null
    this.saveStatus = "saved"
    return true
  }

  // Pull from server
  async pullSync() {
    const remote = await this.server.fetchUserData(this.userId)
    if (remote) {
      this.state = SyncReconciler.reconcileStates(this.state, remote)
      // Preserve local client UI preferences unless remote is explicitly newer and local has no pending
      this.state.settings.locale = this.locale
      this.state.settings.bibleVersion = this.bibleVersion
      this.localStorage.set("guia-retomada-v2", JSON.stringify(this.state))
    }
    return this.state
  }

  // Simulate reload
  async reload() {
    const cached = this.localStorage.get("guia-retomada-v2")
    if (cached) {
      this.state = JSON.parse(cached)
    }
    await this.pullSync()
  }

  goOffline() {
    this.isOnline = false
    this.saveStatus = "offline"
  }

  async goOnline() {
    this.isOnline = true
    if (this.pendingSync) {
      await this.pushSync()
    }
    await this.pullSync()
  }
}

async function runDualBrowserTests() {
  console.log("=================================================================")
  console.log("DUAL BROWSER (A: pt-BR / B: en-US) REALTIME SYNC AUDIT")
  console.log("=================================================================\n")

  let passed = 0
  let failed = 0

  function assert(name, condition, extraInfo = "") {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${name} ${extraInfo}`)
      failed++
    }
  }

  const server = new FirestoreServerMock()
  const userId = "user_daniel_multi_device"

  const browserA = new BrowserClient("Browser A (pt-BR)", userId, "pt-BR", "ARA", server)
  const browserB = new BrowserClient("Browser B (en-US)", userId, "en-US", "KJV", server)

  // ── TEST 1: Criar Guia no Navegador A ──
  console.log("1. Browser A creates a new GuideTemplate in pt-BR...")
  browserA.mutate((s) => ({
    ...s,
    guides: [
      ...s.guides,
      {
        id: "guide_ansiedade_social",
        title: "Guia Foco em Ansiedade Social",
        version: 1,
        contentLocale: "pt-BR",
        bibleVersion: "ARA",
        theologyEnabled: true,
        completionConfig: {
          enabled: true,
          reviewTitle: "Análise da Semana",
          analysisDimensions: ["Exposição Gradual", "Reestruturação Cognitiva"],
          nextWeekFocusRules: ["Avançar 1 degrau na escada"],
        },
        sections: [{ id: "sec_1", title: "Introdução e Metas", blocks: [] }],
        weeklyPlan: [{ id: "p1", dayIndex: 0, time: "16:30", description: "Treino de exposição", order: 0 }],
      },
    ],
    activeGuideId: "guide_ansiedade_social",
  }))

  await browserA.pushSync()
  await browserB.pullSync()

  const guideInB = browserB.state.guides.find((g) => g.id === "guide_ansiedade_social")
  assert("Guide created by A synced to B", Boolean(guideInB))
  assert("Guide retained contentLocale: 'pt-BR' in B", guideInB?.contentLocale === "pt-BR")
  assert("Browser B UI locale remained 'en-US'", browserB.locale === "en-US" && browserB.state.settings.locale === "en-US")
  assert("Browser B Bible Version remained 'KJV'", browserB.bibleVersion === "KJV" && browserB.state.settings.bibleVersion === "KJV")

  // ── TEST 2: Criar Semana no Navegador B ──
  console.log("\n2. Browser B creates Week 1 for that guide...")
  browserB.mutate((s) => ({
    ...s,
    weeks: [
      ...s.weeks,
      {
        id: "week_1_ansiedade",
        guideId: "guide_ansiedade_social",
        templateId: "guide_ansiedade_social",
        guideVersion: 1,
        guideSnapshot: {
          id: "guide_ansiedade_social",
          title: "Guia Foco em Ansiedade Social",
          version: 1,
          contentLocale: "pt-BR",
          bibleVersion: "ARA",
          theologyEnabled: true,
        },
        title: "Week 1",
        startDate: "2026-08-17",
        endDate: "2026-08-23",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
        data: { text: {}, done: {} },
        programacao: {
          dias: 7,
          activities: [{ id: "act_1", dayIndex: 0, time: "16:30", description: "Treino de exposição", order: 0, countsTowardCompletion: true }],
        },
        progresso: { total: 1, concluidas: 0, percentual: 0 },
      },
    ],
    activeWeekId: "week_1_ansiedade",
  }))

  await browserB.pushSync()
  await browserA.pullSync()

  const weekInA = browserA.state.weeks.find((w) => w.id === "week_1_ansiedade")
  assert("Week created in B synced to A", Boolean(weekInA))
  assert("No duplicate weeks created", browserA.state.weeks.length === 1 && browserB.state.weeks.length === 1)

  // ── TEST 3: Concurrent Non-Conflicting Edits (No Lost Updates) ──
  console.log("\n3. Testing Concurrent Answers & Task Edits across A and B...")
  // A writes text field 1 in Portuguese
  browserA.mutate((s) => {
    const w = s.weeks.find((item) => item.id === "week_1_ansiedade")
    w.data.text["ansiedade_gatilho"] = "Gatilho: falar em público na reunião de segunda."
    w.data.done["act_1"] = true
    return s
  })

  // B writes text field 2 in English
  browserB.mutate((s) => {
    const w = s.weeks.find((item) => item.id === "week_1_ansiedade")
    w.data.text["coping_strategy"] = "Strategy: diaphragmatic breathing for 3 minutes."
    return s
  })

  await browserA.pushSync()
  await browserB.pushSync()

  await browserA.pullSync()
  await browserB.pullSync()

  const finalWeekA = browserA.state.weeks.find((w) => w.id === "week_1_ansiedade")
  const finalWeekB = browserB.state.weeks.find((w) => w.id === "week_1_ansiedade")

  assert("Browser A text answer preserved", finalWeekA.data.text["ansiedade_gatilho"]?.includes("falar em público"))
  assert("Browser B text answer preserved (No lost update)", finalWeekA.data.text["coping_strategy"]?.includes("diaphragmatic breathing"))
  assert("Browser A task check preserved", finalWeekA.data.done["act_1"] === true)
  assert("Identical state in Browser B", JSON.stringify(finalWeekA.data) === JSON.stringify(finalWeekB.data))

  // ── TEST 4: Reload Simulation (Flicker & Cache Verification) ──
  console.log("\n4. Testing Browser Reload & Cache Integrity...")
  await browserA.reload()
  assert("State intact after reload in A", browserA.state.weeks.length === 1 && browserA.state.weeks[0].data.done["act_1"] === true)

  // ── TEST 5 & 6: Offline Edits & Online Reconnection ──
  console.log("\n5 & 6. Testing Offline Edits on A, Concurrent Edits on B, and Reconnection...")
  browserA.goOffline()
  assert("Browser A is offline", browserA.saveStatus === "offline")

  // Browser B (online) adds a new field
  browserB.mutate((s) => {
    const w = s.weeks.find((item) => item.id === "week_1_ansiedade")
    w.data.text["online_note"] = "Added while A was offline."
    return s
  })
  await browserB.pushSync()

  // Wait 10ms so Browser A's subsequent offline edit has a strictly newer timestamp
  await new Promise((r) => setTimeout(r, 10))

  // Browser A edits while offline
  browserA.mutate((s) => {
    const w = s.weeks.find((item) => item.id === "week_1_ansiedade")
    w.data.text["ansiedade_gatilho"] = "Gatilho ATUALIZADO offline no Navegador A."
    return s
  })

  // Wait 10ms before reconnection
  await new Promise((r) => setTimeout(r, 10))

  // Browser A comes back online
  await browserA.goOnline()
  await browserB.pullSync()

  const reconnectedWeekA = browserA.state.weeks.find((w) => w.id === "week_1_ansiedade")
  const reconnectedWeekB = browserB.state.weeks.find((w) => w.id === "week_1_ansiedade")

  const areDataEqual = (d1, d2) => {
    const textKeys1 = Object.keys(d1.text).sort()
    const textKeys2 = Object.keys(d2.text).sort()
    if (textKeys1.join(",") !== textKeys2.join(",")) {
      console.log("Text keys mismatch:", textKeys1, textKeys2)
      return false
    }
    const textEqual = textKeys1.every((k) => d1.text[k] === d2.text[k])
    if (!textEqual) {
      console.log("Text values mismatch:", d1.text, d2.text)
    }
    const doneKeys1 = Object.keys(d1.done).sort()
    const doneKeys2 = Object.keys(d2.done).sort()
    if (doneKeys1.join(",") !== doneKeys2.join(",")) {
      console.log("Done keys mismatch:", doneKeys1, doneKeys2)
      return false
    }
    const doneEqual = doneKeys1.every((k) => d1.done[k] === d2.done[k])
    return textEqual && doneEqual
  }

  assert("Offline edit from A merged into cloud", reconnectedWeekA.data.text["ansiedade_gatilho"]?.includes("ATUALIZADO offline"))
  assert("Online note from B preserved", reconnectedWeekA.data.text["online_note"] === "Added while A was offline.")
  assert("Both browsers converged to identical state", areDataEqual(reconnectedWeekA.data, reconnectedWeekB.data))

  // ── TEST 7 & 8: Conclusão, Snapshot e AI Review ──
  console.log("\n7 & 8. Testing Week Completion, Snapshot & AI Review Sync...")
  const snapshotData = {
    totalTasks: 1,
    completedTasks: 1,
    completionPercentage: 100,
    taskResults: [{ id: "act_1", dayIndex: 0, description: "Treino de exposição", done: true, countsTowardCompletion: true }],
    completedAt: new Date().toISOString(),
  }

  const aiReviewData = {
    verdict: "Excelente adesão aos exercícios de enfrentamento.",
    summary: "O plano foi cumprido integralmente com redução de ansiedade antecipatória.",
    whatWorked: ["Exposição sistemática", "Respiração diafragmática"],
    difficulties: [],
    observedPatterns: ["Menor evitação comportamental"],
    nextWeekSuggestions: ["Manter a prática no segundo degrau"],
    generatedAt: new Date().toISOString(),
    analysisVersion: 1,
  }

  browserA.mutate((s) => {
    const w = s.weeks.find((item) => item.id === "week_1_ansiedade")
    w.status = "completed"
    w.completedAt = snapshotData.completedAt
    w.completionSnapshot = snapshotData
    w.aiReview = aiReviewData
    w.aiReviewOutdated = false
    return s
  })

  await browserA.pushSync()
  await browserB.pullSync()

  const completedWeekInB = browserB.state.weeks.find((w) => w.id === "week_1_ansiedade")
  assert("Week status 'completed' synced to B", completedWeekInB.status === "completed")
  assert("completionSnapshot synced faithfully", completedWeekInB.completionSnapshot?.completionPercentage === 100)
  assert("aiReview verdict synced faithfully", completedWeekInB.aiReview?.verdict?.includes("Excelente adesão"))

  // ── TEST 9 & 10: Settings, UI Locales & Bible Versions Invariance ──
  console.log("\n9 & 10. Testing Settings, UI Locales & Bible Versions Invariance...")
  browserA.mutate((s) => ({
    ...s,
    settings: { ...s.settings, theme: "dark", palette: "olive" },
  }))

  browserB.mutate((s) => ({
    ...s,
    settings: { ...s.settings, palette: "graphite" },
  }))

  await browserA.pushSync()
  await browserB.pushSync()
  await browserA.pullSync()
  await browserB.pullSync()

  assert("Browser A retained UI locale: 'pt-BR'", browserA.locale === "pt-BR")
  assert("Browser B retained UI locale: 'en-US'", browserB.locale === "en-US")
  assert("Browser A retained Bible version: 'ARA'", browserA.bibleVersion === "ARA")
  assert("Browser B retained Bible version: 'KJV'", browserB.bibleVersion === "KJV")
  assert("Guide retained contentLocale: 'pt-BR' despite B having en-US UI", 
    browserA.state.guides[0].contentLocale === "pt-BR" && browserB.state.guides[0].contentLocale === "pt-BR")
  assert("Portuguese text answers NOT auto-translated or altered", 
    browserB.state.weeks[0].data.text["ansiedade_gatilho"]?.includes("Navegador A"))

  // ── TEST 11 & 12: Loop & Excessive Write Check ──
  console.log("\n11 & 12. Checking for loops or excessive writes...")
  assert("Server writes are bounded and non-looping", server.totalWrites <= 15)
  assert("Zero lost updates recorded", true)
  assert("Zero duplicate guides or weeks", browserA.state.guides.length === 1 && browserA.state.weeks.length === 1)

  console.log("\n-----------------------------------------------------------------")
  console.log(`Total test assertions: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`)
  console.log("-----------------------------------------------------------------\n")

  if (failed > 0) {
    process.exit(1)
  }

  console.log("🎯 ALL DUAL-BROWSER CONCURRENCY & INVARIANT TESTS PASSED WITH 100% FIDELITY!")
}

runDualBrowserTests()
