import { isValidGuide } from "./backup-validation"
import type { GuideTemplate } from "./guide-data"

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">
export const onboardingDraftKey = (uid: string) => `anew-onboarding-guide-v1:${uid}`

/** Only the derived guide is staged, after the account's acknowledgements. */
export function stageOnboardingGuide(storage: DraftStorage, uid: string, guide: GuideTemplate): boolean {
  if (!isValidGuide(guide) || !guide.id.startsWith("anew-personal-v1-") || guide.theologyEnabled || guide.contentLocale !== "en-US") return false
  // Even a corrupt existing workspace belongs to its owner and needs recovery.
  if (storage.getItem(`guia-retomada-v2:${uid}`) !== null) return false
  storage.setItem(onboardingDraftKey(uid), JSON.stringify(guide))
  return true
}

export function readOnboardingGuide(storage: DraftStorage, uid: string): GuideTemplate | null {
  try {
    const raw = storage.getItem(onboardingDraftKey(uid))
    if (!raw || raw.length > 2_000_000) return null
    const guide: unknown = JSON.parse(raw)
    return isValidGuide(guide) && guide.id.startsWith("anew-personal-v1-") && guide.contentLocale === "en-US" && !guide.theologyEnabled ? guide : null
  } catch { return null }
}
