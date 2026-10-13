export type OnboardingQuote = {
  id: string
  text: string
  author: string
  sourceTitle: string
  sourceUrl: string
  sourceLocation: string
  year?: number
  context: string
  verifiedAt: string
  verification: string
  verificationUrl: string
}

// Attributed excerpts for optional reflection, not universal clinical consensus,
// recommendations of a therapy, or endorsements of this application.
// Each source contributes fewer than 25 quoted words.
export const ONBOARDING_QUOTES: OnboardingQuote[] = [
  {
    "id": "neff-kindness",
    "text": "With self-compassion, we give ourselves the same kindness and support we’d give to a good friend",
    "author": "Kristin Neff",
    "sourceTitle": "Self-Compassion.org",
    "sourceUrl": "https://self-compassion.org/",
    "sourceLocation": "Homepage introductory heading (publication date not stated).",
    "context": "A description of self-compassion from the author's website, offered for optional reflection rather than as a therapy recommendation.",
    "verifiedAt": "2026-10-12",
    "verification": "Author's original English website opened; wording checked directly.",
    "verificationUrl": "https://self-compassion.org/"
  },
  {
    "id": "james-attention",
    "text": "My experience is what I agree to attend to.",
    "author": "William James",
    "sourceTitle": "The Principles of Psychology, Volume I",
    "sourceUrl": "https://www.gutenberg.org/cache/epub/57628/pg57628-images.html#Page_402",
    "sourceLocation": "Chapter XI, “Attention,” p. 402 (1890; 1918 reprint).",
    "year": 1890,
    "context": "A historical observation about selective attention, not a claim that people choose their distress.",
    "verifiedAt": "2026-10-12",
    "verification": "Original English text opened in Project Gutenberg.",
    "verificationUrl": "https://psychclassics.yorku.ca/James/Principles/prin11.htm"
  }
]
