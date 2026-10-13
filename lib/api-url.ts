import { isNativePlatform } from "./platform"

/** Resolves only this app's API paths; native builds fail closed without a configured HTTPS backend. */
export function resolveApiUrl(path: string, base: string | undefined, native: boolean): string | null {
  if (!/^\/api\/[a-z0-9/-]+$/i.test(path)) return null
  const configuredBase = base?.trim()
  if (!configuredBase) return native ? null : path
  try {
    const url = new URL(configuredBase)
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") return null
    return `${url.origin}${path}`
  } catch { return null }
}

export function apiUrl(path: string): string | null {
  return resolveApiUrl(path, process.env.NEXT_PUBLIC_API_BASE_URL, isNativePlatform())
}
