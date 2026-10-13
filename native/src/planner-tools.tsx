import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { View } from "react-native"
import { buildPresetGuide, getPlannerPresets, plannerId, type PlannerPresetId } from "../../lib/planner"
import type { Field as GuideField, GuideTemplate, Section } from "../../lib/guide-data"
import { copy } from "./workspace"
import { Button, Card, CheckRow, Copy, Field, Pill, Sheet, Title, shared } from "./ui"
import { useNativeApp, useNativeAuth } from "./state"
import { nativeAIConfigured, requestNativeGuideAI } from "./ai"
import type { DraftSuggestions } from "../../lib/ai/schemas"

export function NativeGuideCreator({ onSave, onClose }: { onSave: (guide: GuideTemplate) => void; onClose: () => void }) {
  const app = useNativeApp(), auth = useNativeAuth()
  const [preset, setPreset] = useState<PlannerPresetId>("gentle")
  const [name, setName] = useState(""), [goal, setGoal] = useState(""), [instructions, setInstructions] = useState(""), [routine, setRoutine] = useState(""), [avoid, setAvoid] = useState("")
  const [optional, setOptional] = useState(false), [preview, setPreview] = useState<GuideTemplate | null>(null)
  const [aiOpen, setAiOpen] = useState(false), [aiConsent, setAiConsent] = useState(false), [pending, setPending] = useState(false), [aiError, setAiError] = useState<string | null>(null), [suggestions, setSuggestions] = useState<DraftSuggestions | null>(null)
  const request = useRef<AbortController | null>(null), owner = useRef(auth.user?.uid)
  const access = useRef({ demo: app.demo, canEdit: app.canEdit })
  useLayoutEffect(() => { owner.current = auth.user?.uid; access.current = { demo: app.demo, canEdit: app.canEdit } }, [auth.user?.uid, app.demo, app.canEdit])
  useEffect(() => () => request.current?.abort(), [])
  const canUseAI = nativeAIConfigured && auth.configured && auth.user?.emailVerified && auth.legalAccepted && app.canEdit && !app.demo
  const askAI = async (mode: "assist" | "generate") => {
    if (!canUseAI || !aiConsent || request.current) return
    const requestOwner = owner.current, controller = new AbortController()
    request.current = controller; setPending(true); setAiError(null)
    try {
      const result = await requestNativeGuideAI({ mode, aiConsent, contentLocale: "en-US", intensity: "very_light", name: name.trim() || "My Guide", focus: goal, routineSchedule: routine, thingsToAvoid: avoid, instructions }, auth.getAIToken, controller.signal)
      if (controller.signal.aborted || owner.current !== requestOwner || access.current.demo || !access.current.canEdit) return
      if ("draftSuggestions" in result) setSuggestions(result.draftSuggestions)
      else setPreview(result.guideTemplate)
    } catch (failure) {
      if (!controller.signal.aborted && owner.current === requestOwner) setAiError(failure instanceof Error ? failure.message : "AI could not finish. Your choices are still here.")
    } finally {
      if (request.current === controller) request.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }
  return <Sheet visible title="Create a Guide" onClose={onClose}>
    {!preview ? <>
      <Copy muted>Choose a ready-made week or start from scratch. No questionnaire is required; every step can change later.</Copy>
      <Field label="Guide Name (Optional)" value={name} onChangeText={setName} placeholder="My Guide" maxLength={100} />
      <View style={shared.stack}>{getPlannerPresets().map((item) => <Card key={item.id}><Pill title={item.title} selected={preset === item.id} onPress={() => setPreset(item.id)} /><Copy small muted>{item.description}</Copy></Card>)}</View>
      {preset === "focus" && <Field label="Your Goal" value={goal} onChangeText={setGoal} placeholder="One thing I want to make time for" maxLength={300} />}
      <Button title={optional ? "Hide Optional Preferences" : "Optional Preferences"} variant="quiet" onPress={() => setOptional((value) => !value)} />
      {optional && <Card><Field label="Your Instructions" value={instructions} onChangeText={setInstructions} multiline maxLength={1200} /><Field label="Your Routine" value={routine} onChangeText={setRoutine} multiline maxLength={1200} /><Field label="Things to Avoid" value={avoid} onChangeText={setAvoid} multiline maxLength={1200} /><Copy small muted>These notes are kept with your guide. A preset uses a fixed plan; edit its steps to fit these preferences.</Copy></Card>}
      <Button title="Optional AI Help" variant="quiet" onPress={() => setAiOpen((value) => !value)} />
      {aiOpen && <Card><Title small>AI Help, If You Want It</Title><Copy small muted>{app.demo ? "The demo uses example data and does not send AI requests." : !canUseAI ? "AI is awaiting account and service setup. You can use every preset without it." : "AI can suggest field text or a week. Review the result before using it; suggestions can be wrong."}</Copy>
        {canUseAI && <><Copy small muted>Only this form’s name, goal, routine, things to avoid, and instructions are sent to Google Gemini. Other guides and personal notes are not included. Leave private details out.</Copy><CheckRow label="Send These Fields to Google Gemini When I Choose an AI Action" checked={aiConsent} onPress={() => setAiConsent((value) => !value)} disabled={pending} /><Button title={pending ? "Preparing Suggestions…" : "Suggest Fields"} variant="outline" disabled={!aiConsent || pending} onPress={() => void askAI("assist")} /><Button title="Generate My Week With AI" variant="outline" disabled={!aiConsent || pending} onPress={() => void askAI("generate")} /></>}
        {aiError && <Copy accessibilityRole="alert">{aiError}</Copy>}
        {suggestions && <Card><Title small>Review Suggested Fields</Title><Copy small strong>{suggestions.name}</Copy><Copy>{suggestions.focus}</Copy><Copy small>{suggestions.routineSchedule}</Copy><Copy small>{suggestions.whatHelps}</Copy><Copy small>{suggestions.thingsToAvoid}</Copy><Copy small>{suggestions.additionalNotes}</Copy><Button title="Use These Suggestions" onPress={() => { setName(suggestions.name); setGoal(suggestions.focus); setRoutine(suggestions.routineSchedule); setAvoid(suggestions.thingsToAvoid); setInstructions([instructions, suggestions.whatHelps, suggestions.additionalNotes].filter(Boolean).join("\n").slice(0, 1200)); setOptional(true); setSuggestions(null) }} /><Button title="Keep My Fields" variant="quiet" onPress={() => setSuggestions(null)} /></Card>}
      </Card>}
      <Button title="Preview My Week Without AI" disabled={pending} onPress={() => setPreview(buildPresetGuide(preset, "en-US", { name, goal, instructions, routine, thingsToAvoid: avoid }))} />
    </> : <>
      <Title small>{preview.title}</Title><Copy muted>Review the suggestions before keeping this week. You can change or remove any of them.</Copy>
      {preview.weeklyPlan.length ? preview.weeklyPlan.map((activity) => <Card key={activity.id}><Copy small strong>Day {activity.dayIndex + 1}</Copy><Copy>{activity.description}</Copy></Card>) : <Copy>Your week starts empty. Add only the steps you want.</Copy>}
      <Button title="Use This Week" onPress={() => { onSave(preview); onClose() }} /><Button title="Back to Choices" variant="outline" onPress={() => setPreview(null)} />
    </>}
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
  return <Sheet visible title="Customize Sections" onClose={onClose}>
    <Copy muted>Add your own sections and fields, or adapt the ones here. Existing answers stay attached to their field IDs, even when a field is removed.</Copy>
    {sections.map((section, sectionIndex) => <Card key={section.id}>
      <Field label={`Section ${sectionIndex + 1} Title`} value={section.title} onChangeText={(title) => update(sectionIndex, (value) => ({ ...value, title }))} maxLength={500} />
      {section.blocks.map((block, blockIndex) => block.type === "fields" ? <View key={blockIndex} style={shared.stack}>{block.fields.map((field, fieldIndex) => <Card key={field.kind === "static" ? `static-${fieldIndex}` : field.id}>
        <Field label={field.kind === "static" ? "Text" : "Field Label"} value={field.kind === "static" ? field.text : field.label} onChangeText={(value) => updateField(sectionIndex, blockIndex, fieldIndex, (previous) => previous.kind === "static" ? { ...previous, text: value } : { ...previous, label: value })} maxLength={500} />
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
