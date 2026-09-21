import { ptBR } from "./pt-BR"
import { enUS } from "./en-US"
import type { Locale, TranslationDictionary } from "./types"

export * from "./types"
export { ptBR, enUS }

export const DICTIONARIES: Record<Locale, TranslationDictionary> = {
  "pt-BR": ptBR,
  "en-US": enUS,
}

export function getDictionary(locale: Locale = "pt-BR"): TranslationDictionary {
  return DICTIONARIES[locale] || DICTIONARIES["pt-BR"]
}
