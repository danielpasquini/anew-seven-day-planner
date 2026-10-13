export type ResourceCategory = "care" | "self-care" | "learning" | "rights" | "community"

// Region identifies the publisher's jurisdiction, not eligibility for its services.
export type ResourceRegion = "US" | "UK" | "AU" | "international"

export type FreeResource = {
  id: string
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  provider: string
  url: string
  category: ResourceCategory
  region: ResourceRegion
  languages: ("en")[]
  format: "service" | "guide" | "library" | "course" | "tool"
  access: string
  accessEn?: string
  tags: string[]
  approach?: string
  approachEn?: string
  verifiedAt: string
  verification: "opened" | "official-reference"
}

export const RESOURCE_CATEGORIES: { id: ResourceCategory; label: string; labelEn: string }[] = [
  { id: "care", label: "Find care", labelEn: "Find care" },
  { id: "self-care", label: "Everyday care", labelEn: "Everyday care" },
  { id: "learning", label: "Learn and research", labelEn: "Learn and research" },
  { id: "rights", label: "Rights and autonomy", labelEn: "Rights and autonomy" },
  { id: "community", label: "Support and community", labelEn: "Support and community" },
]

export const RESOURCE_LIBRARY_NOTE = "Free English information for learning, everyday support, and personal choice. No therapy approach is ranked. Reading does not replace professional care. Publisher regions describe the source, not service eligibility. External sites have their own privacy and access rules."
export const RESOURCE_LIBRARY_NOTE_EN = RESOURCE_LIBRARY_NOTE

// Curated English destinations reviewed on 12 October 2026; availability can change.
// "opened" means English content was read or fetched. "official-reference" means
// the publisher's indexed English content was checked but automated access was blocked.
// Link to publications rather than copying or adapting licensed material.
export const FREE_RESOURCES: FreeResource[] = [
  {
    "id": "who-stress",
    "title": "WHO: Doing what matters in times of stress",
    "description": "An illustrated guide with optional practices for stress, attention, values, and responding to difficult thoughts.",
    "provider": "World Health Organization",
    "url": "https://www.who.int/publications/i/item/9789240003927",
    "category": "self-care",
    "region": "international",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "Free English PDF and English audio exercises from the publication page. Choose practices that fit your circumstances.",
    "tags": [
      "stress",
      "values",
      "audio",
      "everyday care"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "who-recovery",
    "title": "WHO: planning your own recovery and support",
    "description": "A person-centered tool for reflecting on wishes, goals, support networks, and a personal wellness plan.",
    "provider": "World Health Organization",
    "url": "https://www.who.int/publications/i/item/9789241516822",
    "category": "self-care",
    "region": "international",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "Free English publication. You can use it on your own or choose support from someone you trust.",
    "tags": [
      "autonomy",
      "support network",
      "goals",
      "recovery"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "who-qualityrights",
    "title": "WHO QualityRights: autonomy and inclusion",
    "description": "Learn about rights, supported decision-making, inclusion, and alternatives to coercion in mental health care.",
    "provider": "World Health Organization",
    "url": "https://www.who.int/teams/mental-health-and-substance-use/policy-law-rights/QualityRights",
    "category": "rights",
    "region": "international",
    "languages": [
      "en"
    ],
    "format": "course",
    "access": "The English QualityRights course is free through WHO Academy and requires registration. The linked English page provides the course entry.",
    "tags": [
      "rights",
      "autonomy",
      "inclusion",
      "course"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "who-human-rights",
    "title": "WHO: mental health and human rights",
    "description": "Questions and answers about dignity, discrimination, autonomy, and rights in mental health support.",
    "provider": "World Health Organization",
    "url": "https://www.who.int/news-room/questions-and-answers/item/mental-health-promoting-and-protecting-human-rights",
    "category": "rights",
    "region": "international",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "Free English reading. An international overview; local legal procedures depend on your jurisdiction.",
    "tags": [
      "rights",
      "dignity",
      "discrimination",
      "choice"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "apa-approaches",
    "title": "APA: different approaches to psychotherapy",
    "description": "An introduction to psychodynamic, behavioral, cognitive, humanistic, and integrative approaches, without choosing one for you.",
    "provider": "American Psychological Association",
    "url": "https://www.apa.org/topics/psychotherapy/approaches",
    "category": "learning",
    "region": "US",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "Free English reading. Use it to prepare questions about a professional's approach, goals, and fit.",
    "tags": [
      "psychotherapy",
      "psychodynamic",
      "humanistic",
      "cognitive",
      "integrative"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "apa-therapy-process",
    "title": "APA: what to ask about psychotherapy",
    "description": "Learn about choosing a psychologist, discussing goals, the therapy process, and asking about cost and confidentiality.",
    "provider": "American Psychological Association",
    "url": "https://www.apa.org/topics/psychotherapy/understanding",
    "category": "care",
    "region": "US",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "The English article is free. Appointments, insurance, and payment arrangements vary; its service context is the United States.",
    "tags": [
      "therapy",
      "questions",
      "professional care",
      "confidentiality"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "apa-racism",
    "title": "APA: racism, bias, and discrimination",
    "description": "Explore psychological research and public information about racism, bias, discrimination, and their social context.",
    "provider": "American Psychological Association",
    "url": "https://www.apa.org/topics/racism-bias-discrimination",
    "category": "learning",
    "region": "US",
    "languages": [
      "en"
    ],
    "format": "library",
    "access": "Free English topic page with linked resources. Linked publications can have different access conditions.",
    "tags": [
      "culture",
      "racism",
      "discrimination",
      "social context"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "nih-emotional",
    "title": "NIH: emotional wellness toolkit",
    "description": "Printable checklists and reading on emotions, rest, grief, stress, and support in everyday life.",
    "provider": "National Institutes of Health",
    "url": "https://www.nih.gov/health-information/your-healthiest-self-wellness-toolkits/emotional-wellness-toolkit",
    "category": "self-care",
    "region": "US",
    "languages": [
      "en"
    ],
    "format": "tool",
    "access": "Free English page and printable checklists; no account is required. Adapt ideas to your health, accessibility, and circumstances.",
    "tags": [
      "emotions",
      "rest",
      "grief",
      "checklists"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "nih-social",
    "title": "NIH: social wellness toolkit",
    "description": "Ideas and printable checklists about supportive relationships, caregiving, community, and boundaries.",
    "provider": "National Institutes of Health",
    "url": "https://www.nih.gov/health-information/your-healthiest-self-wellness-toolkits/social-wellness-toolkit",
    "category": "community",
    "region": "US",
    "languages": [
      "en"
    ],
    "format": "tool",
    "access": "Free English page and printable checklists; no account is required. Local activities and support groups may have their own conditions.",
    "tags": [
      "relationships",
      "caregiving",
      "community",
      "boundaries"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "nimh-care",
    "title": "NIMH: caring for your mental health",
    "description": "Public information about everyday care and discussing distress or changes in daily functioning with a professional.",
    "provider": "National Institute of Mental Health / NIH",
    "url": "https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health",
    "category": "learning",
    "region": "US",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "Free English reading. Services and contact routes described on the external site refer to the United States.",
    "tags": [
      "mental health",
      "everyday care",
      "professional support"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "nimh-provider",
    "title": "NIMH: prepare for a health care conversation",
    "description": "Suggestions for preparing questions, describing concerns in your own words, and discussing care options during an appointment.",
    "provider": "National Institute of Mental Health / NIH",
    "url": "https://www.nimh.nih.gov/health/publications/tips-for-talking-with-your-health-care-provider",
    "category": "care",
    "region": "US",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "Free English publication. Reading is open; access to appointments and referrals depends on local providers.",
    "tags": [
      "appointments",
      "questions",
      "communication",
      "health care"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "medlineplus",
    "title": "MedlinePlus: understanding mental health",
    "description": "Public explanations and references about mental health, life circumstances, and options for support.",
    "provider": "National Library of Medicine / NIH",
    "url": "https://medlineplus.gov/mentalhealth.html",
    "category": "learning",
    "region": "US",
    "languages": [
      "en"
    ],
    "format": "library",
    "access": "Free English topic page. Follow each linked provider's access and regional conditions.",
    "tags": [
      "mental health",
      "education",
      "health information"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "pubmed",
    "title": "PubMed: English research with free full text",
    "description": "Explore mental health studies using a search restricted to English publications with free full-text links. A study does not choose care for an individual.",
    "provider": "National Library of Medicine / NIH",
    "url": "https://pubmed.ncbi.nlm.nih.gov/?term=mental%20health%20AND%20english%5Blang%5D%20AND%20free%20full%20text%5Bsb%5D",
    "category": "learning",
    "region": "US",
    "languages": [
      "en"
    ],
    "format": "library",
    "access": "Search is free. Open a result's free publisher or PMC full-text link; changing the search can remove the English or free-access restrictions.",
    "tags": [
      "research",
      "evidence",
      "English full text",
      "open access"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "nhs-everymind",
    "title": "NHS Every Mind Matters: everyday wellbeing",
    "description": "A starting point for English information about stress, worry, mood, sleep, and everyday wellbeing.",
    "provider": "NHS",
    "url": "https://www.nhs.uk/every-mind-matters/",
    "category": "self-care",
    "region": "UK",
    "languages": [
      "en"
    ],
    "format": "library",
    "access": "Free English reading. NHS services and referral instructions are UK-specific; access to care is not implied.",
    "tags": [
      "wellbeing",
      "stress",
      "worry",
      "everyday care"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "nhs-sleep",
    "title": "NHS: sleep and rest",
    "description": "Read about factors that affect sleep and possible adjustments to a rest routine.",
    "provider": "NHS",
    "url": "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/how-to-fall-asleep-faster-and-sleep-better/",
    "category": "self-care",
    "region": "UK",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "Free English reading. Adapt suggestions to your health and circumstances; UK service references do not guarantee local access.",
    "tags": [
      "sleep",
      "rest",
      "routine"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "nhs-work",
    "title": "NHS: work-related stress",
    "description": "Information about work demands, stress, support, and conversations about what you need at work.",
    "provider": "NHS",
    "url": "https://www.nhs.uk/every-mind-matters/lifes-challenges/work-related-stress/",
    "category": "self-care",
    "region": "UK",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "Free English reading. Workplace services and legal context mentioned are British; check local arrangements in Brazil or the United States.",
    "tags": [
      "work",
      "stress",
      "support",
      "boundaries"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "nhs-helping-others",
    "title": "NHS: supporting someone else",
    "description": "Ideas for listening, offering practical support, and looking after yourself while supporting another person.",
    "provider": "NHS",
    "url": "https://www.nhs.uk/every-mind-matters/supporting-others/helping-others/",
    "category": "community",
    "region": "UK",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "Free English reading. You can adapt everyday suggestions; NHS care routes are UK-specific.",
    "tags": [
      "listening",
      "support",
      "caregiving",
      "relationships"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "cci-compassion",
    "title": "CCI: self-compassion and self-criticism",
    "description": "English modules and worksheets for understanding self-criticism and exploring more caring responses to your experience.",
    "provider": "Centre for Clinical Interventions / WA Health",
    "url": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Self-Compassion",
    "category": "self-care",
    "region": "AU",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "Free English PDFs. Practices are optional; pause anything uncomfortable. These materials do not provide individual therapy.",
    "tags": [
      "self-compassion",
      "self-criticism",
      "worksheets"
    ],
    "approach": "Compassion practices and cognitive and behavioral resources",
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "cci-procrastination",
    "title": "CCI: procrastination and getting started",
    "description": "Worksheets about delaying tasks, planning manageable actions, and responding to self-criticism when getting started.",
    "provider": "Centre for Clinical Interventions / WA Health",
    "url": "https://www.cci.health.wa.gov.au/en/Resources/Looking-After-Yourself/Procrastination",
    "category": "self-care",
    "region": "AU",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "Free English PDFs. Choose useful ideas and account for disability, workload, and material barriers rather than treating every delay as a personal failing.",
    "tags": [
      "procrastination",
      "planning",
      "tasks",
      "worksheets"
    ],
    "approach": "Cognitive and behavioral resources",
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "cci-assertiveness",
    "title": "CCI: communication and boundaries",
    "description": "Information sheets and worksheets about expressing needs, saying no, and communication styles.",
    "provider": "Centre for Clinical Interventions / WA Health",
    "url": "https://www.cci.health.wa.gov.au/en/Resources/Looking-After-Yourself/Assertiveness",
    "category": "self-care",
    "region": "AU",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "Free English PDFs. Adapt examples to culture and safety; assertiveness exercises are optional and are not an instruction to confront an unsafe person.",
    "tags": [
      "communication",
      "boundaries",
      "needs",
      "worksheets"
    ],
    "approach": "Cognitive and behavioral resources",
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "mind-everyday",
    "title": "Mind: everyday life and support",
    "description": "Read about relationships, work, money, and everyday challenges across different mental health experiences.",
    "provider": "Mind",
    "url": "https://www.mind.org.uk/information-support/tips-for-everyday-living/",
    "category": "self-care",
    "region": "UK",
    "languages": [
      "en"
    ],
    "format": "library",
    "access": "Free English reading. Information about services and rights refers to the United Kingdom; local arrangements vary.",
    "tags": [
      "relationships",
      "money",
      "work",
      "everyday life"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "mind-peer-support",
    "title": "Mind: understanding peer support",
    "description": "Learn what peer support can involve, possible benefits and difficulties, and questions to ask before joining a group.",
    "provider": "Mind",
    "url": "https://www.mind.org.uk/information-support/guides-to-support-and-services/peer-support-groups/",
    "category": "community",
    "region": "UK",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "The English guide is free. Particular groups may have eligibility, location, registration, or cost requirements.",
    "tags": [
      "peer support",
      "community",
      "groups",
      "choice"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "cdc-connection",
    "title": "CDC: social connection and belonging",
    "description": "Public information about connection, loneliness, belonging, and the role of communities in health.",
    "provider": "Centers for Disease Control and Prevention",
    "url": "https://www.cdc.gov/social-connectedness/about/index.html",
    "category": "community",
    "region": "US",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "Free English reading. Use ideas that suit your circumstances; this is not a requirement to socialize or a clinical assessment.",
    "tags": [
      "connection",
      "belonging",
      "loneliness",
      "community"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "opened"
  },
  {
    "id": "nia-connection",
    "title": "NIA: staying connected as you age",
    "description": "Information for older adults and supporters about loneliness, isolation, and ways to maintain chosen connections.",
    "provider": "National Institute on Aging / NIH",
    "url": "https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected",
    "category": "community",
    "region": "US",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "Free English information. The publisher may show a human-verification screen; US programs described have local eligibility rules.",
    "tags": [
      "older adults",
      "loneliness",
      "accessibility",
      "connection"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "official-reference"
  },
  {
    "id": "samhsa-cost",
    "title": "SAMHSA: finding free or lower-cost treatment",
    "description": "Learn about US routes for checking eligibility, payment options, and services that may offer free or lower-cost care.",
    "provider": "Substance Abuse and Mental Health Services Administration",
    "url": "https://www.samhsa.gov/find-support/how-to-pay-for-treatment/free-or-low-cost-treatment",
    "category": "care",
    "region": "US",
    "languages": [
      "en"
    ],
    "format": "guide",
    "access": "The English information is free. Treatment is not guaranteed free: location, eligibility, coverage, and providers determine actual access and cost.",
    "tags": [
      "United States",
      "cost",
      "eligibility",
      "finding care"
    ],
    "verifiedAt": "2026-10-12",
    "verification": "official-reference"
  }
]
