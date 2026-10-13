import type { Section, GuideTemplate } from "./guide-data"

export const introEn = {
  "title": "Recovery Guide",
  "subtitle": "A space to organise everyday life, record experiences and find support.",
  "oracao": "",
  "salmo": {
    "ref": "",
    "ara": "",
    "nvt": "",
    "kjv": "",
    "niv": ""
  }
}

export const sectionsEn: Section[] = [
  {
    "id": "fundamento",
    "number": "01",
    "kicker": "YOUR PRACTICE",
    "title": "Your guide, your choices",
    "blocks": [
      {
        "type": "lead",
        "text": "A space to organise everyday life with care and autonomy."
      },
      {
        "type": "p",
        "text": "You can record experiences, plan small acts of care and explore free resources. Use what fits your life: adapting, resting and asking for help are also part of the process."
      },
      {
        "type": "note",
        "label": "Personal choice",
        "text": "Your culture, material conditions and boundaries matter. Spirituality is optional; religious, agnostic and atheist experiences are respected. No belief is required to use the guide."
      }
    ]
  },
  {
    "id": "mapa",
    "number": "02",
    "kicker": "YOUR PRACTICE",
    "title": "Ways to understand your experiences",
    "blocks": [
      {
        "type": "lead",
        "text": "Psychology includes different traditions."
      },
      {
        "type": "p",
        "text": "A perspective can help you discuss what happens; it does not define who you are. Explore language that feels meaningful to you, without needing to adopt a particular approach."
      },
      {
        "type": "table",
        "head": [
          "Perspective",
          "Examples of topics"
        ],
        "rows": [
          [
            "Cognitive and behavioural",
            "Thoughts, learning, habits and actions in context."
          ],
          [
            "Psychodynamic and psychoanalytic",
            "History, conflicts, relationships and meanings."
          ],
          [
            "Humanistic, phenomenological and existential",
            "Lived experience, choices, values and possibilities."
          ],
          [
            "Systemic, social and community",
            "Relationships, support networks and social conditions."
          ],
          [
            "Schema Therapy",
            "Patterns of needs, interpretations and protection, when this language is useful."
          ]
        ]
      },
      {
        "type": "note",
        "label": "Informed choice",
        "text": "These are starting points for conversation, with no hierarchy of approaches. Ask a professional about training, goals, how the work happens, boundaries and alternatives. The fit depends on your needs and individual assessment."
      }
    ]
  },
  {
    "id": "limites",
    "number": "03",
    "kicker": "YOUR PRACTICE",
    "title": "Care and boundaries",
    "blocks": [
      {
        "type": "lead",
        "text": "You decide when to begin, adapt and stop."
      },
      {
        "type": "p",
        "text": "Prefer accessible everyday activities: meals, rest, chosen contact and a small task. The app does not offer diagnosis, prescriptions or emergency monitoring."
      },
      {
        "type": "list",
        "items": [
          "Do not use the app to change medication or replace care.",
          "Trauma reprocessing, exposure to painful reminders and structured clinical techniques need professional assessment and support.",
          "If a record substantially increases distress or causes disorientation, stop and seek support."
        ]
      },
      {
        "type": "note",
        "label": "Routes to support",
        "text": "In the United States, a primary care professional or a licensed mental health professional can discuss options, costs, and referrals. In Brazil, a UBS is an entry point to the public health system; CAPS offer care for intense distress and needs related to alcohol and other drugs. Availability and access depend on local services. If there is immediate danger or you cannot stay safe, seek emergency care and support from a trusted person. The app does not monitor crises in real time."
      }
    ]
  },
  {
    "id": "ativacao",
    "number": "04",
    "kicker": "YOUR PRACTICE",
    "title": "One small, possible act of care",
    "blocks": [
      {
        "type": "lead",
        "text": "A step can be small enough to fit your day."
      },
      {
        "type": "p",
        "text": "Choose something relevant and accessible: drink water, prepare a meal, open a document for a few minutes or rest. Adapt it to your physical condition, energy, accessibility and resources."
      },
      {
        "type": "fields",
        "title": "Optional personal record",
        "fields": [
          {
            "kind": "scale",
            "id": "acao-vontade",
            "label": "Desire to act"
          },
          {
            "kind": "scale",
            "id": "acao-desconforto-prev",
            "label": "Predicted discomfort"
          },
          {
            "kind": "text",
            "id": "acao-fiz",
            "label": "Did I complete the step? (yes / no)"
          },
          {
            "kind": "scale",
            "id": "acao-desconforto-pos",
            "label": "Discomfort (after)"
          },
          {
            "kind": "textarea",
            "id": "acao-aprendi",
            "label": "What I learned in one sentence"
          }
        ]
      }
    ]
  },
  {
    "id": "evitacao",
    "number": "05",
    "kicker": "YOUR PRACTICE",
    "title": "Reconnect with spaces at your pace",
    "blocks": [
      {
        "type": "lead",
        "text": "Plan contact with everyday life that feels wanted and safe to you."
      },
      {
        "type": "p",
        "text": "The steps below are optional examples, adaptable to mobility and surroundings. They are not an exposure protocol. If going out is connected to trauma, intense panic or real danger, speak with a professional before practising."
      },
      {
        "type": "ladder",
        "id": "ladder-saida",
        "head": [
          "Optional step",
          "How I feel",
          "Recorded"
        ],
        "rows": [
          {
            "id": "saida-1",
            "label": "Choose an accessible, safe place"
          },
          {
            "id": "saida-2",
            "label": "Plan how to get there or take part remotely"
          },
          {
            "id": "saida-3",
            "label": "Arrange support if I want it"
          },
          {
            "id": "saida-4",
            "label": "Make a brief, chosen contact"
          },
          {
            "id": "saida-5",
            "label": "Notice how I felt without pressure"
          },
          {
            "id": "saida-6",
            "label": "Decide whether to repeat, adapt or stop"
          }
        ]
      }
    ]
  },
  {
    "id": "autojulgamento",
    "number": "06",
    "kicker": "YOUR PRACTICE",
    "title": "Respond to self-criticism with care",
    "blocks": [
      {
        "type": "lead",
        "text": "A difficulty deserves context, care and a proportional response."
      },
      {
        "type": "p",
        "text": "Observe an everyday event you want to understand. If writing becomes repetitive reviewing that worsens distress, leave the record and seek another kind of support. Fatigue, illness, inequality and real limitations are not character flaws."
      },
      {
        "type": "fields",
        "fields": [
          {
            "kind": "textarea",
            "id": "julg-1",
            "label": "1. What happened, in your words?"
          },
          {
            "kind": "textarea",
            "id": "julg-2",
            "label": "2. What self-critical thought appeared?"
          },
          {
            "kind": "textarea",
            "id": "julg-3",
            "label": "3. What was difficult and what context matters?"
          },
          {
            "kind": "scale",
            "id": "julg-4",
            "label": "4. Impact I noticed, from 0 to 10"
          },
          {
            "kind": "textarea",
            "id": "julg-5",
            "label": "5. How would I support someone in this situation?"
          },
          {
            "kind": "textarea",
            "id": "julg-6",
            "label": "6. Is there anything concrete to repair?"
          },
          {
            "kind": "textarea",
            "id": "julg-7",
            "label": "7. What care or boundary do I need now?"
          }
        ],
        "title": "Optional personal record"
      },
      {
        "type": "fields",
        "fields": [
          {
            "kind": "textarea",
            "id": "julg-sentenca",
            "label": "A kinder, more realistic response"
          }
        ],
        "title": "Optional personal record"
      }
    ]
  },
  {
    "id": "desconfianca",
    "number": "07",
    "kicker": "YOUR PRACTICE",
    "title": "Safety, facts and boundaries",
    "blocks": [
      {
        "type": "lead",
        "text": "Use this record to organise what you noticed and think about support."
      },
      {
        "type": "p",
        "text": "You do not need to prove a threat or give up boundaries to deserve protection. In violence or abuse, prioritise safety and appropriate support. This exercise does not decide whether an account is true or assess who is trustworthy."
      },
      {
        "type": "fields",
        "fields": [
          {
            "kind": "textarea",
            "id": "desc-fato",
            "label": "Observed fact: what actually happened?"
          },
          {
            "kind": "textarea",
            "id": "desc-interp",
            "label": "Interpretation: what did I conclude?"
          },
          {
            "kind": "textarea",
            "id": "desc-prev",
            "label": "Prediction: what do I think they intend to do?"
          },
          {
            "kind": "textarea",
            "id": "desc-favor",
            "label": "Concrete evidence in favor"
          },
          {
            "kind": "textarea",
            "id": "desc-contra",
            "label": "Concrete evidence against"
          },
          {
            "kind": "textarea",
            "id": "desc-alt",
            "label": "Two alternative explanations (1 and 2)"
          },
          {
            "kind": "textarea",
            "id": "desc-protecao",
            "label": "What support or protection can I seek?"
          },
          {
            "kind": "text",
            "id": "desc-confianca",
            "label": "What boundary or condition of trust makes sense?"
          }
        ],
        "title": "Optional personal record"
      }
    ]
  },
  {
    "id": "vinculo",
    "number": "08",
    "kicker": "YOUR PRACTICE",
    "title": "Connections with consent and boundaries",
    "blocks": [
      {
        "type": "lead",
        "text": "Contact can be meaningful without requiring intimacy."
      },
      {
        "type": "p",
        "text": "Choose contact you want: a message, a community activity, a brief conversation or time with someone you trust. Respect your wishes and the other person's. Libraries, culture and community spaces may broaden possibilities, without an obligation to socialise."
      },
      {
        "type": "fields",
        "title": "Optional personal record",
        "fields": [
          {
            "kind": "textarea",
            "id": "vinc-esperava",
            "label": "Before I expected:"
          },
          {
            "kind": "textarea",
            "id": "vinc-aconteceu",
            "label": "What actually happened:"
          },
          {
            "kind": "textarea",
            "id": "vinc-julguei",
            "label": "How I judged myself afterward:"
          },
          {
            "kind": "textarea",
            "id": "vinc-confianca",
            "label": "Did their response increase, maintain, or reduce earned trust?"
          }
        ]
      }
    ]
  },
  {
    "id": "competencia",
    "number": "09",
    "kicker": "YOUR PRACTICE",
    "title": "Learn with support and record everyday life",
    "blocks": [
      {
        "type": "lead",
        "text": "Asking for help can be part of learning."
      },
      {
        "type": "p",
        "text": "Choose a possible task, divide it into steps and identify useful resources. Your worth does not depend on doing everything alone. Writing is optional: record only what you want to keep about the present, without describing traumatic memories."
      },
      {
        "type": "fields",
        "title": "Optional personal record",
        "fields": [
          {
            "kind": "text",
            "id": "comp-antes",
            "label": "Before: what support might I need?"
          },
          {
            "kind": "textarea",
            "id": "comp-tarefa",
            "label": "Task:"
          },
          {
            "kind": "textarea",
            "id": "comp-passo",
            "label": "Physical first step:"
          },
          {
            "kind": "text",
            "id": "comp-depois",
            "label": "After: what did I manage and what still needs support?"
          }
        ]
      },
      {
        "type": "fields",
        "title": "Optional personal record",
        "fields": [
          {
            "kind": "textarea",
            "id": "comp-escrita",
            "label": "Today's expressive writing"
          }
        ]
      }
    ]
  },
  {
    "id": "trabalho-1",
    "number": "10",
    "kicker": "YOUR PRACTICE",
    "title": "Work: needs and routes to support",
    "blocks": [
      {
        "type": "lead",
        "text": "Your work context also needs care."
      },
      {
        "type": "p",
        "text": "Organise demands, boundaries, resources and people who could support you. These are planning steps, without viewing traumatic reminders or forcing yourself back into harmful settings. If there is violence, harassment or persistent distress, consider health care and guidance about your rights."
      },
      {
        "type": "ladder",
        "id": "ladder-pistas",
        "head": [
          "Optional step",
          "How I feel",
          "Recorded"
        ],
        "rows": [
          {
            "id": "pista-1",
            "label": "Name a current need"
          },
          {
            "id": "pista-2",
            "label": "Identify a supportive person or service"
          },
          {
            "id": "pista-3",
            "label": "Explore a resource about health at work"
          },
          {
            "id": "pista-4",
            "label": "Draft a request or boundary"
          },
          {
            "id": "pista-5",
            "label": "Plan a conversation if it fits"
          }
        ]
      }
    ]
  },
  {
    "id": "trabalho-2",
    "number": "11",
    "kicker": "YOUR PRACTICE",
    "title": "Bring attention to the present",
    "blocks": [
      {
        "type": "lead",
        "text": "A brief pause can help you notice where you are."
      },
      {
        "type": "p",
        "text": "If comfortable, notice your surroundings and the support under your feet or body. You can name a few colours or sounds and choose what to do next. Adapt to your sensory needs; do not hold your breath or force relaxation. If attending to the body worsens the experience, stop and choose a simple external activity or supportive contact."
      },
      {
        "type": "fields",
        "title": "Optional personal record",
        "fields": [
          {
            "kind": "scale",
            "id": "expo-inicial",
            "label": "How I felt before (0–10)"
          },
          {
            "kind": "scale",
            "id": "expo-max",
            "label": "Highest intensity I noticed (0–10)"
          },
          {
            "kind": "scale",
            "id": "expo-final",
            "label": "How I feel now (0–10)"
          },
          {
            "kind": "textarea",
            "id": "expo-frase",
            "label": "What did I notice now and what could support me?"
          }
        ]
      }
    ]
  },
  {
    "id": "relacionamento-1",
    "number": "12",
    "kicker": "YOUR PRACTICE",
    "title": "Experiences, interpretations and relationships",
    "blocks": [
      {
        "type": "lead",
        "text": "You can understand a relationship without reliving every detail."
      },
      {
        "type": "p",
        "text": "Choose an everyday event that feels possible to consider now. Distinguish what happened, what it meant to you and what you expect of the future. Accounts of violence deserve support and protection, not forced confrontation or reconciliation. There is no need to open old messages or photos you do not want to revisit."
      },
      {
        "type": "fields",
        "title": "Optional personal record",
        "fields": [
          {
            "kind": "textarea",
            "id": "rel-fato",
            "label": "Observed fact"
          },
          {
            "kind": "textarea",
            "id": "rel-regra",
            "label": "Learned rule"
          },
          {
            "kind": "textarea",
            "id": "rel-conclusao",
            "label": "Conclusion about self"
          },
          {
            "kind": "textarea",
            "id": "rel-previsao",
            "label": "Prediction about the future"
          }
        ]
      }
    ]
  },
  {
    "id": "relacionamento-2",
    "number": "13",
    "kicker": "YOUR PRACTICE",
    "title": "Wishes and future possibilities",
    "blocks": [
      {
        "type": "lead",
        "text": "Your projects can differ from other people's."
      },
      {
        "type": "p",
        "text": "Friendships, partnership, family, study, work, community and time alone can have different meanings. No life arrangement, marital status, sexual orientation or gender identity determines your worth. Distinguish a wish from a guarantee; exploring a possibility, caring for a boundary or resting can be next steps."
      },
      {
        "type": "fields",
        "title": "Optional personal record",
        "fields": [
          {
            "kind": "textarea",
            "id": "rel2-desejo",
            "label": "What I genuinely desire:"
          },
          {
            "kind": "textarea",
            "id": "rel2-afirmar",
            "label": "What I can affirm today without pretending certainty:"
          }
        ]
      }
    ]
  },
  {
    "id": "pensamento-sentido",
    "number": "14",
    "kicker": "YOUR PRACTICE",
    "title": "Thoughts, emotions and what matters",
    "blocks": [
      {
        "type": "lead",
        "text": "Your records can open questions without requiring a perfect answer."
      },
      {
        "type": "p",
        "text": "This is an optional way to organise thoughts. If it does not fit you, try a conversation, a drawing or a free note. Ask what matters to you today and what small choice could express it. Values can be personal, cultural and collective; you do not need to adopt a belief to use the guide."
      },
      {
        "type": "fields",
        "title": "Optional personal record",
        "fields": [
          {
            "kind": "textarea",
            "id": "cog-situacao",
            "label": "Situation:"
          },
          {
            "kind": "textarea",
            "id": "cog-pensamento",
            "label": "Automatic thought:"
          },
          {
            "kind": "text",
            "id": "cog-emocao",
            "label": "Emotion / intensity:"
          },
          {
            "kind": "textarea",
            "id": "cog-favor",
            "label": "Evidence in favor:"
          },
          {
            "kind": "textarea",
            "id": "cog-contra",
            "label": "Evidence against:"
          },
          {
            "kind": "textarea",
            "id": "cog-resposta",
            "label": "Balanced, proportional response:"
          }
        ]
      }
    ]
  },
  {
    "id": "semana-1",
    "number": "15",
    "kicker": "YOUR PRACTICE",
    "title": "An adaptable week",
    "blocks": [
      {
        "type": "lead",
        "text": "The schedule should fit your life."
      },
      {
        "type": "p",
        "text": "These times and activities are editable examples. Choose workable days, make room for rest and reduce the plan if needed. There is no activity debt or obligation to make up a week. You can leave out activities and add everyday care, social support or an appointment."
      },
      {
        "type": "schedule",
        "id": "s1",
        "cols": [
          "16:30",
          "17:00",
          "21:30"
        ],
        "rows": [
          {
            "id": "s1-dom09",
            "day": "Preparation",
            "tasks": [
              "Choose one possible act of care",
              "—",
              "—"
            ]
          },
          {
            "id": "s1-seg10",
            "day": "Monday",
            "tasks": [
              "A short task",
              "A contact or pause",
              "Optional writing"
            ]
          },
          {
            "id": "s1-ter11",
            "day": "Tuesday",
            "tasks": [
              "Organise a work-related need",
              "Repeat chosen care",
              "—"
            ]
          },
          {
            "id": "s1-qua12",
            "day": "Wednesday",
            "tasks": [
              "Respond to self-criticism",
              "—",
              "Optional writing"
            ]
          },
          {
            "id": "s1-qui13",
            "day": "Thursday",
            "tasks": [
              "Reflect on a relationship",
              "A chosen contact",
              "—"
            ]
          },
          {
            "id": "s1-sex14",
            "day": "Friday",
            "tasks": [
              "Review boundaries and safety",
              "—",
              "—"
            ]
          },
          {
            "id": "s1-sab15",
            "day": "Saturday",
            "tasks": [
              "Learn with support",
              "Time to rest",
              "Optional writing"
            ]
          },
          {
            "id": "s1-dom16",
            "day": "Review",
            "tasks": [
              "A brief weekly reflection",
              "—",
              "—"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "semana-2",
    "number": "16",
    "kicker": "YOUR PRACTICE",
    "title": "Adjust with kindness",
    "blocks": [
      {
        "type": "lead",
        "text": "Repeating, changing or pausing are possible choices."
      },
      {
        "type": "p",
        "text": "Look at what helped, what was difficult and what conditions need to change. You do not need to increase difficulty automatically. Reducing tasks, seeking support or prioritising rest may be the next step."
      }
    ]
  },
  {
    "id": "revisao",
    "number": "17",
    "kicker": "YOUR PRACTICE",
    "title": "Notice, acknowledge and adjust",
    "blocks": [
      {
        "type": "lead",
        "text": "The week is an experience to understand, not a test to pass."
      },
      {
        "type": "p",
        "text": "Choose useful questions and leave the others. Also consider rest, external conditions and support received. Checks and scales are subjective records; they do not measure clinical improvement. Choose just one adjustment that seems possible for next week."
      },
      {
        "type": "fields",
        "title": "Optional personal record",
        "fields": [
          {
            "kind": "textarea",
            "id": "rev-evitacao",
            "label": "Choices — What became more accessible this week?"
          },
          {
            "kind": "textarea",
            "id": "rev-autojulgamento",
            "label": "Self-care — How did I respond to self-criticism?"
          },
          {
            "kind": "textarea",
            "id": "rev-desconfianca",
            "label": "Safety — What facts and boundaries did I consider?"
          },
          {
            "kind": "textarea",
            "id": "rev-isolamento",
            "label": "Connection — What contact felt meaningful to me?"
          },
          {
            "kind": "textarea",
            "id": "rev-competencia",
            "label": "Learning — What support and resources were useful?"
          },
          {
            "kind": "textarea",
            "id": "rev-trabalho",
            "label": "Work — What need or boundary did I recognise?"
          },
          {
            "kind": "textarea",
            "id": "rev-relacionamento",
            "label": "Relationships — Which generalization felt less absolute?"
          },
          {
            "kind": "textarea",
            "id": "rev-sentido",
            "label": "Values — What choice reflected what matters to me?"
          }
        ]
      }
    ]
  }
]

export const scheduleTaskIdsEn: string[] = sectionsEn.flatMap((s) => s.blocks.flatMap((b) => {
  if (b.type === "schedule") return b.rows.flatMap((r) => r.tasks.map((t, i) => t === "—" ? null : r.id + "-" + i).filter((x): x is string => x !== null))
  if (b.type === "ladder") return b.rows.map((r) => r.id)
  return []
}))

export const DEFAULT_GUIDE_TEMPLATE_EN: GuideTemplate = {
  "id": "my-recovery-guide",
  "title": "My Recovery Guide",
  "description": "A personal space for everyday care, reflection and support",
  "version": 2,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-10-12T00:00:00.000Z",
  "schemaVersion": 1,
  "contentLocale": "en-US",
  "config": {
    "targetAudience": "Adults aged 18 and older seeking to organize everyday care at their own pace",
    "category": "Everyday care and reflection"
  },
  "intro": introEn,
  "sections": sectionsEn,
  "scheduleTaskIds": scheduleTaskIdsEn,
  "weeklyPlan": [
    {
      "id": "act-0-1",
      "dayIndex": 0,
      "time": "16:30",
      "description": "Choose one act of care / short task",
      "order": 0,
      "countsTowardCompletion": true
    },
    {
      "id": "act-0-2",
      "dayIndex": 0,
      "time": "17:00",
      "description": "Chosen contact or a pause",
      "order": 1,
      "countsTowardCompletion": true
    },
    {
      "id": "act-0-3",
      "dayIndex": 0,
      "time": "21:30",
      "description": "Optional free writing",
      "order": 2,
      "countsTowardCompletion": true
    },
    {
      "id": "act-1-1",
      "dayIndex": 1,
      "time": "16:30",
      "description": "Organise a work-related need",
      "order": 0,
      "countsTowardCompletion": true
    },
    {
      "id": "act-1-2",
      "dayIndex": 1,
      "time": "17:00",
      "description": "Repeat chosen care",
      "order": 1,
      "countsTowardCompletion": true
    },
    {
      "id": "act-2-1",
      "dayIndex": 2,
      "time": "16:30",
      "description": "Reflect with kindness",
      "order": 0,
      "countsTowardCompletion": true
    },
    {
      "id": "act-2-2",
      "dayIndex": 2,
      "time": "21:30",
      "description": "Optional free writing",
      "order": 1,
      "countsTowardCompletion": true
    },
    {
      "id": "act-3-1",
      "dayIndex": 3,
      "time": "16:30",
      "description": "Reflect on a relationship",
      "order": 0,
      "countsTowardCompletion": true
    },
    {
      "id": "act-3-2",
      "dayIndex": 3,
      "time": "17:00",
      "description": "Chosen contact",
      "order": 1,
      "countsTowardCompletion": true
    },
    {
      "id": "act-4-1",
      "dayIndex": 4,
      "time": "16:30",
      "description": "Review boundaries and safety",
      "order": 0,
      "countsTowardCompletion": true
    },
    {
      "id": "act-5-1",
      "dayIndex": 5,
      "time": "16:30",
      "description": "Learn with support",
      "order": 0,
      "countsTowardCompletion": true
    },
    {
      "id": "act-5-2",
      "dayIndex": 5,
      "time": "17:00",
      "description": "Rest or a chosen activity",
      "order": 1,
      "countsTowardCompletion": true
    },
    {
      "id": "act-5-3",
      "dayIndex": 5,
      "time": "21:30",
      "description": "Optional free writing",
      "order": 2,
      "countsTowardCompletion": true
    },
    {
      "id": "act-6-1",
      "dayIndex": 6,
      "time": "16:30",
      "description": "A brief weekly reflection",
      "order": 0,
      "countsTowardCompletion": true
    }
  ],
  "quickSheets": [
    {
      "id": "qs-esquemas",
      "title": "Experience record",
      "summary": "Notice context, feelings and needs in your own words."
    },
    {
      "id": "qs-ativacao",
      "title": "Everyday care",
      "summary": "Plan one small, optional act of care that fits your day."
    }
  ],
  "theologyEnabled": false,
  "completionConfig": {
    "enabled": true,
    "reviewTitle": "Weekly Reflection",
    "analysisDimensions": [
      "Chosen activities and conditions for carrying them out",
      "Needs, feelings and context recorded voluntarily",
      "Rest, support and boundaries",
      "Changes the person wishes to make"
    ],
    "nextWeekFocusRules": [
      "Suggest optional, realistic adjustments without judging adherence",
      "Respect rest, support needs and the person's choices"
    ],
    "theologyReviewEnabled": false
  },
  "bibleVersion": null,
  "safetyNotes": [
    "Educational support and personal organisation; does not replace professional care.",
    "Activities are optional, adaptable and may be paused.",
    "The app does not provide diagnosis or emergency monitoring."
  ]
}
