import { ptBR } from "./pt-BR"
import { enUS } from "./en-US"
import type { Locale, TranslationDictionary } from "./types"
import { titleCase } from "../title-case"

export * from "./types"
export { ptBR, enUS }

function withDisplayTitles(dictionary: TranslationDictionary): TranslationDictionary {
  const visit = (value: unknown, parent = ""): unknown => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return value
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key,
      typeof child === "string" && (/(title|label)$/i.test(key) || parent === "nav" || parent === "tabs") ? titleCase(child) : visit(child, key),
    ]))
  }
  return visit(dictionary) as TranslationDictionary
}

export const DICTIONARIES: Record<Locale, TranslationDictionary> = {
  "pt-BR": withDisplayTitles(ptBR),
  "en-US": withDisplayTitles(enUS),
}

export function getDictionary(locale: Locale = "en-US"): TranslationDictionary {
  return DICTIONARIES[locale] || DICTIONARIES["en-US"]
}
