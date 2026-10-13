import { DEFAULT_GUIDE_TEMPLATE_EN } from "./guide-data-en"
import type { Block, GuideTemplate, Section } from "./guide-data"

export type OnboardingAnswers = Record<string, string>
export type OnboardingChoice = { id: string; title: string; detail: string }
export type OnboardingQuestion = { id: string; label: string; eyebrow: string; title: string; description: string; choices: OnboardingChoice[] }

export const QUESTIONS: OnboardingQuestion[] = [
  {
    id: "intention", label: "Intention", eyebrow: "A little room to begin", title: "What brings you here today?",
    description: "There is no right answer. Notice what would feel useful, or simply take a look around.",
    choices: [
      { id: "space", title: "A little more breathing room", detail: "Make space to pause and notice." },
      { id: "routine", title: "A steadier everyday routine", detail: "Find small steps that fit real life." },
      { id: "meaning", title: "Time for what matters to me", detail: "Reconnect with what I want to care for." },
      { id: "explore", title: "I’m just looking around", detail: "Explore without deciding anything yet." },
    ],
  },
  {
    id: "pace", label: "Pace", eyebrow: "Your pace belongs to you", title: "What kind of pace would fit?",
    description: "Your energy and circumstances can change. A small beginning is welcome here.",
    choices: [
      { id: "small", title: "One small step at a time", detail: "Keep things light and manageable." },
      { id: "structure", title: "A little gentle structure", detail: "Have a few ideas to come back to." },
      { id: "flexible", title: "I’d like to decide each day", detail: "Leave room to adapt, skip or rest." },
    ],
  },
  {
    id: "activity", label: "Possibilities", eyebrow: "Many ways to care", title: "What feels inviting right now?",
    description: "These are everyday possibilities, not a prescription. Choose one only if it feels comfortable.",
    choices: [
      { id: "pause", title: "Pause and notice", detail: "A quiet moment to check in with myself." },
      { id: "write", title: "Write a little", detail: "Make room for a thought or a feeling." },
      { id: "move", title: "Move gently", detail: "A stretch, a walk or another accessible movement." },
      { id: "mix", title: "Try different things", detail: "Explore and keep what works for me." },
    ],
  },
  {
    id: "support", label: "Support", eyebrow: "Support can take many forms", title: "How would you like to explore?",
    description: "A guide can be one resource among many. You decide what support makes sense for you.",
    choices: [
      { id: "own", title: "On my own for now", detail: "Take some time for my own reflections." },
      { id: "trusted", title: "Alongside someone I trust", detail: "Make room for connection and conversation." },
      { id: "professional", title: "With professional support", detail: "Use a guide alongside care from a qualified professional." },
      { id: "undecided", title: "I’m still considering it", detail: "There is no need to decide here." },
    ],
  },
  {
    id: "focus", label: "Focus", eyebrow: "A place to give attention", title: "What would you like to make room for?",
    description: "This selects everyday topics, not a diagnosis or an assessment of how you are doing.",
    choices: [
      { id: "stress", title: "A quieter moment in a busy day", detail: "Notice demands and choose a small boundary." },
      { id: "rest", title: "Rest and everyday care", detail: "Make some room for comfort and replenishment." },
      { id: "connection", title: "Connection on my terms", detail: "Consider company, community and boundaries." },
      { id: "change", title: "Finding my way through change", detail: "Choose a manageable step without needing certainty." },
    ],
  },
  {
    id: "time", label: "Time", eyebrow: "Small can be enough", title: "How much time might fit a day?",
    description: "An estimate is plenty. You can shorten, skip or change any suggestion later.",
    choices: [
      { id: "5", title: "About 5 minutes", detail: "A brief pause or one small action." },
      { id: "10", title: "About 10 minutes", detail: "A little space to explore." },
      { id: "15", title: "About 15 minutes", detail: "An unhurried moment, when it fits." },
    ],
  },
  {
    id: "format", label: "Style", eyebrow: "Make it your own", title: "How do you prefer to reflect?",
    description: "Writing is optional. A thought, a drawing or an everyday action can also be a starting point.",
    choices: [
      { id: "writing", title: "A few words on a page", detail: "Use optional prompts to put things into words." },
      { id: "action", title: "Something practical to try", detail: "Begin with everyday actions and less writing." },
      { id: "mixed", title: "A little of both", detail: "Alternate reflection and practical possibilities." },
    ],
  },
  {
    id: "anchor", label: "Rhythm", eyebrow: "Room in the day", title: "When might a moment fit?",
    description: "This only suggests an editable example time. It will not schedule notifications.",
    choices: [
      { id: "morning", title: "In the morning", detail: "Begin the day with a little space." },
      { id: "afternoon", title: "During the afternoon", detail: "Pause between parts of the day." },
      { id: "evening", title: "In the evening", detail: "Set aside a moment as the day settles." },
      { id: "flexible", title: "Whenever it works", detail: "Choose a time each day; no fixed appointment." },
    ],
  },
  {
    id: "structure", label: "Shape", eyebrow: "A guide that can bend", title: "What would make a guide feel useful?",
    description: "Choose a way to present your first week. Nothing needs to be completed to keep using Anew.",
    choices: [
      { id: "gentle", title: "Gentle suggestions", detail: "A small menu of ideas, with room to rest." },
      { id: "checklist", title: "A simple checklist", detail: "A clear view of optional daily possibilities." },
      { id: "open", title: "An open space", detail: "More freedom to choose what the day needs." },
    ],
  },
  {
    id: "starting", label: "First step", eyebrow: "Begin where you are", title: "Which first step feels most possible?",
    description: "You can change your mind. There is no obligation to try it today.",
    choices: [
      { id: "rest", title: "Make a little room to rest", detail: "Choose comfort or a quieter moment." },
      { id: "move", title: "Try an accessible movement", detail: "A comfortable stretch, walk or another way to move." },
      { id: "notice", title: "Notice something around me", detail: "A colour, a sound or a detail in the room." },
      { id: "connect", title: "Consider a supportive connection", detail: "Think about company or a resource, without pressure to reach out." },
    ],
  },
]

/** Only recognized preference codes enter the local guide. Free text and extra keys are discarded. */
function knownAnswers(value: unknown): OnboardingAnswers {
  const result: OnboardingAnswers = {}
  if (!value || typeof value !== "object" || Array.isArray(value)) return result
  for (const question of QUESTIONS) {
    if (!Object.hasOwn(value, question.id)) continue
    const answer = (value as Record<string, unknown>)[question.id]
    if (typeof answer === "string" && question.choices.some((choice) => choice.id === answer)) result[question.id] = answer
  }
  return result
}

export function hasOnboardingAnswers(value: unknown): boolean { return Object.keys(knownAnswers(value)).length > 0 }

export function getOnboardingSummary(value: OnboardingAnswers): { label: string; value: string }[] {
  const answers = knownAnswers(value)
  return QUESTIONS.flatMap((question) => {
    const choice = question.choices.find((option) => option.id === answers[question.id])
    return choice ? [{ label: question.label, value: choice.title }] : []
  })
}

const careIdeas: Record<string, { title: string; text: string; activity: string }> = {
  pause: { title: "A small pause", text: "If comfortable, notice a colour or a sound around you. There is no need to focus on breathing, close your eyes or become calm. Stop or choose another activity if this does not feel useful.", activity: "Notice one comfortable detail around you" },
  write: { title: "A few words, if you like", text: "Write about something in the present: a need, a thought or a small thing that mattered. A few words are enough. You do not need to revisit painful memories or produce an explanation.", activity: "Write a few words about a present need or something that mattered" },
  move: { title: "Movement on your terms", text: "Choose movement that is accessible and comfortable for you, such as changing position, a gentle stretch or a short walk. Adapt to your condition and surroundings; resting is an equally valid choice.", activity: "Try comfortable, accessible movement or choose rest" },
  mix: { title: "A menu of small possibilities", text: "Try a quiet pause, a few words or an accessible movement, one at a time. Keep what fits and leave the rest. A preference today does not need to become a rule.", activity: "Choose a pause, a few words or an accessible movement" },
}

const focusIdeas: Record<string, { title: string; text: string; activity: string; source: string }> = {
  stress: { title: "Room in a busy day", text: "Notice one demand you could simplify, postpone or share. Consider the practical conditions around it, including work, care responsibilities and available support. A small boundary can be enough for today.", activity: "Simplify one demand or name a small boundary", source: "autojulgamento" },
  rest: { title: "Rest is a possible choice", text: "Choose a small comfort or an accessible break. Rest does not have to be earned by finishing tasks. Consider what is realistic in your circumstances and avoid turning this guide into another demand.", activity: "Make room for a small comfort or accessible break", source: "ativacao" },
  connection: { title: "Connection with choice and boundaries", text: "Consider a person, community or resource that feels welcome to you. You can think about connection without contacting anyone. Respect your own boundaries and the other person's wishes; solitude can also be what you need.", activity: "Consider a welcome person, community or resource", source: "vinculo" },
  change: { title: "One step while things change", text: "Separate what needs attention today from what can remain uncertain. Choose one manageable practical step, a resource or a request for support. You do not need to make a complete plan for the future.", activity: "Choose one manageable step or resource for a current change", source: "competencia" },
}

const firstSteps: Record<string, string> = {
  rest: "Choose a small comfort or a quiet moment to rest",
  move: "Try a comfortable, accessible movement, or choose rest",
  notice: "Notice one comfortable colour, sound or detail around you",
  connect: "Consider a welcome person or resource; reaching out is optional",
}
const supportCopy: Record<string, { title: string; text: string; activity: string }> = {
  own: { title: "A space of your own", text: "You can explore privately and decide what to record. No sharing or social contact is required. You can change your mind about support at any time.", activity: "Keep a little time for a private reflection or chosen rest" },
  trusted: { title: "Alongside someone you trust", text: "If you wish, share only what you choose with a person you trust. Ask whether it is a good time, respect both people's boundaries and keep private details private. You do not owe anyone your notes.", activity: "Consider a brief, consensual conversation with someone you trust" },
  professional: { title: "Alongside professional care", text: "Use this guide as an optional way to organize everyday observations. You may bring a question to a qualified professional if you wish. The app does not choose a therapy, set treatment goals or replace your care plan.", activity: "Note one optional question to discuss with your qualified professional" },
  undecided: { title: "Leave support open", text: "You do not need to decide on a form of support now. Explore free resources or consider practical questions about access, boundaries and fit, at your own pace.", activity: "Explore one resource or leave the question of support open" },
}

/** Pure, deterministic local personalization. No network, identifiers, clinical scoring or answer persistence. */
export function buildPersonalizedGuide(value: OnboardingAnswers): GuideTemplate {
  const answers = knownAnswers(value)
  const suffix = QUESTIONS.map((question) => question.choices.findIndex((choice) => choice.id === answers[question.id]) + 1).join("")
  const guideId = `anew-personal-v1-${suffix}`
  const care = careIdeas[answers.activity || "mix"]
  const focus = focusIdeas[answers.focus || "rest"]
  const support = supportCopy[answers.support || "undecided"]
  const minutes = answers.time || "5"
  const exampleTime = ({ morning: "08:00", afternoon: "14:00", evening: "20:00", flexible: "16:30" } as Record<string, string>)[answers.anchor || "flexible"]
  const writing = answers.format !== "action"
  const paceText = answers.pace === "small" ? "Three small invitations, with other days left for rest or your own choice." : answers.pace === "structure" ? "One gentle invitation each day, always optional and editable." : "Decide each day whether to use an invitation, change it or leave it."
  const timeText = answers.anchor === "flexible" || !answers.anchor ? "The displayed time is only a placeholder; choose any time that fits." : `The ${exampleTime} time is an editable example, not an appointment or reminder.`
  const title = ({ space: "A little breathing room", routine: "A steadier everyday rhythm", meaning: "Room for what matters", explore: "My first Anew guide" } as Record<string, string>)[answers.intention || "explore"]
  const base = structuredClone(DEFAULT_GUIDE_TEMPLATE_EN)
  const source = (id: string): Section => structuredClone(base.sections.find((section) => section.id === id)!)
  const record = (id: string, label: string): Block[] => writing ? [{ type: "fields", title: "Optional note", fields: [{ kind: "textarea", id, label }] }] : []
  const first = firstSteps[answers.starting || (answers.activity === "move" ? "move" : answers.activity === "pause" ? "notice" : "rest")]
  const purpose = answers.intention === "meaning" ? "You might name one thing that matters to you and one small way to care for it. No belief or life arrangement is required." : answers.intention === "routine" ? "Try linking one small act of care to a part of your day. Missing it creates no debt; change the plan as needed." : answers.intention === "space" ? "Leave space between demands when you can. This guide can be shortened, paused or set aside." : "Explore different possibilities without needing to commit to a method or complete a plan."
  const foundation = source("fundamento")
  foundation.title = title
  foundation.blocks = [
    { type: "lead", text: hasOnboardingAnswers(answers) ? "A first guide shaped by the everyday preferences you chose." : "A gentle starting guide you can make your own." },
    { type: "p", text: purpose },
    { type: "note", label: "Your choice", text: "These suggestions are optional and editable. You can skip, rest or begin again; the guide does not assess your health or recommend a psychological approach." },
  ]
  const starting = source("ativacao")
  starting.title = care.title
  starting.blocks = [{ type: "lead", text: first }, { type: "p", text: care.text }, { type: "note", label: "A little time", text: `Allow up to ${minutes} minutes if it fits, or stop sooner. There is no minimum to achieve.` }, ...record("starting-note", "What, if anything, would make this step more comfortable?")]
  const focusSection = source(focus.source)
  focusSection.title = focus.title
  focusSection.blocks = [{ type: "lead", text: "An everyday topic to explore, without needing a perfect answer." }, { type: "p", text: focus.text }, ...record("focus-note", "What would be useful to make room for today?")]
  const supportSection = source("vinculo")
  supportSection.id = "chosen-support"
  supportSection.title = support.title
  supportSection.blocks = [{ type: "lead", text: "You decide what support makes sense for you." }, { type: "p", text: support.text }, ...record("support-note", "Is there any support or resource I would like to consider?")]
  const week = source("semana-1")
  week.blocks = [{ type: "lead", text: paceText }, { type: "p", text: `Suggestions allow up to ${minutes} minutes, with room to shorten them. ${timeText} There are no notifications or missed-task penalties. Checks record activities you chose, not health or clinical improvement.` }]
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const routine = [first, care.activity, focus.activity, care.activity, focus.activity, support.activity, "Notice what helped, what did not fit and one possible adjustment"]
  const weeklyPlan = days.map((day, dayIndex) => {
    const restDay = answers.pace === "small" && ![0, 2, 4].includes(dayIndex)
    let activity = restDay ? "Rest, leave this space open or choose your own care" : routine[dayIndex]
    if (!restDay && answers.format === "writing" && dayIndex > 0 && dayIndex < 5) activity = `Write a few optional words about ${dayIndex % 2 ? care.title.toLowerCase() : focus.title.toLowerCase()}: what might fit today?`
    else if (!restDay && answers.format === "mixed" && dayIndex === 3) activity = "Write a few optional words about something in the present"
    return { id: `${guideId}-day-${dayIndex}`, dayIndex, time: exampleTime, description: `${activity} (up to ${minutes} minutes; optional)`, order: 0, countsTowardCompletion: !restDay }
  })
  if (answers.structure === "open") {
    week.blocks.push({ type: "note", label: "An open week", text: "Use the week view as a space to arrange your own choices. You can remove every example or leave days empty. The suggestions below are a menu rather than a sequence." }, { type: "list", items: [first, care.activity, focus.activity, support.activity] })
  } else if (answers.structure !== "checklist") {
    week.blocks.push({ type: "note", label: "Gentle suggestions", text: "The routine below is a set of possibilities, not a list you need to finish. Edit a suggestion, leave a day empty or choose rest whenever it fits." })
  }
  // All presentation styles retain the live routine renderer, including edit/check controls.
  week.blocks.push({ type: "schedule", id: "chosen-week", cols: [exampleTime, "Change or rest", "Optional note"], rows: weeklyPlan.map((activity, index) => ({ id: `chosen-day-${index}`, day: days[index], tasks: [activity.description, "—", "—"] })) })
  const review = source("revisao")
  review.blocks = [{ type: "lead", text: "Your week is an experience to understand, not a test to pass." }, { type: "p", text: "Notice what was useful, what did not fit and the conditions around it. Rest and support count as possibilities. You can repeat, reduce, change or leave the guide for now." }, ...record("week-note", "What helped, and what would I like to change or leave open?")]
  const sections = [foundation, starting, focusSection, supportSection, source("mapa"), source("limites"), week, review]
  sections.forEach((section, index) => {
    section.id = `${guideId}-section-${index + 1}`
    section.number = String(index + 1).padStart(2, "0")
    delete section.scripture
    section.blocks.forEach((block) => {
      if (block.type === "fields") block.fields.forEach((field) => { if (field.kind !== "static") field.id = `${section.id}-${field.id}` })
      if (block.type === "schedule" || block.type === "ladder") {
        block.id = `${section.id}-${block.id}`
        block.rows.forEach((row) => { row.id = `${section.id}-${row.id}` })
      }
    })
  })
  const scheduleTaskIds = sections.flatMap((section) => section.blocks.flatMap((block) => block.type === "schedule" ? block.rows.flatMap((row) => row.tasks.flatMap((task, index) => task === "—" ? [] : [`${row.id}-${index}`])) : block.type === "ladder" ? block.rows.map((row) => row.id) : []))
  return {
    ...base, id: guideId, title, description: "An optional first guide assembled locally from your everyday preferences", version: 1,
    createdAt: "2026-10-12T00:00:00.000Z", updatedAt: "2026-10-12T00:00:00.000Z", contentLocale: "en-US",
    intro: { ...base.intro, title, subtitle: `Small, optional possibilities with room for up to ${minutes} minutes, rest and change.` },
    sections, weeklyPlan, scheduleTaskIds, theologyEnabled: false, bibleVersion: null,
    quickSheets: [{ id: `${guideId}-care`, title: "My next small possibility", summary: first }],
    completionConfig: { ...base.completionConfig, theologyReviewEnabled: false },
    safetyNotes: [...(base.safetyNotes || []), "Built locally without AI; selected preferences do not constitute a clinical assessment."],
  }
}
