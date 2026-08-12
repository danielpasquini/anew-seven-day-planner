import { NextResponse } from "next/server"

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
    const { weekTitle, startDate, endDate, snapshot, textAnswers, theologyEnabled = true } = body

    if (!snapshot) {
      return NextResponse.json(
        { error: "Snapshot de conclusão não fornecido." },
        { status: 400 }
      )
    }

    const promptText = `
Você é um assistente atencioso, empático e focado na análise objetiva de um Guia de Retomada Semanal de 7 dias.

=== INFORMAÇÕES DA SEMANA ===
Título: ${weekTitle || "Semana sem nome"}
Período: ${startDate} a ${endDate}
Total de Tarefas Contáveis: ${snapshot.totalTasks}
Tarefas Concluídas: ${snapshot.completedTasks}
Porcentagem de Conclusão: ${snapshot.completionPercentage}%

=== TAREFAS REGISTRADAS ===
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

=== RESPOSTAS E REGISTROS ESCRITOS DO USUÁRIO ===
${
  textAnswers && typeof textAnswers === "object" && Object.keys(textAnswers).length > 0
    ? Object.entries(textAnswers)
        .map(([id, val]) => `[${id}]: ${val}`)
        .join("\n")
    : "Nenhum texto adicional preenchido."
}

=== DIRETRIZES OBRIGATÓRIAS DO VEREDITO E ANÁLISE ===
1. Avalie estritamente a EXECUÇÃO DA SEMANA (adesão ao plano, categorias realizadas, padrões observados nos dados, pequenos ajustes).
2. NUNCA avalie o valor pessoal, moral ou dignidade do usuário. Uma porcentagem baixa (30%, 0%) NÃO é falha moral.
3. LINGUAGEM: acolhedora, respeitosa, encorajadora e serena. NUNCA use linguagem punitiva, de cobrança excessiva ou culpabilização.
4. PROIBIDO: NUNCA faça diagnósticos clínicos, afirmações de piora/cura de saúde mental, recomendações médicas ou de medicamentos.
5. Se os dados forem escassos ou insuficientes para conclusões profundas, declare isso com simplicidade e clareza.
${
  theologyEnabled === false
    ? "6. TEOLOGIA DESATIVADA: NÃO inclua qualquer citação bíblica, conceito teológico, vocabulário religioso ou orações nesta análise. Mantenha o tom estritamente comportamental e reflexivo."
    : "6. TEOLOGIA ATIVA: Se apropriado, pode incluir breves reflexões encorajadoras no tom contemplativo do guia."
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
              description: "Veredito resumido da execução da semana (1-2 frases acolhedoras e objetivas sobre a adesão ao plano).",
            },
            summary: {
              type: "STRING",
              description: "Síntese dos principais destaques do progresso durante a semana.",
            },
            whatWorked: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Lista de 2 a 4 coisas ou práticas que funcionaram bem.",
            },
            difficulties: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Lista de 1 a 3 desafios ou pontos de atenção observados.",
            },
            observedPatterns: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Lista de 1 a 3 padrões comportamentais sustentados pelos dados.",
            },
            nextWeekSuggestions: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Lista de 2 a 3 sugestões simples e práticas para a próxima semana.",
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

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("Erro na API do Gemini:", res.status, errText)
      return NextResponse.json(
        { error: `Gemini API respondeu com status ${res.status}. Verifique se a chave GEMINI_API_KEY no .env.local é válida.` },
        { status: 502 }
      )
    }

    const data = await res.json()
    const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawJsonText) {
      return NextResponse.json(
        { error: "Resposta vazia da API do Gemini." },
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
