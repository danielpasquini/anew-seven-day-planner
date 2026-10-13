/** Public credentials for synthetic, memory-only demos. Never an Auth identity. */
export const TEST_EMAIL = "tester@anew.local"
export const TEST_PASSWORD = "AnewPreview2026!"
export function matchesTestAccess(email: string, password: string): boolean {
  return typeof email === "string" && typeof password === "string" && email.trim().toLowerCase() === TEST_EMAIL && password === TEST_PASSWORD
}
