/**
 * Multi-Browser Concurrency, Real-Time Debounce & Sync Engine Test Suite
 * 
 * Tests:
 * 1. Debounced Cloud Writes (Keystrokes do NOT fire 1 request per key).
 * 2. Save Status Transitions (idle -> saving -> saved / error / offline).
 * 3. Two-Browser Concurrency & Stale Overwrite Prevention:
 *    - Browser A updates Week 1 at T=100
 *    - Browser B updates Week 1 at T=200
 *    - State reconciliation adopts newer edit (T=200) without stale regression.
 * 4. Multi-Guide Independence:
 *    - Browser A creates Week in Guide 1
 *    - Browser B creates Week in Guide 2
 *    - State reconciliation merges both without losing either.
 * 5. Locale Invariant:
 *    - Browser B switches UI locale to 'en-US'
 *    - GuideTemplate authored in 'pt-BR' retains contentLocale: 'pt-BR'
 *    - User free text in Portuguese is NOT auto-translated.
 * 6. Offline Mode & Recovery Queue:
 *    - Network offline -> status 'offline'
 *    - Reconnect -> flushes pending sync -> status 'saved'.
 */

class MockCloudProvider {
  constructor() {
    this.storage = new Map()
    this.writeCallsCount = 0
    this.readCallsCount = 0
  }

  async fetchUserData(userId) {
    this.readCallsCount++
    return this.storage.get(userId) || null
  }

  async saveUserData(userId, payload) {
    this.writeCallsCount++
    this.storage.set(userId, JSON.parse(JSON.stringify(payload)))
  }
}

// Minimal Sync Engine implementation for Node.js test simulation
class NodeSyncEngine {
  constructor(cloudProvider) {
    this.cloudProvider = cloudProvider
    this.status = "idle"
    this.listeners = new Set()
    this.debounceTimer = null
    this.pendingPayload = null
    this.currentUserId = "user_test_concurrency"
    this.isOnline = true
    this.writeAttempts = 0
  }

  subscribe(listener) {
    this.listeners.add(listener)
    listener(this.status)
    return () => this.listeners.delete(listener)
  }

  notify(status) {
    this.status = status
    this.listeners.forEach(fn => fn(status))
  }

  scheduleSync(payload, onLocalPersist) {
    const fullPayload = {
      ...payload,
      userId: this.currentUserId,
      updatedAt: new Date().toISOString()
    }
    this.pendingPayload = fullPayload
    onLocalPersist?.(fullPayload)

    if (!this.isOnline) {
      this.notify("offline")
      return
    }

    this.notify("saving")
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      this.flush()
    }, 60) // Fast debounce in test
  }

  async flush() {
    if (!this.pendingPayload) {
      this.notify("saved")
      return
    }
    if (!this.isOnline) {
      this.notify("offline")
      return
    }
    this.writeAttempts++
    await this.cloudProvider.saveUserData(this.currentUserId, this.pendingPayload)
    this.pendingPayload = null
    this.notify("saved")
  }

  static reconcileStates(local, remote) {
    // Merge Guides by ID with timestamp / version comparison
    const guideMap = new Map()
    remote.guides.forEach(rg => guideMap.set(rg.id, rg))
    local.guides.forEach(lg => {
      const existing = guideMap.get(lg.id)
      if (!existing) {
        guideMap.set(lg.id, lg)
      } else {
        const winning = (lg.version || 1) >= (existing.version || 1) ? lg : existing
        guideMap.set(lg.id, {
          ...winning,
          contentLocale: winning.contentLocale || existing.contentLocale || "pt-BR",
        })
      }
    })

    // Merge Weeks by ID with timestamp comparison
    const weekMap = new Map()
    remote.weeks.forEach(rw => weekMap.set(rw.id, rw))
    local.weeks.forEach(lw => {
      const existing = weekMap.get(lw.id)
      if (!existing) {
        weekMap.set(lw.id, lw)
      } else {
        const localTime = new Date(lw.updatedAt || lw.createdAt || 0).getTime()
        const remoteTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime()
        if (localTime >= remoteTime) {
          weekMap.set(lw.id, lw)
        } else {
          weekMap.set(lw.id, existing)
        }
      }
    })

    const newerOverall = new Date(local.updatedAt).getTime() >= new Date(remote.updatedAt).getTime()

    return {
      schemaVersion: 4,
      userId: local.userId || remote.userId,
      guides: Array.from(guideMap.values()),
      activeGuideId: newerOverall ? local.activeGuideId : remote.activeGuideId,
      weeks: Array.from(weekMap.values()),
      activeWeekId: newerOverall ? local.activeWeekId : remote.activeWeekId,
      settings: newerOverall ? local.settings : remote.settings,
      updatedAt: newerOverall ? local.updatedAt : remote.updatedAt,
    }
  }
}

async function runTests() {
  console.log("==================================================")
  console.log("MULTI-BROWSER CONCURRENCY & DEBOUNCE TEST SUITE")
  console.log("==================================================\n")

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

  const cloud = new MockCloudProvider()

  // ── TEST 1: Debounce Test ──
  console.log("1. Testing Keystroke Debouncing (No write on every key)...")
  const engineA = new NodeSyncEngine(cloud)
  let localPersistCount = 0

  // Simulate fast typing of 10 keystrokes
  for (let i = 1; i <= 10; i++) {
    engineA.scheduleSync(
      {
        schemaVersion: 4,
        guides: [{ id: "g1", title: "Guia 1", contentLocale: "pt-BR" }],
        activeGuideId: "g1",
        weeks: [
          {
            id: "w1",
            guideId: "g1",
            title: "Semana 1",
            startDate: "2026-08-10",
            endDate: "2026-08-16",
            data: { text: { "q1": `Typing char ${i}` }, done: {} },
            updatedAt: new Date().toISOString()
          }
        ],
        activeWeekId: "w1",
        settings: { theme: "light", palette: "sage", locale: "pt-BR", bibleVersion: "ARA" }
      },
      () => {
        localPersistCount++
      }
    )
  }

  assert("Initial status switched to 'saving'", engineA.status === "saving")
  assert("Local cache received calls", localPersistCount === 10)
  assert("Remote write not fired immediately (calls = 0)", cloud.writeCallsCount === 0)

  // Wait for debounce timer to fire
  await new Promise(resolve => setTimeout(resolve, 100))

  assert("Only 1 remote write executed after debounce", cloud.writeCallsCount === 1)
  assert("Status switched to 'saved'", engineA.status === "saved")

  // ── TEST 2: Two-Browser Concurrency (Browser A vs Browser B) ──
  console.log("\n2. Testing Multi-Browser Concurrency & Stale Overwrite Prevention...")
  
  // Browser A state at T=100
  const stateBrowserA = {
    schemaVersion: 4,
    userId: "user_test_concurrency",
    guides: [{ id: "g1", title: "Guia Original", version: 1, contentLocale: "pt-BR" }],
    activeGuideId: "g1",
    weeks: [
      {
        id: "w1",
        guideId: "g1",
        title: "Semana 1",
        startDate: "2026-08-10",
        endDate: "2026-08-16",
        data: { text: { "q1": "Resposta escrita no Navegador A" }, done: {} },
        updatedAt: "2026-08-14T10:00:00.000Z"
      }
    ],
    activeWeekId: "w1",
    settings: { theme: "light", palette: "sage", locale: "pt-BR", bibleVersion: "ARA" },
    updatedAt: "2026-08-14T10:00:00.000Z"
  }

  // Browser B writes at T=200 (newer)
  const stateBrowserB = {
    schemaVersion: 4,
    userId: "user_test_concurrency",
    guides: [{ id: "g1", title: "Guia Original", version: 1, contentLocale: "pt-BR" }],
    activeGuideId: "g1",
    weeks: [
      {
        id: "w1",
        guideId: "g1",
        title: "Semana 1",
        startDate: "2026-08-10",
        endDate: "2026-08-16",
        data: { text: { "q1": "Resposta MAIS RECENTE escrita no Navegador B" }, done: { "act-1": true } },
        updatedAt: "2026-08-14T10:05:00.000Z" // +5 minutes newer
      }
    ],
    activeWeekId: "w1",
    settings: { theme: "dark", palette: "terracotta", locale: "en-US", bibleVersion: "KJV" },
    updatedAt: "2026-08-14T10:05:00.000Z"
  }

  // Reconcile: Browser A receiving updates from Browser B
  const reconciled = NodeSyncEngine.reconcileStates(stateBrowserA, stateBrowserB)

  assert("Newer answer from Browser B preserved", 
    reconciled.weeks[0].data.text["q1"] === "Resposta MAIS RECENTE escrita no Navegador B")
  assert("Task completion from Browser B preserved", 
    reconciled.weeks[0].data.done["act-1"] === true)

  // ── TEST 3: Multi-Guide & Cross-Creation Merge ──
  console.log("\n3. Testing Concurrent Guide and Week Creation Across Browsers...")
  const stateA_NewGuide = {
    ...stateBrowserA,
    guides: [
      ...stateBrowserA.guides,
      { id: "guide_from_A", title: "Guia Criado no Browser A", version: 1, contentLocale: "pt-BR" }
    ],
    weeks: [
      ...stateBrowserA.weeks,
      { id: "week_from_A", guideId: "guide_from_A", title: "Semana A", startDate: "2026-08-17", endDate: "2026-08-23", updatedAt: "2026-08-14T10:02:00.000Z" }
    ],
    updatedAt: "2026-08-14T10:02:00.000Z"
  }

  const stateB_NewGuide = {
    ...stateBrowserB,
    guides: [
      ...stateBrowserB.guides,
      { id: "guide_from_B", title: "Guia Criado no Browser B", version: 1, contentLocale: "en-US" }
    ],
    weeks: [
      ...stateBrowserB.weeks,
      { id: "week_from_B", guideId: "guide_from_B", title: "Week B", startDate: "2026-08-17", endDate: "2026-08-23", updatedAt: "2026-08-14T10:06:00.000Z" }
    ],
    updatedAt: "2026-08-14T10:06:00.000Z"
  }

  const multiMerged = NodeSyncEngine.reconcileStates(stateA_NewGuide, stateB_NewGuide)

  assert("Guides from both browsers present (3 total)", multiMerged.guides.length === 3)
  assert("Weeks from both browsers present (3 total)", multiMerged.weeks.length === 3)
  
  // ── TEST 4: Locale Invariant Preservation ──
  console.log("\n4. Testing Locale & Content Invariant Across Devices...")
  const guideA = multiMerged.guides.find(g => g.id === "guide_from_A")
  const guideB = multiMerged.guides.find(g => g.id === "guide_from_B")

  assert("Guide from A retains contentLocale: 'pt-BR'", guideA.contentLocale === "pt-BR")
  assert("Guide from B retains contentLocale: 'en-US'", guideB.contentLocale === "en-US")
  assert("User free text in Portuguese is NOT translated", 
    multiMerged.weeks.find(w => w.id === "w1").data.text["q1"].includes("Navegador B"))

  // ── TEST 5: Offline Mode and Recovery ──
  console.log("\n5. Testing Offline Mode & Recovery Queue...")
  const engineOffline = new NodeSyncEngine(cloud)
  engineOffline.isOnline = false

  engineOffline.scheduleSync({
    schemaVersion: 4,
    guides: [],
    activeGuideId: "g1",
    weeks: [],
    activeWeekId: null,
    settings: { theme: "light", palette: "sage", locale: "pt-BR", bibleVersion: "ARA" }
  })

  assert("Offline status detected", engineOffline.status === "offline")
  assert("Pending payload retained while offline", engineOffline.pendingPayload !== null)

  // Reconnect
  engineOffline.isOnline = true
  await engineOffline.flush()

  assert("Status switches to 'saved' upon reconnection flush", engineOffline.status === "saved")
  assert("Pending payload cleared after flush", engineOffline.pendingPayload === null)

  console.log("\n--------------------------------------------------")
  console.log(`Total tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`)
  console.log("--------------------------------------------------\n")

  if (failed > 0) {
    process.exit(1)
  }

  console.log("🎯 ALL CONCURRENCY, DEBOUNCE & MULTI-BROWSER TESTS PASSED!")
}

runTests()
