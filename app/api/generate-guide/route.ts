import { NextResponse } from "next/server"
import { BibleProvider, type BibleLocale, type BibleVersion } from "@/lib/bible/bible-provider"
import type { GuideTemplate, Section, Block, Field, WeeklyPlanItem, QuickSheetItem, CompletionConfig } from "@/lib/guide-data"

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY não foi configurada. Adicione GEMINI_API_KEY no arquivo .env.local para habilitar a geração de guias com Gemini.",
        },
        { status: 500 }
      )
    }

    const body = await req.json()
    const {
      name,
      focus,
      schemas,
      traumaSummary,
      currentDifficulties,
      priorityAreas,
      psychologyApproaches,
      theologyCosmovision,
      routine,
      whatHelps,
      thingsToAvoid,
      intensity = "light",
      additionalNotes,
      contentLocale = "pt-BR",
      bibleVersion = "ARA",
    } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nome do guia é obrigatório." },
        { status: 400 }
      )
    }

    const isEn = contentLocale === "en-US"
    const theologyEnabled = Boolean(theologyCosmovision && theologyCosmovision.trim().length > 0)
    const effectiveBibleVersion: BibleVersion | null = theologyEnabled
      ? (bibleVersion || (isEn ? "KJV" : "ARA"))
      : null

    const intensityMapPt: Record<string, string> = {
      very_light: "Muito leve (passos de 5 a 10 minutos diários, âncoras mínimas)",
      light: "Leve (15 a 20 minutos diários, escadas graduais)",
      moderate: "Moderada (25 a 35 minutos diários, rotina estruturada)",
    }

    const intensityMapEn: Record<string, string> = {
      very_light: "Very light (5 to 10 minutes daily, minimal anchors)",
      light: "Light (15 to 20 minutes daily, gradual ladders)",
      moderate: "Moderate (25 to 35 minutes daily, structured routines)",
    }

    const intensityText = isEn
      ? (intensityMapEn[intensity] || intensityMapEn.light)
      : (intensityMapPt[intensity] || intensityMapPt.light)

    const promptText = isEn ? `
You are an expert clinical psychologist and personal restructuring guide creator.
Generate a comprehensive, evidence-based, compassionate, and actionable 7-day cycle Guide Template ("GuideTemplate") in strict accordance with the user's profile.

=== LANGUAGE & CASE CONVENTION ===
Language: ENGLISH (US).
Sentence case for headers, section kickers, and titles (e.g. "How this guide views change", "Boundaries", "Behavioral activation").

=== PSYCHOLOGICAL TERMINOLOGY (MANDATORY CANONICAL TERMS) ===
Use standard terminology from Schema Therapy (ISST) and Cognitive Behavioral Therapy (Beck/APA):
- "Schema Therapy", "Early Maladaptive Schema", "Schema Modes", "Coping Responses" ("Schema Surrender", "Schema Avoidance", "Schema Overcompensation")
- "Defectiveness / Shame", "Punitiveness / Punitive Critic", "Mistrust / Abuse", "Social Isolation / Alienation", "Insufficient Self-Control / Self-Discipline", "Dependence / Incompetence", "Failure"
- "Behavioral Activation", "Graded Exposure", "Physical First Step", "Proportional Judgment", "Threat Discrimination", "4-Column Thought Record", "Grounding Techniques", "Expressive Writing", "Attachment and Competence", "Weekly Activity Schedule", "Weekly Review".

=== USER PROFILE & DIRECTIVES ===
- Guide Name: "${name}"
- Primary Focus: "${focus || "Emotional recovery and routine restructuring"}"
- Maladaptive Schemas: "${schemas || "None specified"}"
- Relevant Past Experiences / Trauma Summary: "${traumaSummary || "None specified"}"
- Current Difficulties: "${currentDifficulties || "Avoidance and procrastination"}"
- Priority Life Areas: "${priorityAreas || "Daily routine, work, relationships"}"
- Psychological Approaches: "${psychologyApproaches || "Schema Therapy, Cognitive Behavioral Therapy"}"
- Intensity Level: "${intensityText}"
- Daily Routine / Hours: "${routine || "Standard daily hours"}"
- What Typically Helps: "${whatHelps || "Gradual physical steps, quiet focus"}"
- Limits / Things to Avoid: "${thingsToAvoid || "Detailed trauma reliving alone"}"
- Additional Notes: "${additionalNotes || "Direct and actionable instructions"}"
- Theology Status: ${theologyEnabled ? `ENABLED (Worldview: "${theologyCosmovision}")` : "DISABLED"}

=== CLINICAL GUARDRAILS (STRICT COMPLIANCE) ===
1. NO CLINICAL DIAGNOSIS: Do not state or diagnose psychiatric disorders.
2. NO MEDICAL OR PHARMACOLOGICAL ADVICE: Never advise on medications or somatic treatments.
3. NO DETAILED TRAUMA RELIVING: Do not instruct the user to reprocess or write detailed narratives of severe trauma alone. Prioritize grounding, present orientation, and low-risk behavioral activation.
4. TONE: Sober, encouraging, respectful, and realistic. Avoid toxic positivity or harsh criticism.
${
  theologyEnabled
    ? `5. SCRIPTURE INTEGRATION: Provide canonical structured references (e.g. "Psalm 23:1-3", "Philippians 4:8", "Proverbs 4:23", "Matthew 11:28-30") in the 'scriptureReferences' field for relevant sections, plus short commentary and prayer. DO NOT provide verse text bodies.`
    : `5. THEOLOGY IS DISABLED: DO NOT include any Bible references, verses, prayers, theological jargon, or religious elements. Set all scripture fields to empty arrays or omit.`
}

=== REQUIRED STRUCTURE OF SECTIONS (GENERATE 5 TO 7 FOCUSED SECTIONS) ===
Sections must cover:
1. Foundation & Framework
2. Schema Map & Coping Observation
3. Boundaries & Behavioral Activation (Physical First Step)
4. Graded Exposure & Proportional Judgment
5. Attachment, Competence & Meaning
6. Weekly Review & Synthesis

Blocks per section (2 to 4 blocks per section):
- lead (clear summary)
- p (practical rationale)
- h / list (actionable steps)
- note / fields / ladder (practical exercises)

=== WEEKLY PLAN (EXACTLY 7 DAYS: dayIndex 0 to 6) ===
Provide 2 to 3 actionable, specific tasks for EACH of the 7 days (dayIndex 0 to 6).
` : `
Você é um psicólogo clínico especialista e criador de Guias de Retomada estruturados e acolhedores.
Gere um Modelo de Guia ("GuideTemplate") completo, baseado em evidências, acolhedor e acionável em ciclos de 7 dias conforme o perfil do usuário.

=== IDIOMA ===
Idioma: PORTUGUÊS DO BRASIL (pt-BR).

=== TERMINOLOGIA PSICOLÓGICA CANÔNICA (ISST / TCC) ===
Use os termos técnicos consagrados da Terapia do Esquema e TCC:
- "Terapia do Esquema", "Esquemas Iniciais Desadaptativos", "Modos de Esquema", "Estratégias de Enfrentamento / Coping" ("Rendimento", "Evitação", "Supercompensação")
- "Defectividade / Vergonha", "Postura Punitiva / Crítica Punitiva", "Desconfiança / Abuso", "Isolamento Social / Alienação", "Autocontrole Insuficiente", "Dependência / Incompetência", "Fracasso"
- "Ativação Comportamental", "Exposição Gradual", "Primeiro Passo Físico", "Julgamento Proporcional", "Discriminação de Ameaça", "Registro de Pensamentos de 4 Colunas", "Grounding / Ancoragem Sensorial", "Escrita Livre / Expressiva", "Vínculo e Competência", "Programação Semanal", "Revisão Semanal".

=== PERFIL DO USUÁRIO E DIRETRIZES ===
- Nome do Guia: "${name}"
- Foco Principal: "${focus || "Recuperação emocional e reestruturação da rotina"}"
- Esquemas a Trabalhar: "${schemas || "Não especificado"}"
- Resumo de Traumas / Experiências: "${traumaSummary || "Não especificado"}"
- Dificuldades Atuais: "${currentDifficulties || "Evitação e procrastinação"}"
- Áreas Prioritárias: "${priorityAreas || "Rotina, trabalho, relacionamentos"}"
- Abordagens da Psicologia: "${psychologyApproaches || "Terapia do Esquema, TCC"}"
- Nível de Intensidade: "${intensityText}"
- Rotina e Horários: "${routine || "Horário padrão"}"
- O que costuma ajudar: "${whatHelps || "Passos físicos graduais, foco sereno"}"
- Limites e o que evitar: "${thingsToAvoid || "Revivência detalhada de traumas sozinho"}"
- Observações adicionais: "${additionalNotes || "Orientações diretas e acionáveis"}"
- Status de Teologia: ${theologyEnabled ? `ATIVADA (Cosmovisão: "${theologyCosmovision}")` : "DESATIVADA"}

=== GUARDRAILS CLÍNICOS OBRIGATÓRIOS ===
1. NUNCA faça diagnósticos clínicos (ex: "você tem transtorno X").
2. NUNCA faça recomendações de medicamentos ou terapias invasivas.
3. NUNCA exija revivência detalhada de traumas intensos. Priorize ancoragem no presente e ativação comportamental segura.
4. LINGUAGEM: acolhedora, respeitosa, encorajadora e serena.
${
  theologyEnabled
    ? `5. INTEGRAÇÃO BÍBLICA: Forneça referências estruturadas canônicas (ex: "Salmos 23:1-3", "Filipenses 4:8", "Provérbios 4:23", "Mateus 11:28-30") no campo 'scriptureReferences' para as seções relevantes, com comentário e oração. NÃO forneça o texto dos versículos.`
    : `5. TEOLOGIA DESATIVADA: NÃO inclua qualquer citação bíblica, versículos, orações ou vocabulário religioso.`
}

=== ESTRUTURA DE SEÇÕES (GERE DE 5 A 7 SEÇÕES PRÁTICAS) ===
1. Fundamento & Mudança
2. Mapa de Esquemas & Modos
3. Limites, Grounding & Ativação (Primeiro Passo Físico)
4. Exposição Gradual & Julgamento Proporcional
5. Vínculo, Competência & Sentido
6. Revisão Semanal & Consolidação

Blocos por seção (2 a 4 blocos por seção):
- lead (resumo claro)
- p (explicação prática)
- h / list (passos acionáveis)
- note / fields / ladder (exercícios e registros)

=== PROGRAMAÇÃO SEMANAL (EXATAMENTE 7 DIAS: dayIndex 0 a 6) ===
Gere 2 a 3 tarefas concretas para CADA um dos 7 dias (dayIndex 0 a 6).
`

    const responseSchema = {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        profileSummary: { type: "STRING" },
        category: { type: "STRING" },
        targetAudience: { type: "STRING" },
        intro: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            subtitle: { type: "STRING" },
            oracao: { type: "STRING" },
            salmoReference: { type: "STRING" },
          },
          required: ["title", "subtitle"],
        },
        sections: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              number: { type: "STRING" },
              kicker: { type: "STRING" },
              title: { type: "STRING" },
              blocks: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    type: {
                      type: "STRING",
                      enum: ["lead", "p", "h", "list", "note", "table", "fields", "ladder"],
                    },
                    text: { type: "STRING" },
                    label: { type: "STRING" },
                    items: { type: "ARRAY", items: { type: "STRING" } },
                    head: { type: "ARRAY", items: { type: "STRING" } },
                    rows: {
                      type: "ARRAY",
                      items: {
                        type: "ARRAY",
                        items: { type: "STRING" },
                      },
                    },
                    ladderRows: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          id: { type: "STRING" },
                          label: { type: "STRING" },
                        },
                        required: ["id", "label"],
                      },
                    },
                    fields: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          kind: { type: "STRING", enum: ["static", "text", "textarea", "scale"] },
                          id: { type: "STRING" },
                          label: { type: "STRING" },
                          text: { type: "STRING" },
                          max: { type: "INTEGER" },
                        },
                        required: ["kind"],
                      },
                    },
                  },
                  required: ["type"],
                },
              },
              scriptureReferences: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
              scriptureCommentary: { type: "STRING" },
              scripturePrayer: { type: "STRING" },
            },
            required: ["id", "number", "kicker", "title", "blocks"],
          },
        },
        weeklyPlan: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              dayIndex: { type: "INTEGER" },
              time: { type: "STRING" },
              description: { type: "STRING" },
              order: { type: "INTEGER" },
              countsTowardCompletion: { type: "BOOLEAN" },
            },
            required: ["id", "dayIndex", "time", "description", "order"],
          },
        },
        quickSheets: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              title: { type: "STRING" },
              summary: { type: "STRING" },
            },
            required: ["id", "title", "summary"],
          },
        },
        completionConfig: {
          type: "OBJECT",
          properties: {
            reviewTitle: { type: "STRING" },
            analysisDimensions: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
            nextWeekFocusRules: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
          },
          required: ["reviewTitle", "analysisDimensions", "nextWeekFocusRules"],
        },
        safetyNotes: {
          type: "ARRAY",
          items: { type: "STRING" },
        },
      },
      required: [
        "title",
        "description",
        "profileSummary",
        "intro",
        "sections",
        "weeklyPlan",
        "quickSheets",
        "completionConfig",
      ],
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const requestPayload = {
      contents: [
        {
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.4,
      },
    }

    const MODELS_TO_TRY = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-flash-latest",
      "gemini-2.5-pro",
    ]
    let rawJsonText = ""
    let lastError: string | null = null

    for (const modelName of MODELS_TO_TRY) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

      // Tenta até 2 vezes por modelo caso ocorra 503 ou 429
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestPayload),
          })

          if (res.ok) {
            const data = await res.json()
            rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
            if (rawJsonText) {
              break
            }
          } else {
            const errText = await res.text()
            lastError = `Modelo ${modelName} retornou status ${res.status}: ${errText}`
            console.warn(lastError)

            // Se for erro de demanda/rate limit, espera um instante e tenta novamente
            if (res.status === 503 || res.status === 429) {
              await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)))
              continue
            } else {
              break
            }
          }
        } catch (err: any) {
          lastError = err?.message
          console.warn(`Erro com modelo ${modelName}:`, err)
        }
      }

      if (rawJsonText) {
        break
      }
    }

    if (!rawJsonText) {
      return NextResponse.json(
        {
          error:
            lastError ||
            "Não foi possível obter resposta válida dos modelos do Gemini. Tente novamente em alguns instantes.",
        },
        { status: 502 }
      )
    }

    const parsed = JSON.parse(rawJsonText)

    // ── Build and Validate GuideTemplate Structure ──
    const guideId = `guide-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const nowIso = new Date().toISOString()

    // ── Resolve Scripture References safely via BibleProvider ──
    let resolvedIntro = {
      title: parsed.intro?.title || parsed.title,
      subtitle: parsed.intro?.subtitle || parsed.description,
      oracao: "",
      salmo: undefined as any,
    }

    if (theologyEnabled) {
      resolvedIntro.oracao = parsed.intro?.oracao || ""
      const psalmRef = parsed.intro?.salmoReference || (isEn ? "Psalm 27:13-14" : "Salmos 27:13-14")
      const resolvedPsalm = BibleProvider.resolveVerse(psalmRef, contentLocale as BibleLocale)
      if (resolvedPsalm) {
        resolvedIntro.salmo = resolvedPsalm
      }
    }

    const processedSections: Section[] = (parsed.sections || []).map((sec: any, sIdx: number) => {
      const secId = sec.id || `sec-${sIdx + 1}`
      const secNumber = sec.number || String(sIdx + 1).padStart(2, "0")

      // Map raw blocks into valid Block format
      const blocks: Block[] = (sec.blocks || []).map((b: any, bIdx: number) => {
        if (b.type === "ladder" && b.ladderRows) {
          return {
            type: "ladder",
            id: `ladder-${secId}-${bIdx}`,
            head: b.head || (isEn ? ["Step", "Predicted score", "Done"] : ["Degrau sugerido", "Nota prevista", "Feito"]),
            rows: b.ladderRows.map((r: any, rIdx: number) => ({
              id: r.id || `${secId}-l${rIdx + 1}`,
              label: r.label,
            })),
          } as Block
        }

        if (b.type === "fields" && b.fields) {
          return {
            type: "fields",
            title: b.label || b.text,
            fields: b.fields.map((f: any, fIdx: number) => ({
              kind: f.kind || "textarea",
              id: f.id || `${secId}-f${fIdx + 1}`,
              label: f.label || f.text || `Field ${fIdx + 1}`,
              text: f.text,
              max: f.max,
            })),
          } as Block
        }

        if (b.type === "table" && b.rows) {
          return {
            type: "table",
            head: b.head || [],
            rows: b.rows || [],
          } as Block
        }

        if (b.type === "list" && b.items) {
          return {
            type: "list",
            items: b.items,
          } as Block
        }

        if (b.type === "note") {
          return {
            type: "note",
            label: b.label,
            text: b.text || "",
          } as Block
        }

        if (b.type === "lead" || b.type === "h" || b.type === "p") {
          return {
            type: b.type,
            text: b.text || "",
          } as Block
        }

        return {
          type: "p",
          text: b.text || "",
        } as Block
      })

      // Handle Scripture integration strictly via BibleProvider
      let scripture = undefined
      if (theologyEnabled && Array.isArray(sec.scriptureReferences) && sec.scriptureReferences.length > 0) {
        const resolvedVerses = sec.scriptureReferences
          .map((refStr: string) => BibleProvider.resolveVerse(refStr, contentLocale as BibleLocale))
          .filter(Boolean) as { ref: string; ara: string; nvt: string; kjv?: string; niv?: string }[]

        if (resolvedVerses.length > 0) {
          scripture = {
            verses: resolvedVerses,
            comentario: sec.scriptureCommentary || "",
            oracao: sec.scripturePrayer || "",
          }
        }
      }

      return {
        id: secId,
        number: secNumber,
        kicker: sec.kicker || "SECTION",
        title: sec.title || `Section ${secNumber}`,
        blocks,
        scripture,
      }
    })

    // ── Ensure 7-day weekly plan (days 0 through 6) ──
    const rawWeeklyPlan: WeeklyPlanItem[] = Array.isArray(parsed.weeklyPlan) ? parsed.weeklyPlan : []
    const validatedWeeklyPlan: WeeklyPlanItem[] = []

    for (let day = 0; day < 7; day++) {
      const dayTasks = rawWeeklyPlan.filter((t) => t.dayIndex === day)
      if (dayTasks.length > 0) {
        dayTasks.forEach((t, orderIdx) => {
          validatedWeeklyPlan.push({
            id: t.id || `act-${day}-${orderIdx + 1}`,
            dayIndex: day,
            time: t.time || "16:30",
            description: t.description || (isEn ? "Behavioral activation step" : "Atividade de ativação"),
            order: t.order ?? orderIdx,
            countsTowardCompletion: t.countsTowardCompletion ?? true,
          })
        })
      } else {
        // Guarantee at least 1 task for empty days
        validatedWeeklyPlan.push({
          id: `act-${day}-1`,
          dayIndex: day,
          time: "16:30",
          description: isEn ? "Daily reflection & 15-min activation" : "Reflexão diária e ativação de 15 min",
          order: 0,
          countsTowardCompletion: true,
        })
      }
    }

    const quickSheets: QuickSheetItem[] = (parsed.quickSheets || []).map((qs: any, i: number) => ({
      id: qs.id || `qs-${i + 1}`,
      title: qs.title || (isEn ? `Quick Sheet ${i + 1}` : `Ficha Rápida ${i + 1}`),
      summary: qs.summary || "",
    }))

    const completionConfig: CompletionConfig = {
      enabled: true,
      reviewTitle: parsed.completionConfig?.reviewTitle || (isEn ? `Weekly Review: ${parsed.title}` : `Veredito da Semana: ${parsed.title}`),
      analysisDimensions: Array.isArray(parsed.completionConfig?.analysisDimensions) && parsed.completionConfig.analysisDimensions.length > 0
        ? parsed.completionConfig.analysisDimensions
        : (isEn
            ? [
                "Adherence to scheduled weekly activities",
                "Identification and management of schemas and avoidance",
                "Reflections and observations recorded in response fields",
                "Consistency in daily morning and evening routines",
              ]
            : [
                "Adesão às atividades planejadas no cronograma semanal",
                "Identificação e manejo de esquemas e padrões de evitação",
                "Percepções e sentimentos registrados nas caixas de reflexão",
                "Constância nas rotinas diárias",
              ]),
      nextWeekFocusRules: Array.isArray(parsed.completionConfig?.nextWeekFocusRules) && parsed.completionConfig.nextWeekFocusRules.length > 0
        ? parsed.completionConfig.nextWeekFocusRules
        : (isEn
            ? [
                "Gradual and sustainable adjustments for the weekly routine",
                "Reinforce practices that fostered clarity and anxiety reduction",
              ]
            : [
                "Ajustes graduais e sustentáveis para a rotina semanal",
                "Reforçar práticas que trouxeram clareza e redução da ansiedade",
              ]),
      theologyReviewEnabled: theologyEnabled,
    }

    const generatedGuideTemplate: GuideTemplate = {
      id: guideId,
      title: parsed.title || name,
      description: parsed.description || focus || "Custom recovery guide",
      version: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
      schemaVersion: 1,
      contentLocale: contentLocale as "pt-BR" | "en-US",
      theologyEnabled,
      bibleVersion: effectiveBibleVersion,
      config: {
        targetAudience: parsed.targetAudience || (isEn ? "Individuals seeking structured recovery" : "Pessoas em busca de reestruturação"),
        category: parsed.category || (isEn ? "Recovery & Schemas" : "Retomada & Esquemas"),
      },
      intro: resolvedIntro as any,
      sections: processedSections,
      scheduleTaskIds: validatedWeeklyPlan.map((t) => t.id),
      weeklyPlan: validatedWeeklyPlan,
      quickSheets,
      completionConfig,
      safetyNotes: parsed.safetyNotes || [],
    }

    return NextResponse.json({
      guideTemplate: generatedGuideTemplate,
      profileSummary: parsed.profileSummary || "",
    })
  } catch (error: any) {
    console.error("Falha ao gerar Guia via Gemini:", error)
    return NextResponse.json(
      { error: error?.message || "Erro interno ao gerar o Modelo de Guia." },
      { status: 500 }
    )
  }
}
