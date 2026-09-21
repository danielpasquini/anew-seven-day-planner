import { NextResponse } from "next/server"
import { sections } from "@/lib/guide-data"

function buildFieldLabelMap() {
  const map: Record<string, { sectionTitle: string; label: string }> = {}
  sections.forEach((sec) => {
    sec.blocks.forEach((block) => {
      if (block.type === "fields" && block.fields) {
        block.fields.forEach((f) => {
          if (f.kind !== "static") {
            map[f.id] = { sectionTitle: sec.title, label: f.label }
          }
        })
      } else if (block.type === "ladder" && block.rows) {
        block.rows.forEach((r) => {
          map[`${r.id}-nota`] = { sectionTitle: sec.title, label: `Nota para: ${r.label}` }
        })
      }
    })
  })
  return map
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY não foi configurada. Adicione GEMINI_API_KEY no arquivo .env.local para habilitar a análise automática com Gemini." },
        { status: 500 }
      )
    }

    const body = await req.json()
    const {
      guideTitle,
      weekTitle,
      startDate,
      endDate,
      snapshot,
      textAnswers,
      theologyEnabled = true,
      completionConfig,
      contentLocale = "pt-BR",
    } = body

    if (!snapshot) {
      return NextResponse.json(
        { error: "Snapshot de conclusão não fornecido." },
        { status: 400 }
      )
    }

    const isEn = contentLocale === "en-US"
    const fieldMap = buildFieldLabelMap()

    const formattedAnswers = textAnswers && typeof textAnswers === "object" && Object.keys(textAnswers).length > 0
      ? Object.entries(textAnswers)
          .filter(([, val]) => typeof val === "string" && val.trim() !== "")
          .map(([id, val]) => {
            const meta = fieldMap[id]
            const labelStr = meta ? `[${meta.sectionTitle}] ${meta.label}` : `[Campo ${id}]`
            return `${labelStr}: "${val}"`
          })
          .join("\n")
      : (isEn ? "No written reflection text was entered." : "Nenhum texto de reflexão foi preenchido.")

    const isTheologyActive = theologyEnabled !== false && completionConfig?.theologyReviewEnabled !== false

    const dimensionsStr = Array.isArray(completionConfig?.analysisDimensions) && completionConfig.analysisDimensions.length > 0
      ? completionConfig.analysisDimensions.map((d: string) => `- ${d}`).join("\n")
      : (isEn ? "- Adherence to schedule activities\n- Reported feelings and difficulties\n- Observed patterns" : "- Adesão às atividades do cronograma\n- Percepções e dificuldades relatadas\n- Padrões observados")

    const focusRulesStr = Array.isArray(completionConfig?.nextWeekFocusRules) && completionConfig.nextWeekFocusRules.length > 0
      ? completionConfig.nextWeekFocusRules.map((r: string) => `- ${r}`).join("\n")
      : (isEn ? "- Gradual adjustments for the weekly routine" : "- Ajustes graduais para a rotina semanal")

    const reviewTitle = completionConfig?.reviewTitle || (isEn ? `Week Review (${guideTitle || "Recovery Guide"})` : `Análise da Semana (${guideTitle || "Guia de Retomada"})`)

    const promptText = isEn ? `
You are a warm, empathetic, and clinical assistant focused on the objective review of a 7-day Weekly Cycle for the guide "${guideTitle || "My Recovery Guide"}".
Please respond strictly in ENGLISH (US), following sentence case guidelines.

=== REVIEW TITLE ===
${reviewTitle}

=== WEEK METADATA ===
Week Title: ${weekTitle || "Untitled Week"}
Period: ${startDate} to ${endDate}
Total Countable Tasks: ${snapshot.totalTasks}
Completed Tasks: ${snapshot.completedTasks}
Completion Percentage: ${snapshot.completionPercentage}%

=== REGISTERED WEEKLY ACTIVITIES ===
${
  Array.isArray(snapshot.taskResults) && snapshot.taskResults.length > 0
    ? snapshot.taskResults
        .map(
          (t: { dayIndex: number; time?: string; description: string; done: boolean; countsTowardCompletion?: boolean }) =>
            `- Day ${t.dayIndex + 1} [${t.time || "12:00"}] ${t.description} -> ${t.done ? "COMPLETED" : "PENDING"}${t.countsTowardCompletion === false ? " (Informational)" : ""}`
        )
        .join("\n")
    : "No activities registered."
}

=== USER'S WRITTEN RESPONSES AND REFLECTIONS ===
${formattedAnswers}

=== SPECIFIC ANALYSIS DIMENSIONS ===
${dimensionsStr}

=== FOCUS RULES FOR NEXT WEEK ===
${focusRulesStr}

=== MANDATORY GUIDELINES ===
1. CAREFULLY EVALUATE WRITTEN RESPONSES: Explicitly reference aspects of the user's notes and reflections.
2. Evaluate strictly the EXECUTION OF THE WEEK against the specified analysis dimensions.
3. NEVER judge the user's moral worth or dignity. A low percentage or reported struggles are NOT moral failures.
4. TONE: Warm, encouraging, respectful, and sober. Avoid toxic positivity or harsh demands.
5. STRICTLY FORBIDDEN: Clinical diagnosis, claims of mental health deterioration or cure, and medical or pharmacological advice.
${
  !isTheologyActive
    ? "6. THEOLOGY DISABLED: Do NOT include Bible verses, theological jargon, or religious prayers. Keep the review purely behavioral and cognitive."
    : "6. THEOLOGY ACTIVE: If appropriate, gentle contemplative reflections may be included."
}

Please output strictly valid JSON matching the schema.
` : `
Você é um assistente atencioso, empático e focado na análise objetiva de um Ciclo Semanal de 7 dias do guia "${guideTitle || "Meu Guia de Retomada"}".

=== TÍTULO DA ANÁLISE ===
${reviewTitle}

=== INFORMAÇÕES DA SEMANA ===
Título da Semana: ${weekTitle || "Semana sem nome"}
Período: ${startDate} a ${endDate}
Total de Tarefas Contáveis: ${snapshot.totalTasks}
Tarefas Concluídas: ${snapshot.completedTasks}
Porcentagem de Conclusão: ${snapshot.completionPercentage}%

=== TAREFAS REGISTRADAS NO CRONOGRAMA ===
${
  Array.isArray(snapshot.taskResults) && snapshot.taskResults.length > 0
    ? snapshot.taskResults
        .map(
          (t: { dayIndex: number; time?: string; description: string; done: boolean; countsTowardCompletion?: boolean }) =>
            `- Dia ${t.dayIndex + 1} [${t.time || "12:00"}] ${t.description} -> ${t.done ? "CONCLUÍDA" : "PENDENTE"}${t.countsTowardCompletion === false ? " (Informativa)" : ""}`
        )
        .join("\n")
    : "Nenhuma tarefa cadastrada."
}

=== RESPOSTAS E REGISTROS ESCRITOS DO USUÁRIO (REFLEXÕES) ===
${formattedAnswers}

=== DIMENSÕES ESPECÍFICAS DE ANÁLISE DO MODELO DO GUIA ===
${dimensionsStr}

=== REGRAS DE FOCO PARA A PRÓXIMA SEMANA ===
${focusRulesStr}

=== DIRETRIZES OBRIGATÓRIAS DO VEREDITO E ANÁLISE ===
1. ANALISE COM ATENÇÃO OS TEXTOS E REFLEXÕES ESCRITAS DO USUÁRIO: Avalie e cite explicitamente aspectos dos relatos escritos pelo usuário nas seções correspondentes.
2. Avalie estritamente a EXECUÇÃO DA SEMANA segundo as dimensões de análise acima.
3. NUNCA avalie o valor pessoal, moral ou dignidade do usuário. Uma porcentagem baixa ou relatos de dificuldades NÃO são falhas morais.
4. LINGUAGEM: acolhedora, respeitosa, encorajadora e serena. NUNCA use linguagem punitiva, de cobrança excessiva ou culpabilização.
5. PROIBIDO: NUNCA faça diagnósticos clínicos, afirmações de piora/cura de saúde mental, recomendações médicas ou de medicamentos.
6. Se os dados forem escassos ou insuficientes para conclusões profundas, declare isso com simplicidade e clareza.
${
  !isTheologyActive
    ? "7. TEOLOGIA DESATIVADA: NÃO inclua qualquer citação bíblica, conceito teológico, vocabulário religioso ou orações nesta análise. Mantenha o tom estritamente comportamental e reflexivo."
    : "7. TEOLOGIA ATIVA: Se apropriado, pode incluir breves reflexões encorajadoras no tom contemplativo do guia."
}

Por favor, forneça o resultado no formato JSON estritamente estruturado conforme o schema.
`

    // Call Gemini API REST Endpoint with Structured Output (JSON Schema)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const requestPayload = {
      contents: [
        {
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            verdict: {
              type: "STRING",
              description: "Veredito resumido da execução da semana (1-2 frases acolhedoras e objetivas sobre a adesão ao plano e relatos do usuário).",
            },
            summary: {
              type: "STRING",
              description: "Síntese dos principais destaques do progresso durante a semana, incluindo reflexões escritas.",
            },
            whatWorked: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Lista de 2 a 4 coisas, conquistas ou práticas relatadas que funcionaram bem.",
            },
            difficulties: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Lista de 1 a 3 desafios, ansiedades ou dificuldades expressas nos textos.",
            },
            observedPatterns: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Lista de 1 a 3 padrões comportamentais ou emocionais sustentados pelos dados e relatos.",
            },
            nextWeekSuggestions: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Lista de 2 a 3 sugestões simples e práticas para a próxima semana baseadas nos relatos.",
            },
          },
          required: [
            "verdict",
            "summary",
            "whatWorked",
            "difficulties",
            "observedPatterns",
            "nextWeekSuggestions",
          ],
        },
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

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(geminiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestPayload),
          })

          if (res.ok) {
            const data = await res.json()
            rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text
            if (rawJsonText) break
          } else {
            const errText = await res.text()
            lastError = `Modelo ${modelName} retornou status ${res.status}: ${errText}`
            console.warn(lastError)

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

      if (rawJsonText) break
    }

    if (!rawJsonText) {
      return NextResponse.json(
        { error: lastError || "Não foi possível obter resposta válida da IA. Tente novamente." },
        { status: 502 }
      )
    }

    const parsedReview = JSON.parse(rawJsonText)
    const result = {
      ...parsedReview,
      generatedAt: new Date().toISOString(),
      analysisVersion: 1,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Falha ao analisar semana via Gemini:", error)
    return NextResponse.json(
      { error: error?.message || "Erro interno ao processar análise inteligente." },
      { status: 500 }
    )
  }
}
