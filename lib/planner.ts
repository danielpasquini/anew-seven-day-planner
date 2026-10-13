import type { GuideTemplate, Section } from "./guide-data"
import type { Locale } from "./date-utils"
import { isValidGuide } from "./backup-validation"

export type PlannerPresetId = "gentle" | "focus" | "balance" | "blank"
export type PlannerOptions = {
  name?: string
  goal?: string
  focus?: string
  intensity?: "very_light" | "light" | "moderate"
  instructions?: string
  routine?: string
  routineSchedule?: string
  thingsToAvoid?: string
  whatHelps?: string
  additionalNotes?: string
}

export const PLANNER_PRESETS = [
  { id: "gentle" as const, title: "A Gentle Start", description: "One small step each day, with room to rest." },
  { id: "balance" as const, title: "Everyday Balance", description: "A little space for daily tasks, connection, and rest." },
  { id: "focus" as const, title: "One Personal Goal", description: "Break a goal you choose into seven manageable steps." },
  { id: "blank" as const, title: "Start With a Blank Week", description: "Choose your own activities and sections." },
]

export function getPlannerPresets(locale: Locale = "en-US") {
  if (locale !== "pt-BR") return PLANNER_PRESETS
  const labels = [
    ["Um Começo Leve", "Um passo pequeno por dia, com espaço para descansar."],
    ["Equilíbrio Cotidiano", "Espaço para tarefas, conexão e descanso."],
    ["Um Objetivo Pessoal", "Divida um objetivo escolhido em sete passos possíveis."],
    ["Começar Com Uma Semana Vazia", "Escolha suas próprias atividades e seções."],
  ]
  return PLANNER_PRESETS.map((preset, index) => ({ ...preset, title: labels[index][0], description: labels[index][1] }))
}

export function plannerId(prefix = "planner"): string {
  const unique = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}-${unique}`
}

const clean = (value: string | undefined, max = 1200) => (value ?? "").trim().slice(0, max)

/** Deterministic content: presets never contact an AI service or infer personal details. */
export function buildPresetGuide(presetId: PlannerPresetId, locale: Locale = "en-US", options: PlannerOptions = {}): GuideTemplate {
  const preset = getPlannerPresets(locale).find((item) => item.id === presetId) ?? getPlannerPresets(locale)[0]
  const isEn = locale === "en-US"
  const id = plannerId()
  const goal = clean(options.goal || options.focus, 300)
  const title = clean(options.name, 100) || (presetId === "focus" && goal ? goal.slice(0, 100) : preset.title)
  const minutes = options.intensity === "moderate" ? 15 : options.intensity === "light" ? 10 : 5
  const gentle = isEn ? [
    "Choose one small task you can finish in a few minutes.",
    "Make a little space for a break you enjoy.",
    "Tidy one small area, then stop.",
    "Take one easy step toward something that matters to you.",
    "Choose a small way to connect, if you want to.",
    "Leave a little room for rest or something enjoyable.",
    "Notice one thing that helped and choose what to keep next week.",
  ] : [
    "Escolha uma tarefa pequena que caiba em poucos minutos.",
    "Abra um espaço para uma pausa agradável.",
    "Organize um cantinho e depois pare.",
    "Dê um passo possível em algo importante para você.",
    "Escolha uma pequena conexão, se quiser.",
    "Reserve um espaço para descanso ou algo agradável.",
    "Observe algo que ajudou e escolha o que manter na próxima semana.",
  ]
  const balance = isEn ? [
    "Choose one useful task for today.", "Make time for a meal or a break that fits your day.",
    "Put one everyday item or small space in order.", "Take a short movement or outdoor break, if accessible.",
    "Reach out to someone you choose, if you want to.", "Spend a few minutes on something enjoyable.",
    "Review what fit your week and leave room for next week's priorities.",
  ] : [
    "Escolha uma tarefa útil para hoje.", "Reserve um momento para uma refeição ou pausa possível.",
    "Organize um objeto ou espaço pequeno do cotidiano.", "Faça uma pausa breve de movimento ou ao ar livre, se for acessível.",
    "Converse com alguém escolhido, se quiser.", "Dedique alguns minutos a algo agradável.",
    "Revise o que coube na semana e abra espaço para as próximas prioridades.",
  ]
  const focus = isEn ? [
    `Choose one small, concrete step${goal ? ` toward ${goal}` : " toward your goal"}.`,
    "Prepare one thing you need for that step.", `Try the first step for about ${minutes} minutes.`,
    "Pause and adjust the step to fit your available time.", "Repeat or continue one manageable part.",
    "Choose rest or one optional small step.", "Notice what moved forward and choose a next step for next week.",
  ] : [
    `Escolha um passo pequeno e concreto${goal ? ` em direção a ${goal}` : " para seu objetivo"}.`,
    "Prepare algo necessário para esse passo.", `Experimente o primeiro passo por cerca de ${minutes} minutos.`,
    "Faça uma pausa e adapte o passo ao tempo disponível.", "Repita ou continue uma parte possível.",
    "Escolha descansar ou dar mais um pequeno passo opcional.", "Observe o que avançou e escolha um passo para a próxima semana.",
  ]
  const tasks = presetId === "blank" ? [] : presetId === "focus" ? focus : presetId === "balance" ? balance : gentle
  const weeklyPlan = tasks.map((description, dayIndex) => ({
    id: `${id}-day-${dayIndex + 1}`, dayIndex, time: "09:00", description, order: 0, countsTowardCompletion: true,
  }))
  const note = isEn ? "Every step is optional. Change the suggested time, make it smaller, or skip it." : "Todos os passos são opcionais. Mude o horário sugerido, reduza ou pule uma atividade."
  const sections: Section[] = [{
    id: `${id}-notes`, number: "01", kicker: isEn ? "OPTIONAL" : "OPCIONAL",
    title: isEn ? "A Little Room for Notes" : "Um Espaço Para Anotações",
    blocks: [{ type: "note", text: note }, { type: "fields", fields: [
      { kind: "textarea", id: `${id}-notes-field`, label: isEn ? "Anything you want to keep in mind this week" : "Algo que você deseja lembrar nesta semana" },
    ] }],
  }]
  const preferences = [
    [isEn ? "Your goal" : "Seu objetivo", goal],
    [isEn ? "Your routine" : "Sua rotina", clean(options.routine || options.routineSchedule)],
    [isEn ? "What helps" : "O que ajuda", clean(options.whatHelps)],
    [isEn ? "Things to avoid" : "O que evitar", clean(options.thingsToAvoid)],
    [isEn ? "Your instructions" : "Suas instruções", clean(options.instructions)],
    [isEn ? "Additional notes" : "Anotações adicionais", clean(options.additionalNotes)],
  ].filter(([, value]) => value)
  if (preferences.length) sections.push({
    id: `${id}-preferences`, number: "02", kicker: isEn ? "YOUR CHOICES" : "SUAS ESCOLHAS",
    title: isEn ? "Your Preferences" : "Suas Preferências",
    blocks: preferences.map(([label, text]) => ({ type: "note" as const, label, text })),
  })
  const now = new Date().toISOString()
  return {
    id, title, description: preset.description, version: 1, schemaVersion: 1, createdAt: now, updatedAt: now,
    contentLocale: locale, theologyEnabled: false, bibleVersion: null,
    config: { category: isEn ? "Seven-day planner" : "Planejador de sete dias" },
    intro: { title, subtitle: isEn ? "Seven days. Small steps. Your pace." : "Sete dias. Pequenos passos. Seu ritmo.", oracao: "", salmo: { ref: "", ara: "", nvt: "", kjv: "", niv: "" } },
    sections, weeklyPlan, scheduleTaskIds: weeklyPlan.map((task) => task.id), quickSheets: [],
    completionConfig: { enabled: true, reviewTitle: isEn ? "A Look Back at Your Week" : "Um Olhar Para Sua Semana", analysisDimensions: [isEn ? "What fit your week" : "O que coube na sua semana"], nextWeekFocusRules: [isEn ? "Keep next week's steps small and optional" : "Mantenha os próximos passos pequenos e opcionais"], theologyReviewEnabled: false },
    safetyNotes: [isEn ? "A personal planner; activities are optional and adaptable." : "Um planejador pessoal; as atividades são opcionais e adaptáveis."],
  }
}

export function createPlannerGuide(options: PlannerOptions & { preset?: PlannerPresetId; locale?: Locale } = {}) {
  return buildPresetGuide(options.preset ?? "gentle", options.locale ?? "en-US", options)
}

/** Preserve field IDs and existing answers; only a valid complete revision can be saved. */
export function reviseGuideSections(guide: GuideTemplate, sections: Section[]): GuideTemplate | null {
  const revision = {
    ...guide, customized: true, version: guide.version + 1, updatedAt: new Date().toISOString(),
    sections: sections.map((section, index) => ({ ...section, number: String(index + 1).padStart(2, "0") })),
  }
  return isValidGuide(revision) ? JSON.parse(JSON.stringify(revision)) as GuideTemplate : null
}

/** Stable fixture for a first-visit preview; saving always requires a separate choice. */
export function createStarterGuide(locale: Locale = "en-US"): GuideTemplate {
  const guide = buildPresetGuide("gentle", locale, { name: locale === "en-US" ? "A Small Start" : "Um Pequeno Começo" })
  const oldId = guide.id
  const id = `anew-starter-${locale}`
  const remap = (value: unknown): unknown => typeof value === "string" ? value.replaceAll(oldId, id)
    : Array.isArray(value) ? value.map(remap)
      : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, remap(child)])) : value
  return { ...(remap(guide) as GuideTemplate), createdAt: "2026-10-12T00:00:00.000Z", updatedAt: "2026-10-12T00:00:00.000Z" }
}
