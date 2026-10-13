/** Capitalize title words without lowercasing acronyms, brands, or stored user text. */
export function titleCase(value: string): string {
  return value.replace(/(^|[\s\u00b7\u2014/-])([\p{L}][\p{L}\p{N}'’]*)/gu, (_, separator: string, word: string) => {
    if (/^\p{Ll}.*\p{Lu}/u.test(word)) return separator + word
    return separator + word[0].toLocaleUpperCase() + word.slice(1)
  })
}
