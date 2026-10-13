import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { View } from "react-native"
import { getPlannerPresets, plannerId } from "../../lib/planner"
import type { Field as GuideField, GuideTemplate, Section } from "../../lib/guide-data"
import { copy } from "./workspace"
import { Button, Card, CheckRow, Copy, Field, Pill, Sheet, Title, shared } from "./ui"
import { useNativeApp, useNativeAuth } from "./state"
import { nativeAIConfigured, requestNativeGuideAI } from "./ai"
import type { DraftSuggestions } from "../../lib/ai/schemas"
import type { WeekSetup } from "../../lib/week-setup"
import { setupFromPreviousWeek } from "../../lib/week-planning"
import { getWeekOptions, selectedWeekPreference } from "../../lib/week-options"
import { calculateInclusiveEndDate, getNextDayDate, getTodayFormatted } from "../../lib/date-utils"
import { isValidDate } from "../../lib/backup-validation"

export function NativeWeekCreator({ onClose }: { onClose: () => void }) {
  const app = useNativeApp(), auth = useNativeAuth()
  const [setup, setSetup] = useState<WeekSetup>(() => setupFromPreviousWeek(app.starterIsPreview ? undefined : app.activeWeek, app.starterIsPreview ? undefined : app.activeGuide))
  const [personalize, setPersonalize] = useState(false), [extras, setExtras] = useState(false)
  const latestEnd = app.starterIsPreview ? "" : app.weeks.reduce((latest, week) => week.endDate > latest ? week.endDate : latest, "")
  const [startDate, setStartDate] = useState(() => latestEnd ? getNextDayDate(latestEnd) : getTodayFormatted())
  const [error, setError] = useState<string | null>(null), [review, setReview] = useState<Record<string, string> | null>(null)
  const [aiConsent, setAiConsent] = useState(false), [pending, setPending] = useState(false), [aiError, setAiError] = useState<string | null>(null), [suggestions, setSuggestions] = useState<DraftSuggestions | null>(null)
  const request = useRef<AbortController | null>(null), owner = useRef(auth.user?.uid)
  const access = useRef({ demo: app.demo, canEdit: app.canEdit })
  useLayoutEffect(() => {
    owner.current = auth.user?.uid; access.current = { demo: app.demo, canEdit: app.canEdit }
    if (!app.canEdit || app.demo || !auth.user?.emailVerified || !auth.legalAccepted) request.current?.abort()
  }, [auth.user?.uid, auth.user?.emailVerified, auth.legalAccepted, app.demo, app.canEdit])
  useEffect(() => () => request.current?.abort(), [])
  const canUseAI = Boolean(nativeAIConfigured && auth.configured && auth.user?.emailVerified && auth.legalAccepted && app.canEdit && !app.demo)
  const update = (patch: Partial<WeekSetup>) => {
    request.current?.abort(); request.current = null; setPending(false)
    setSetup((previous) => ({ ...previous, ...patch })); setReview(null); setAiConsent(false); setSuggestions(null); setError(null)
  }
  const toggleChoice = (group: "burdens" | "discipline", id: string) => {
    const selected = setup[group] ?? []
    update({ [group]: selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id] })
  }
  const sharedFields = {
    name: setup.name ?? "", focus: setup.expectation,
    routineSchedule: setup.routine ?? "", whatHelps: setup.whatHelps ?? "",
    thingsToAvoid: setup.thingsToAvoid ?? "", additionalNotes: setup.additionalNotes ?? "",
    intensity: setup.intensity ?? "very_light", contentLocale: "en-US",
    instructions: `Use the ${getPlannerPresets().find((item) => item.id === setup.pattern)?.title ?? setup.pattern} pattern. Suggest setup field text only.`,
    currentDifficulties: selectedWeekPreference("burdens", setup.burdens, setup.burdensOther),
    priorityAreas: selectedWeekPreference("discipline", setup.discipline, setup.disciplineOther),
    psychologyApproaches: selectedWeekPreference("psychology", setup.psychology, setup.psychologyOther),
    theologyCosmovision: setup.spirituality ? selectedWeekPreference("theology", setup.theology, setup.theologyOther) || (setup.theology === "other" ? "Other (not specified)" : "No specific tradition") : "",
    theologyEnabled: setup.spirituality === true ? "yes" : "no",
  }
  const labels: Record<string, string> = { name: "Week Name", focus: "What do you expect for this week?", routineSchedule: "Time and Routine", whatHelps: "What Helps", thingsToAvoid: "What to Avoid or Adapt", additionalNotes: "Other Preferences", intensity: "Step Size", contentLocale: "Language", instructions: "Pattern Instructions", currentDifficulties: "Everyday Burdens", priorityAreas: "Habits and Discipline", psychologyApproaches: "Psychological Approach Preference", theologyCosmovision: "Spiritual Preference", theologyEnabled: "Include Spiritual Content" }
  const askAI = async () => {
    if (!canUseAI || !aiConsent || !review || !review.focus.trim() || request.current) return
    const requestOwner = owner.current, controller = new AbortController()
    request.current = controller; setPending(true); setAiError(null)
    try {
      const result = await requestNativeGuideAI({ ...review, theologyEnabled: review.theologyEnabled === "yes", bibleVersion: null, mode: "assist", aiConsent: true }, auth.getAIToken, controller.signal)
      if (controller.signal.aborted || owner.current !== requestOwner || access.current.demo || !access.current.canEdit) return
      if ("draftSuggestions" in result) setSuggestions(result.draftSuggestions)
    } catch (failure) {
      if (!controller.signal.aborted && owner.current === requestOwner && !access.current.demo && access.current.canEdit) setAiError(failure instanceof Error ? failure.message : "Gemini could not finish. Your choices are still here.")
    } finally {
      if (request.current === controller) { request.current = null; setPending(false) }
    }
  }
  const applySuggestions = () => {
    if (!suggestions) return
    setSetup((previous) => ({ ...previous,
      name: previous.name?.trim() ? previous.name : suggestions.name.slice(0, 100),
      expectation: previous.expectation.trim() ? previous.expectation : suggestions.focus.slice(0, 1200),
      routine: previous.routine?.trim() ? previous.routine : suggestions.routineSchedule.slice(0, 1200),
      whatHelps: previous.whatHelps?.trim() ? previous.whatHelps : suggestions.whatHelps.slice(0, 1200),
      thingsToAvoid: previous.thingsToAvoid?.trim() ? previous.thingsToAvoid : suggestions.thingsToAvoid.slice(0, 1200),
      additionalNotes: previous.additionalNotes?.trim() ? previous.additionalNotes : suggestions.additionalNotes.slice(0, 1200),
    }))
    setSuggestions(null); setReview(null); setAiConsent(false); setExtras(true)
  }
  return <Sheet visible title="Add Week" onClose={onClose}>
    <Copy muted>{app.starterIsPreview ? "Choose your first week. This replaces the unsaved sample." : "This starts from your selected week's setup and daily notes. Checks start unchecked; each week keeps its own record."}</Copy>
    <Copy small muted>Keeping the same pattern copies its activities. Choosing another pattern replaces the suggested activities.</Copy>
    <View style={shared.stack}>{getPlannerPresets().map((item) => <Card key={item.id}><Pill title={item.title} selected={setup.pattern === item.id} onPress={() => update({ pattern: item.id })} /><Copy small muted>{item.description}</Copy></Card>)}</View>
    <Field label="What do you expect for this week?" value={setup.expectation} onChangeText={(expectation) => update({ expectation })} placeholder="e.g. Make room for a short rest after lunch." multiline maxLength={1200} />
    <Copy small muted>Optional. You can leave this blank and use any pattern without AI.</Copy>
    <Button title={personalize ? "Hide Optional Personalization" : "Personalize This Week (Optional)"} variant="quiet" onPress={() => setPersonalize((value) => !value)} />
    {personalize && <Card>
      <Copy strong>Everyday Burdens</Copy><Copy small muted>What has been weighing on you lately? Select any that fit, or leave them empty.</Copy>
      {getWeekOptions("burdens").map((option) => <CheckRow key={option.id} label={option.label} checked={(setup.burdens ?? []).includes(option.id)} onPress={() => toggleChoice("burdens", option.id)} />)}
      {setup.burdens?.includes("other") && <Field label="Other: Everyday Burdens" value={setup.burdensOther ?? ""} onChangeText={(burdensOther) => update({ burdensOther })} placeholder="e.g. Too many commitments this week." maxLength={1200} />}
      <Copy strong>Habits and Discipline</Copy><Copy small muted>What would you like to work on in your routine? Select any that fit.</Copy>
      {getWeekOptions("discipline").map((option) => <CheckRow key={option.id} label={option.label} checked={(setup.discipline ?? []).includes(option.id)} onPress={() => toggleChoice("discipline", option.id)} />)}
      {setup.discipline?.includes("other") && <Field label="Other: Habits and Discipline" value={setup.disciplineOther ?? ""} onChangeText={(disciplineOther) => update({ disciplineOther })} placeholder="e.g. A pause before checking messages." maxLength={1200} />}
      <Copy strong>Psychological Approach Preference</Copy><Copy small muted>Optional preferences for wording; these do not provide diagnosis or treatment.</Copy>
      <View style={shared.wrap}>{getWeekOptions("psychology").map((option) => <Pill key={option.id} title={option.label} selected={(setup.psychology ?? "none") === option.id} onPress={() => update({ psychology: option.id })} />)}</View>
      {setup.psychology === "other" && <Field label="Other: Psychological Approach" value={setup.psychologyOther ?? ""} onChangeText={(psychologyOther) => update({ psychologyOther })} placeholder="e.g. Practical reflection without a named approach." maxLength={1200} />}
      <CheckRow label="Include Optional Spiritual Content" checked={setup.spirituality === true} onPress={() => update({ spirituality: !setup.spirituality })} />
      {setup.spirituality && <><Copy strong>Theology / Spirituality</Copy><View style={shared.wrap}>{getWeekOptions("theology").map((option) => <Pill key={option.id} title={option.label} selected={(setup.theology ?? "none") === option.id} onPress={() => update({ theology: option.id })} />)}</View>
      {setup.theology === "other" && <Field label="Other: Spiritual Preference" value={setup.theologyOther ?? ""} onChangeText={(theologyOther) => update({ theologyOther })} placeholder="e.g. Space for reflection without scripture." maxLength={1200} />}</>}
    </Card>}
    <Button title={extras ? "Hide More Options" : "More Options"} variant="quiet" onPress={() => setExtras((value) => !value)} />
    {extras && <Card>
      <Field label="Week Name (Optional)" value={setup.name ?? ""} onChangeText={(name) => update({ name })} placeholder="e.g. A Little Room for Rest" maxLength={100} />
      <Field label="Start Date · YYYY-MM-DD" value={startDate} onChangeText={setStartDate} placeholder="e.g. 2026-10-19" keyboardType="numbers-and-punctuation" maxLength={10} />
      <Copy small muted>Seven days. The default starts after your latest week; you can choose another date.</Copy>
      <Field label="Time and Routine (Optional)" value={setup.routine ?? ""} onChangeText={(routine) => update({ routine })} placeholder="e.g. Ten minutes after lunch, except Friday." multiline maxLength={1200} />
      <Field label="What Helps (Optional)" value={setup.whatHelps ?? ""} onChangeText={(whatHelps) => update({ whatHelps })} placeholder="e.g. A quiet place and a reminder." multiline maxLength={1200} />
      <Field label="What to Avoid or Adapt (Optional)" value={setup.thingsToAvoid ?? ""} onChangeText={(thingsToAvoid) => update({ thingsToAvoid })} placeholder="e.g. Skip long walks; offer seated alternatives." multiline maxLength={1200} />
      <Field label="Other Preferences (Optional)" value={setup.additionalNotes ?? ""} onChangeText={(additionalNotes) => update({ additionalNotes })} placeholder="e.g. Keep weekends free of scheduled steps." multiline maxLength={1200} />
      <Copy small strong>Step Size (Optional)</Copy><View style={shared.wrap}>{(["very_light", "light", "moderate"] as const).map((intensity) => <Pill key={intensity} title={intensity === "very_light" ? "Very Small" : intensity === "light" ? "Small" : "Moderate"} selected={(setup.intensity ?? "very_light") === intensity} onPress={() => update({ intensity })} />)}</View>
      <Copy small muted>These preferences stay with this week. Local patterns use fixed suggestions; edit the activities to fit your preferences.</Copy>
    </Card>}
    <Button title="Optional Gemini Assist" variant="quiet" disabled={pending} onPress={() => { setReview(sharedFields); setAiConsent(false); setAiError(null); setSuggestions(null) }} />
    {review && <Card><Title small>Review Fields Before Sending</Title><Copy small muted>{app.demo ? "Example access never sends records to Gemini." : !canUseAI ? "Gemini requires a verified account and configured HTTPS service." : "Only the fields below are sent to Google Gemini. Daily notes and other weeks are excluded."}</Copy>
      {Object.entries(review).map(([key, value]) => <View key={key}><Copy small strong>{labels[key]}</Copy><Copy small muted>{key === "intensity" ? value === "very_light" ? "Very Small" : value === "light" ? "Small" : "Moderate" : key === "contentLocale" ? "English (US)" : value || "(Empty)"}</Copy></View>)}
      {canUseAI && <><CheckRow label="Send These Reviewed Fields to Google Gemini" checked={aiConsent} onPress={() => setAiConsent((value) => !value)} disabled={pending} /><Button title={pending ? "Preparing Suggestions…" : "Suggest Setup Fields"} disabled={!aiConsent || pending || !review.focus.trim()} onPress={() => void askAI()} />{!review.focus.trim() && <Copy small muted>Add an expectation to request suggestions. Creating a week does not require it.</Copy>}</>}
      {aiError && <Copy accessibilityRole="alert">{aiError}</Copy>}
      {suggestions && <Card><Title small>Review Suggested Setup Fields</Title>{(["name", "focus", "routineSchedule", "whatHelps", "thingsToAvoid", "additionalNotes"] as const).map((key) => <View key={key}><Copy small strong>{labels[key]}</Copy><Copy small>{suggestions[key] || "(Empty)"}</Copy></View>)}<Copy small muted>Use Suggestions fills only empty setup fields. Your existing text stays as entered.</Copy><Button title="Use Suggestions in Empty Fields" onPress={applySuggestions} /><Button title="Keep My Fields" variant="quiet" onPress={() => setSuggestions(null)} /></Card>}
      <Button title="Close Gemini Review" variant="quiet" disabled={pending} onPress={() => { setReview(null); setAiConsent(false) }} />
    </Card>}
    {error && <Copy accessibilityRole="alert">{error}</Copy>}
    <Button title="Add Week" disabled={pending} onPress={() => {
      if (!isValidDate(startDate) || !isValidDate(calculateInclusiveEndDate(startDate))) { setExtras(true); setError("Enter a real start date with seven valid calendar days as YYYY-MM-DD."); return }
      if (app.createPlannedWeek(setup, undefined, startDate)) onClose(); else setError("The week could not be added. Check your preferences and access, then try again.")
    }} /><Button title="Cancel" variant="quiet" onPress={onClose} />
  </Sheet>
}

export function NativeSectionEditor({ guide, onSave, onClose }: { guide: GuideTemplate; onSave: (sections: Section[]) => boolean; onClose: () => void }) {
  const [sections, setSections] = useState(() => copy(guide.sections))
  const [error, setError] = useState<string | null>(null)
  const update = (index: number, change: (section: Section) => Section) => setSections((value) => value.map((section, position) => position === index ? change(section) : section))
  const updateField = (sectionIndex: number, blockIndex: number, fieldIndex: number, change: (field: GuideField) => GuideField) => update(sectionIndex, (section) => ({ ...section, blocks: section.blocks.map((block, position) => position === blockIndex && block.type === "fields" ? { ...block, fields: block.fields.map((field, index) => index === fieldIndex ? change(field) : field) } : block) }))
  const addField = (index: number) => update(index, (section) => {
    const blockIndex = section.blocks.findIndex((block) => block.type === "fields")
    const field: GuideField = { kind: "textarea", id: plannerId("field"), label: "My Note" }
    return { ...section, blocks: blockIndex < 0 ? [...section.blocks, { type: "fields", fields: [field] }] : section.blocks.map((block, position) => position === blockIndex && block.type === "fields" ? { ...block, fields: [...block.fields, field] } : block) }
  })
  const move = (index: number, offset: number) => setSections((value) => { const next = [...value]; const [section] = next.splice(index, 1); next.splice(index + offset, 0, section); return next })
  return <Sheet visible title="Customize This Week's Notes" onClose={onClose}>
    <Copy muted>These changes apply to this week only. Add, rename, reorder, or remove note fields. Existing answers stay attached to their field IDs, even when a field is removed.</Copy>
    {sections.map((section, sectionIndex) => <Card key={section.id}>
      <Field label={`Section ${sectionIndex + 1} Title`} value={section.title} onChangeText={(title) => update(sectionIndex, (value) => ({ ...value, title }))} placeholder="e.g. A Moment to Pause" maxLength={500} />
      {section.blocks.map((block, blockIndex) => block.type === "fields" ? <View key={blockIndex} style={shared.stack}>{block.fields.map((field, fieldIndex) => <Card key={field.kind === "static" ? `static-${fieldIndex}` : field.id}>
        <Field label={field.kind === "static" ? "Text" : "Field Label"} value={field.kind === "static" ? field.text : field.label} onChangeText={(value) => updateField(sectionIndex, blockIndex, fieldIndex, (previous) => previous.kind === "static" ? { ...previous, text: value } : { ...previous, label: value })} placeholder="e.g. What helped today?" maxLength={500} />
        {field.kind !== "static" && <View style={shared.wrap}>{(["text", "textarea", "scale"] as const).map((kind) => <Pill key={kind} title={kind === "text" ? "Short Text" : kind === "textarea" ? "Long Text" : "Number Scale"} selected={field.kind === kind} onPress={() => updateField(sectionIndex, blockIndex, fieldIndex, (previous) => previous.kind === "static" ? previous : { id: previous.id, label: previous.label, kind, ...(kind === "scale" ? { max: 10 } : {}) })} />)}</View>}
        <Button title="Remove Field" variant="quiet" onPress={() => update(sectionIndex, (value) => ({ ...value, blocks: value.blocks.flatMap((item, position) => position === blockIndex && item.type === "fields" ? item.fields.length === 1 ? [] : [{ ...item, fields: item.fields.filter((_, index) => index !== fieldIndex) }] : [item]) }))} />
      </Card>)}</View> : (block.type === "p" || block.type === "lead" || block.type === "note" || block.type === "h") ? <Field key={blockIndex} label={block.type === "note" ? "Optional Instructions" : "Section Text"} value={block.text} onChangeText={(text) => update(sectionIndex, (value) => ({ ...value, blocks: value.blocks.map((item, index) => index === blockIndex && "text" in item ? { ...item, text } : item) }))} multiline maxLength={10000} /> : null)}
      <Button title="Add Field" variant="outline" disabled={section.blocks.some((block) => block.type === "fields" && block.fields.length >= 100)} onPress={() => addField(sectionIndex)} />
      <View style={shared.wrap}><Button title="Move Up" variant="quiet" disabled={sectionIndex === 0} onPress={() => move(sectionIndex, -1)} /><Button title="Move Down" variant="quiet" disabled={sectionIndex === sections.length - 1} onPress={() => move(sectionIndex, 1)} /><Button title="Remove Section" variant="quiet" onPress={() => setSections((value) => value.filter((_, index) => index !== sectionIndex))} /></View>
    </Card>)}
    <Button title="Add Section" variant="outline" disabled={sections.length >= 60} onPress={() => setSections((value) => [...value, { id: plannerId("section"), number: String(value.length + 1).padStart(2, "0"), kicker: "YOUR CHOICES", title: "My Section", blocks: [] }])} />
    {error && <Copy accessibilityRole="alert">{error}</Copy>}
    <Button title="Save Sections" onPress={() => {
      if (sections.some((section) => !section.title.trim() || section.blocks.some((block) => block.type === "fields" && block.fields.some((field) => !(field.kind === "static" ? field.text : field.label).trim())))) { setError("Give each section a title and each field a label before saving."); return }
      if (onSave(sections)) onClose(); else setError("Check section titles and field labels, then try again. Reopen a recorded week before editing its sections.")
    }} /><Button title="Cancel" variant="quiet" onPress={onClose} />
  </Sheet>
}
