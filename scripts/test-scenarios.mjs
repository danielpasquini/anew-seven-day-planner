import fs from 'fs'

async function testSingleScenario(name, payload, checks) {
  console.log(`\n========================================`)
  console.log(`TESTANDO: ${name}`)
  console.log(`========================================`)
  const start = Date.now()
  const res = await fetch("http://127.0.0.1:3000/api/generate-guide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`HTTP Status: ${res.status} (em ${elapsed}s)`)

  if (!res.ok) {
    const err = await res.text()
    console.error("Erro retornado:", err)
    return false
  }

  const json = await res.json()
  const guide = json.guideTemplate

  console.log(`- Guide ID: ${guide.id}`)
  console.log(`- Title: "${guide.title}"`)
  console.log(`- contentLocale: "${guide.contentLocale}"`)
  console.log(`- theologyEnabled: ${guide.theologyEnabled}`)
  console.log(`- bibleVersion: ${guide.bibleVersion}`)
  console.log(`- Sections: ${guide.sections?.length}`)
  console.log(`- Weekly Plan Tasks: ${guide.weeklyPlan?.length}`)
  console.log(`- QuickSheets: ${guide.quickSheets?.length}`)

  // Save progress to file
  const resultsFile = "scripts/test-results.json"
  let existing = []
  try {
    if (fs.existsSync(resultsFile)) {
      existing = JSON.parse(fs.readFileSync(resultsFile, "utf8"))
    }
  } catch {}
  existing.push({ name, status: "SUCCESS", elapsed, guideId: guide.id, title: guide.title, contentLocale: guide.contentLocale, theologyEnabled: guide.theologyEnabled, bibleVersion: guide.bibleVersion, sectionsCount: guide.sections?.length })
  fs.writeFileSync(resultsFile, JSON.stringify(existing, null, 2), "utf8")

  // Run custom assertions
  checks(guide)
  console.log(`✅ ${name} PASSOU!`)
  return true
}

async function main() {
  let passed = 0
  let failed = 0

  // 1. pt-BR + theology=false
  try {
    const ok = await testSingleScenario(
      "1. pt-BR + theology=false",
      {
        name: "Guia Foco e Ação",
        focus: "Superar paralisia e iniciar projetos",
        schemas: "Autocontrole Insuficiente, Fracasso",
        currentDifficulties: "Procrastinação crônica",
        theologyCosmovision: "",
        contentLocale: "pt-BR",
      },
      (g) => {
        if (g.contentLocale !== "pt-BR") throw new Error("contentLocale mismatch")
        if (g.theologyEnabled !== false) throw new Error("theologyEnabled should be false")
        if (g.bibleVersion !== null) throw new Error("bibleVersion should be null")
        const hasScripture = g.sections.some((s) => s.scripture)
        if (hasScripture) throw new Error("Found scripture block in theology=false guide")
      }
    )
    ok ? passed++ : failed++
  } catch (e) {
    console.error("FALHA 1:", e.message)
    failed++
  }

  // 2. pt-BR + theology=true
  try {
    const ok = await testSingleScenario(
      "2. pt-BR + theology=true (ARA)",
      {
        name: "Guia Esperança e Renovação",
        focus: "Trabalhar desconfiança e restaurar vínculos com fé",
        schemas: "Desconfiança / Abuso, Isolamento Social",
        currentDifficulties: "Medo de se aproximar",
        theologyCosmovision: "Cristã Reformada",
        contentLocale: "pt-BR",
        bibleVersion: "ARA",
      },
      (g) => {
        if (g.contentLocale !== "pt-BR") throw new Error("contentLocale mismatch")
        if (g.theologyEnabled !== true) throw new Error("theologyEnabled should be true")
        if (g.bibleVersion !== "ARA") throw new Error("bibleVersion should be ARA")
        if (!g.intro?.salmo?.ref) throw new Error("Intro psalm should be resolved")
      }
    )
    ok ? passed++ : failed++
  } catch (e) {
    console.error("FALHA 2:", e.message)
    failed++
  }

  // 3. en-US + theology=false
  try {
    const ok = await testSingleScenario(
      "3. en-US + theology=false",
      {
        name: "Executive Restoration Guide",
        focus: "Overcoming burnout and punitive perfectionism",
        schemas: "Punitiveness / Punitive Critic, Defectiveness / Shame",
        currentDifficulties: "Severe self-judgment after meetings",
        theologyCosmovision: "",
        contentLocale: "en-US",
      },
      (g) => {
        if (g.contentLocale !== "en-US") throw new Error("contentLocale mismatch")
        if (g.theologyEnabled !== false) throw new Error("theologyEnabled should be false")
        if (g.bibleVersion !== null) throw new Error("bibleVersion should be null")
        const hasScripture = g.sections.some((s) => s.scripture)
        if (hasScripture) throw new Error("Found scripture block in theology=false guide")
      }
    )
    ok ? passed++ : failed++
  } catch (e) {
    console.error("FALHA 3:", e.message)
    failed++
  }

  // 4. en-US + KJV
  try {
    const ok = await testSingleScenario(
      "4. en-US + KJV",
      {
        name: "Restoration and Hope in God",
        focus: "Healing relational wounds and establishing daily faithfulness",
        schemas: "Mistrust / Abuse, Social Isolation / Alienation",
        currentDifficulties: "Difficulty opening up and chronic vigilance",
        theologyCosmovision: "Historic Christian Faith",
        contentLocale: "en-US",
        bibleVersion: "KJV",
      },
      (g) => {
        if (g.contentLocale !== "en-US") throw new Error("contentLocale mismatch")
        if (g.theologyEnabled !== true) throw new Error("theologyEnabled should be true")
        if (g.bibleVersion !== "KJV") throw new Error("bibleVersion should be KJV")
        if (!g.intro?.salmo?.kjv) throw new Error("Intro psalm should have KJV text")
      }
    )
    ok ? passed++ : failed++
  } catch (e) {
    console.error("FALHA 4:", e.message)
    failed++
  }

  // 5. en-US + NIV
  try {
    const ok = await testSingleScenario(
      "5. en-US + NIV",
      {
        name: "Daily Courage Guide",
        focus: "Facing daily social anxiety and building competence",
        schemas: "Dependence / Incompetence, Defectiveness / Shame",
        currentDifficulties: "Avoiding leaving the house",
        theologyCosmovision: "Evangelical Christian",
        contentLocale: "en-US",
        bibleVersion: "NIV",
      },
      (g) => {
        if (g.contentLocale !== "en-US") throw new Error("contentLocale mismatch")
        if (g.theologyEnabled !== true) throw new Error("theologyEnabled should be true")
        if (g.bibleVersion !== "NIV") throw new Error("bibleVersion should be NIV")
        if (!g.intro?.salmo?.niv) throw new Error("Intro psalm should have NIV text")
      }
    )
    ok ? passed++ : failed++
  } catch (e) {
    console.error("FALHA 5:", e.message)
    failed++
  }

  // 6. Error handling: Validation
  try {
    console.log(`\n========================================`)
    console.log(`TESTANDO: 6. Validação de erro (nome vazio)`)
    console.log(`========================================`)
    const res = await fetch("http://127.0.0.1:3000/api/generate-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "   ", focus: "Test" }),
    })
    if (res.status === 400) {
      console.log(`✅ Validação de erro retornou HTTP 400 conforme esperado!`)
      passed++
    } else {
      console.error(`Status inesperado: ${res.status}`)
      failed++
    }
  } catch (e) {
    console.error("FALHA 6:", e.message)
    failed++
  }

  console.log(`\n========================================`)
  console.log(`TOTAL: ${passed} PASSOU | ${failed} FALHOU`)
  console.log(`========================================`)
  if (failed > 0) process.exit(1)
}

main()
