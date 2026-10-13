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
