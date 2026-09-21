// test-generate.mjs
import fs from 'fs'

async function runTests() {
  console.log("=== INICIANDO TESTES DA API /api/generate-guide ===")

  const scenarios = [
    {
      name: "1. pt-BR + theology=false",
      payload: {
        name: "Guia Foco e Ação",
        focus: "Superar paralisia e iniciar projetos",
        schemas: "Autocontrole Insuficiente, Fracasso",
        traumaSummary: "Cobranças excessivas na infância",
        currentDifficulties: "Procrastinação crônica em tarefas importantes",
        priorityAreas: "Trabalho e rotina diária",
        psychologyApproaches: "Terapia do Esquema, Ativação Comportamental",
        theologyCosmovision: "", // EMPTY -> theologyEnabled = false
        routine: "09:00 às 18:00",
        whatHelps: "Listas curtas e passos de 5 minutos",
        thingsToAvoid: "Autoacusação e tarefas gigantes",
        intensity: "very_light",
        additionalNotes: "Direto e objetivo",
        contentLocale: "pt-BR",
      },
      expectTheology: false,
      expectLocale: "pt-BR",
    },
    {
      name: "2. pt-BR + theology=true",
      payload: {
        name: "Guia Esperança e Renovação",
        focus: "Trabalhar desconfiança e restaurar vínculos com fé",
        schemas: "Desconfiança / Abuso, Isolamento Social",
        traumaSummary: "Ruptura relacional e traição",
        currentDifficulties: "Medo de se aproximar e hostilidade presumida",
        priorityAreas: "Igreja, relacionamentos e paz de espírito",
        psychologyApproaches: "Terapia do Esquema, TCC",
        theologyCosmovision: "Cristã Reformada", // FILLED -> theologyEnabled = true
        routine: "08:00 às 20:00",
        whatHelps: "Oração, leitura bíblica e passos graduais",
        thingsToAvoid: "Isolamento prolongado",
        intensity: "light",
        additionalNotes: "Foco em graça e discernimento",
        contentLocale: "pt-BR",
        bibleVersion: "ARA",
      },
      expectTheology: true,
      expectLocale: "pt-BR",
    },
    {
      name: "3. en-US + theology=false",
      payload: {
        name: "Executive Restoration Guide",
        focus: "Overcoming burnout and punitive perfectionism",
        schemas: "Punitiveness / Punitive Critic, Defectiveness / Shame",
        traumaSummary: "Corporate burnout and harsh criticism",
        currentDifficulties: "Severe self-judgment after meetings",
        priorityAreas: "Work, sleep, balanced self-evaluation",
        psychologyApproaches: "Schema Therapy, Behavioral Activation",
        theologyCosmovision: "", // EMPTY -> theologyEnabled = false
        routine: "8am to 6pm",
        whatHelps: "Proportional judgment and 15-min walks",
        thingsToAvoid: "Working late hours alone",
        intensity: "moderate",
        additionalNotes: "Keep sentence case and actionable steps",
        contentLocale: "en-US",
      },
      expectTheology: false,
      expectLocale: "en-US",
    },
    {
      name: "4. en-US + KJV",
      payload: {
        name: "Restoration and Hope in God",
        focus: "Healing relational wounds and establishing daily faithfulness",
        schemas: "Mistrust / Abuse, Social Isolation / Alienation",
        traumaSummary: "Past painful betrayal",
        currentDifficulties: "Difficulty opening up and chronic vigilance",
        priorityAreas: "Fellowship, church, family",
        psychologyApproaches: "Schema Therapy, Cognitive Behavioral Therapy",
        theologyCosmovision: "Historic Christian Faith", // FILLED -> theologyEnabled = true
        routine: "7am to 9pm",
        whatHelps: "Scripture meditation, quiet prayer, physical first steps",
        thingsToAvoid: "Hypervigilance and isolation",
        intensity: "light",
        additionalNotes: "Use KJV Scripture citations",
        contentLocale: "en-US",
        bibleVersion: "KJV",
      },
      expectTheology: true,
      expectLocale: "en-US",
      expectBibleVersion: "KJV",
    },
    {
      name: "5. en-US + NIV",
      payload: {
        name: "Daily Courage Guide",
        focus: "Facing daily social anxiety and building competence",
        schemas: "Dependence / Incompetence, Defectiveness / Shame",
        traumaSummary: "Overprotective family background",
        currentDifficulties: "Avoiding leaving the house and asking for help constantly",
        priorityAreas: "Independence, daily errands, confidence",
        psychologyApproaches: "Behavioral Activation, Graded Exposure",
        theologyCosmovision: "Evangelical Christian", // FILLED -> theologyEnabled = true
        routine: "9am to 5pm",
        whatHelps: "Graded ladders, encouraging reminders",
        thingsToAvoid: "Escaping discomfort immediately",
        intensity: "light",
        additionalNotes: "Use NIV Scripture citations",
        contentLocale: "en-US",
        bibleVersion: "NIV",
      },
      expectTheology: true,
      expectLocale: "en-US",
      expectBibleVersion: "NIV",
    },
  ]

  let passed = 0
  let failed = 0

  for (const sc of scenarios) {
    console.log(`\n--- Testando cenário: ${sc.name} ---`)
    try {
      const res = await fetch("http://127.0.0.1:3000/api/generate-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sc.payload),
      })

      if (!res.ok) {
        const txt = await res.text()
        console.error(`❌ HTTP ${res.status}:`, txt)
        failed++
        continue
      }

      const json = await res.json()
      const guide = json.guideTemplate

      if (!guide) {
        console.error("❌ Resposta sem guideTemplate:", json)
        failed++
        continue
      }

      // Assertions
      console.log(`✓ Guide ID: ${guide.id}`)
      console.log(`✓ Title: ${guide.title}`)
      console.log(`✓ contentLocale: ${guide.contentLocale} (esperado: ${sc.expectLocale})`)
      console.log(`✓ theologyEnabled: ${guide.theologyEnabled} (esperado: ${sc.expectTheology})`)
      console.log(`✓ bibleVersion: ${guide.bibleVersion}`)
      console.log(`✓ Sections count: ${guide.sections?.length || 0}`)
      console.log(`✓ Weekly plan items: ${guide.weeklyPlan?.length || 0}`)

      if (guide.contentLocale !== sc.expectLocale) {
        throw new Error(`contentLocale incorreto: esperado ${sc.expectLocale}, obtido ${guide.contentLocale}`)
      }

      if (guide.theologyEnabled !== sc.expectTheology) {
        throw new Error(`theologyEnabled incorreto: esperado ${sc.expectTheology}, obtido ${guide.theologyEnabled}`)
      }

      if (sc.expectTheology === false) {
        // Assert NO scriptures
        if (guide.bibleVersion !== null) {
          throw new Error(`bibleVersion deveria ser null quando theology=false, mas foi ${guide.bibleVersion}`)
        }
        for (const sec of guide.sections) {
          if (sec.scripture) {
            throw new Error(`Seção ${sec.number} contém scripture quando theology=false!`)
          }
        }
        if (guide.intro?.oracao || guide.intro?.salmo) {
          throw new Error(`Intro contém oração/salmo quando theology=false!`)
        }
        console.log("✓ Verificação Theology OFF: Nenhuma escritura ou oração presente.")
      } else {
        // Assert Scripture resolution
        if (sc.expectBibleVersion && guide.bibleVersion !== sc.expectBibleVersion) {
          throw new Error(`bibleVersion incorreto: esperado ${sc.expectBibleVersion}, obtido ${guide.bibleVersion}`)
        }
        const sectionsWithScripture = guide.sections.filter((s) => s.scripture && s.scripture.verses?.length > 0)
        console.log(`✓ Seções com Escritura resolvida: ${sectionsWithScripture.length}`)
        for (const sec of sectionsWithScripture) {
          for (const v of sec.scripture.verses) {
            console.log(`   - Ref: ${v.ref} | KJV: ${Boolean(v.kjv)} | NIV: ${Boolean(v.niv)} | ARA: ${Boolean(v.ara)} | NVT: ${Boolean(v.nvt)}`)
            if (!v.ara && !v.kjv && !v.niv && !v.nvt) {
              throw new Error(`Versículo sem texto verificado: ${v.ref}`)
            }
          }
        }
      }

      // Assert 7 days in weekly plan
      const uniqueDays = new Set((guide.weeklyPlan || []).map((t) => t.dayIndex))
      if (uniqueDays.size !== 7) {
        throw new Error(`Weekly plan não contém exatamente 7 dias! Dias únicos: ${Array.from(uniqueDays).join(", ")}`)
      }
      console.log("✓ Weekly plan contém exatamente os 7 dias (0 a 6).")

      passed++
      console.log(`✅ ${sc.name} PASSOU!`)
    } catch (err) {
      console.error(`❌ Erro no cenário ${sc.name}:`, err.message)
      failed++
    }
  }

  // 6. Test Error Validation
  console.log("\n--- Testando cenário: 6. Validação de erro (nome vazio) ---")
  try {
    const res = await fetch("http://127.0.0.1:3000/api/generate-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "   ", focus: "Test" }),
    })
    if (res.status === 400) {
      console.log("✓ Validação de erro retornou HTTP 400 conforme esperado.")
      passed++
      console.log("✅ 6. Validação de erro PASSOU!")
    } else {
      throw new Error(`Esperado status 400, recebido ${res.status}`)
    }
  } catch (err) {
    console.error("❌ Erro no cenário 6:", err.message)
    failed++
  }

  console.log(`\n=== RESULTADO FINAL: ${passed} PASSOU | ${failed} FALHOU ===`)
  if (failed > 0) {
    process.exit(1)
  }
}

runTests()
