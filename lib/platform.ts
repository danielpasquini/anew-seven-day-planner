/** Browser helpers only. The Expo app uses its own native implementations. */
export function isNativePlatform(): boolean {
  return false
}

export const isNativeApp = isNativePlatform

/** Downloads a user-requested backup in the web application. */
export async function saveTextFile(filename: string, contents: string, mime = "application/json"): Promise<void> {
  const href = URL.createObjectURL(new Blob([contents], { type: `${mime};charset=utf-8` }))
  const link = document.createElement("a")
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}

export async function openExternalUrl(url: string): Promise<void> {
  const target = new URL(url)
  if (target.protocol !== "https:") throw new Error("Only secure resource links are supported.")
  window.open(target.href, "_blank", "noopener,noreferrer")
}
