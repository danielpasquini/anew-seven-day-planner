import type { Locale } from "./date-utils"

type Option = { id: string; en: string; pt: string }
export const WEEK_OPTIONS = {
  burdens: [
    { id: "worry", en: "Worry or overthinking", pt: "Preocupação ou pensamentos repetitivos" },
    { id: "overwhelm", en: "Feeling overwhelmed", pt: "Sensação de sobrecarga" },
    { id: "low-energy", en: "Low energy", pt: "Pouca energia" },
    { id: "low-motivation", en: "Low motivation", pt: "Pouca motivação" },
    { id: "self-criticism", en: "Harsh self-talk", pt: "Autocrítica excessiva" },
    { id: "focus", en: "Difficulty focusing", pt: "Dificuldade de concentração" },
    { id: "low-mood", en: "Feeling low", pt: "Desânimo" },
    { id: "other", en: "Other:", pt: "Outro:" },
  ],
  discipline: [
    { id: "starting", en: "Starting tasks", pt: "Começar tarefas" },
    { id: "consistency", en: "Keeping a routine", pt: "Manter uma rotina" },
    { id: "study-work", en: "Study or work rhythm", pt: "Ritmo de estudo ou trabalho" },
    { id: "distractions", en: "Reducing distractions", pt: "Reduzir distrações" },
    { id: "sleep", en: "A sleep routine", pt: "Rotina de sono" },
    { id: "movement", en: "Accessible movement", pt: "Movimento acessível" },
    { id: "rest", en: "Making room for rest", pt: "Abrir espaço para descanso" },
    { id: "other", en: "Other:", pt: "Outro:" },
  ],
  psychology: [
    { id: "none", en: "No preference", pt: "Sem preferência" },
    { id: "cognitive-behavioral", en: "Cognitive and behavioral", pt: "Cognitiva e comportamental" },
    { id: "acceptance-mindfulness", en: "Acceptance and mindfulness", pt: "Aceitação e atenção plena" },
    { id: "humanistic", en: "Humanistic / person-centered", pt: "Humanista / centrada na pessoa" },
    { id: "psychodynamic", en: "Psychodynamic", pt: "Psicodinâmica" },
    { id: "schema", en: "Schema-informed", pt: "Orientada por esquemas" },
    { id: "existential", en: "Existential", pt: "Existencial" },
    { id: "integrative", en: "Integrative", pt: "Integrativa" },
    { id: "other", en: "Other:", pt: "Outra:" },
  ],
  theology: [
    { id: "none", en: "No specific tradition", pt: "Sem tradição específica" },
    { id: "christianity", en: "Christianity", pt: "Cristianismo" },
    { id: "judaism", en: "Judaism", pt: "Judaísmo" },
    { id: "islam", en: "Islam", pt: "Islã" },
    { id: "buddhism", en: "Buddhism", pt: "Budismo" },
    { id: "hinduism", en: "Hinduism", pt: "Hinduísmo" },
    { id: "nonreligious-spirituality", en: "Spirituality without religion", pt: "Espiritualidade sem religião" },
    { id: "other", en: "Other:", pt: "Outra:" },
  ],
} satisfies Record<string, Option[]>

export type WeekOptionGroup = keyof typeof WEEK_OPTIONS

export function getWeekOptions(group: WeekOptionGroup, locale: Locale = "en-US") {
  return WEEK_OPTIONS[group].map((option) => ({ id: option.id, label: locale === "pt-BR" ? option.pt : option.en }))
}

export function getWeekOptionHeading(group: WeekOptionGroup, locale: Locale = "en-US") {
  const headings = {
    burdens: { en: "What Could Make This Week Harder?", pt: "O que pode tornar esta semana mais difícil?" },
    discipline: { en: "Habits and Routines", pt: "Hábitos e rotinas" },
    psychology: { en: "Psychology Interests", pt: "Interesses em psicologia" },
    theology: { en: "Spirituality or Theology", pt: "Espiritualidade ou teologia" },
  }
  return locale === "pt-BR" ? headings[group].pt : headings[group].en
}

export function getPsychologyHelpIntro(locale: Locale = "en-US") {
  return locale === "pt-BR"
    ? "São interesses opcionais. Escolher uma opção não seleciona uma terapia nem avalia sua saúde. Mantenha Sem preferência se não tiver certeza."
    : "These are optional interests. Choosing one does not select therapy or assess your health. Keep No preference if you are unsure."
}

/** Educational descriptions, shown only when the user asks for help choosing. */
export function getPsychologyDescriptions(locale: Locale = "en-US") {
  const descriptions: Record<string, { en: string; pt: string }> = {
    none: { en: "Leave this selected if you are unsure or have no particular approach in mind.", pt: "Mantenha esta opção se não tiver certeza ou não tiver uma abordagem específica em mente." },
    "cognitive-behavioral": { en: "How thoughts, feelings, and actions influence one another.", pt: "Como pensamentos, sentimentos e ações influenciam uns aos outros." },
    "acceptance-mindfulness": { en: "Making room for thoughts and feelings while noticing the present.", pt: "Abrir espaço para pensamentos e sentimentos enquanto observa o presente." },
    humanistic: { en: "Your own perspective, choices, and capacity for growth.", pt: "Sua própria perspectiva, escolhas e capacidade de crescimento." },
    psychodynamic: { en: "Patterns in feelings and relationships, including influences you may not notice.", pt: "Padrões nos sentimentos e relacionamentos, incluindo influências que você talvez não perceba." },
    schema: { en: "Recurring patterns in beliefs, feelings, and relationships.", pt: "Padrões recorrentes nas crenças, sentimentos e relacionamentos." },
    existential: { en: "Personal meaning, freedom, and choices.", pt: "Significado pessoal, liberdade e escolhas." },
    integrative: { en: "Ideas drawn from more than one psychological approach.", pt: "Ideias de mais de uma abordagem psicológica." },
    other: { en: "Another approach or style you would like to name.", pt: "Outra abordagem ou estilo que você gostaria de nomear." },
  }
  return getWeekOptions("psychology", locale).map((option) => ({ ...option,
    description: locale === "pt-BR" ? descriptions[option.id].pt : descriptions[option.id].en,
  }))
}

/** Only explicitly selected preferences become profile text. Other text stays inert until selected. */
export function selectedWeekPreference(group: WeekOptionGroup, selected: string | string[] | undefined, other = "", locale: Locale = "en-US"): string {
  const ids = new Set(Array.isArray(selected) ? selected : selected ? [selected] : [])
  return getWeekOptions(group, locale).filter((option) => ids.has(option.id) && option.id !== "none")
    .map((option) => option.id === "other" ? other.trim() : option.label).filter(Boolean).join("; ")
}

export function selectedSpiritualPreference(enabled: boolean | undefined, selected = "none", other = "", locale: Locale = "en-US"): string {
  if (!enabled) return ""
  return selectedWeekPreference("theology", selected, other, locale)
    || (selected === "other" ? locale === "pt-BR" ? "Outro (não especificado)" : "Other (not specified)"
      : getWeekOptions("theology", locale).find((option) => option.id === "none")!.label)
}
