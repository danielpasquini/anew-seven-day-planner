import React, { useLayoutEffect, useMemo, useRef, useState } from "react"
import { Alert, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { File, Paths } from "expo-file-system"
import * as DocumentPicker from "expo-document-picker"
import * as Sharing from "expo-sharing"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { QUESTIONS, buildPersonalizedGuide, hasOnboardingAnswers, getOnboardingSummary, type OnboardingAnswers } from "../../lib/onboarding"
import { createStarterGuide } from "../../lib/planner"
import { FREE_RESOURCES, RESOURCE_CATEGORIES, RESOURCE_LIBRARY_NOTE_EN } from "../../lib/resources"
import { ONBOARDING_QUOTES } from "../../lib/onboarding-quotes"
import { TEST_EMAIL, TEST_PASSWORD, matchesTestAccess } from "../../lib/test-access"
import { getConsentCopy, LEGAL_VERSION } from "../../lib/legal"
import { calculateInclusiveEndDate, getTodayFormatted, getWeekDays, formatDateRangeLocale } from "../../lib/date-utils"
import { isValidDate } from "../../lib/backup-validation"
import type { Block } from "../../lib/guide-data"
import { NativeWeekCreator, NativeSectionEditor } from "./planner-tools"
import { NativePlannerTutorial, type NativeTourStep } from "./planner-tutorial"
import { NativeTestAccess } from "./test-access"
import { useNativeApp, useNativeAuth } from "./state"
import { NATIVE_LEGAL_DOCUMENTS } from "./legal-content"
import { useNativeSound } from "./sound"
import { Button, Busy, Card, CheckRow, Copy, Eyebrow, Field, Page, Pill, Sheet, Title, UITheme, shared, useColors } from "./ui"

export type NativeTab = "guide" | "weeks" | "resources" | "privacy"
type App = ReturnType<typeof useNativeApp>
type Auth = ReturnType<typeof useNativeAuth>
type Legal = "terms" | "privacy"
type ModalName = "week" | "settings" | "backup" | "complete" | "activity" | "delete" | "create-week" | "sections" | null
type ConfirmationRequest = {
  title: string
  message: string
  label: string
  access: "edit" | "owner"
  destructive?: boolean
  success?: string
  failure?: string
  action: () => void | boolean | Promise<void | boolean>
}
type PendingConfirmation = ConfirmationRequest & { owner: string }
const emptyAgreements = { terms: false, privacy: false, health: false, adult: false }
const MAX_BACKUP_BYTES = 10 * 1024 * 1024

async function openResource(url: string) {
  if (!url.startsWith("https://")) throw new Error("Only secure resource links can be opened.")
  await Linking.openURL(url)
}

function LegalSheet({ document, onClose }: { document: Legal | null; onClose: () => void }) {
  const doc = document ? NATIVE_LEGAL_DOCUMENTS[document] : null
  return <Sheet visible={!!doc} title={doc?.title || "Notice"} onClose={onClose}>{doc && <><Copy small muted>Version {LEGAL_VERSION}</Copy><Copy>{doc.introduction}</Copy>{doc.sections.map((section) => <View key={section.id} style={shared.stack}><Title small>{section.title}</Title>{section.paragraphs.map((paragraph) => <Copy key={paragraph}>{paragraph}</Copy>)}</View>)}</>}</Sheet>
}

function NativeJourney({ onPreview, onAccount, onSignIn, onCancel, testing = false }: { onPreview: (answers: OnboardingAnswers) => void; onAccount: (answers: OnboardingAnswers) => void; onSignIn?: () => void; onCancel?: () => void; testing?: boolean }) {
  const [step, setStep] = useState(0), [answers, setAnswers] = useState<OnboardingAnswers>({}), [quoteIndex, setQuoteIndex] = useState(0), [error, setError] = useState<string | null>(null)
  const [personalizing, setPersonalizing] = useState(false), [showReflection, setShowReflection] = useState(false)
  const c = useColors(), sound = useNativeSound(), question = QUESTIONS[step], final = step === QUESTIONS.length
  const guide = final ? hasOnboardingAnswers(answers) ? buildPersonalizedGuide(answers) : createStarterGuide() : null, summary = getOnboardingSummary(answers), quote = ONBOARDING_QUOTES[quoteIndex]
  if (!personalizing) return <Page><Title small>Anew.</Title><Eyebrow>{testing ? "FIRST VISIT TEST" : "YOUR SEVEN-DAY PLANNER"}</Eyebrow><Title>A Small Step. A Week That Fits.</Title><Copy muted>Plan the next seven days with one small step at a time. Start with a ready-made week, adjust what you need, and leave room for rest.</Copy><Card><Copy>One manageable suggestion each day.</Copy><Copy>Ready-made weeks without AI.</Copy><Copy>Your own sections, fields, and choices.</Copy></Card><Button title={testing ? "Start Test Workspace" : "Preview a Week"} onPress={() => onPreview({})} /><Button title="Personalize My Week" variant="outline" onPress={() => setPersonalizing(true)} /><Copy small muted>Personalization questions and AI are optional. You choose whether to keep the sample week.</Copy>{onSignIn && <Button title="I Already Have an Account" variant="quiet" onPress={onSignIn} />}{onCancel && <Button title={testing ? "Exit Test" : "Cancel and Return"} variant="quiet" onPress={onCancel} />}<NativeTestAccess /></Page>
  return <Page><View style={shared.spread}><Title small>Anew.</Title><Button title="Skip to preview" variant="quiet" onPress={() => onPreview(answers)} /></View><View style={{ gap: 13 }}><Eyebrow>{final ? "YOUR FIRST WEEK" : `${String(step + 1).padStart(2, "0")} / 10 · ${question.label.toUpperCase()}`}</Eyebrow><View accessible accessibilityLabel={final ? "Your week is ready" : `Question ${step + 1} of 10`} style={{ flexDirection: "row", gap: 5 }}>{QUESTIONS.map((item, index) => <View key={item.id} style={{ height: 4, flex: 1, borderRadius: 4, backgroundColor: index <= step ? c.primary : c.line }} />)}</View><Title>{final ? "Begin wherever you are." : question.title}</Title><Copy muted>{final ? summary.length ? "A first week was prepared on this device from your preferences. It uses local rules, without AI." : "A gentle starting week is ready. You can make it your own later." : question.description}</Copy></View>
    {!final && <View style={shared.stack}><Copy small muted>Choose one if you like. Every question is optional.</Copy>{question.choices.map((choice) => <Pressable key={choice.id} accessibilityRole="button" accessibilityState={{ selected: answers[question.id] === choice.id }} {...(Platform.OS === "web" ? { "aria-pressed": answers[question.id] === choice.id } : {})} onPress={() => { sound.tap(); setAnswers((previous) => ({ ...previous, [question.id]: previous[question.id] === choice.id ? "" : choice.id })) }} style={({ pressed }) => ({ minHeight: 72, padding: 17, gap: 4, borderRadius: 16, borderColor: answers[question.id] === choice.id ? c.primary : c.line, borderWidth: 1, backgroundColor: answers[question.id] === choice.id ? c.soft : c.paper, opacity: pressed ? .7 : 1 })}><Copy strong>{choice.title}{answers[question.id] === choice.id ? "  ✓" : ""}</Copy><Copy small muted>{choice.detail}</Copy></Pressable>)}</View>}
    {final && guide && <><Card><Eyebrow>YOUR FIRST SEVEN DAYS</Eyebrow><Title small>{guide.title}</Title><Copy small muted>Seven editable suggestions, with optional space for notes:</Copy>{guide.sections.slice(0, 3).map((section) => <Copy key={section.id}>✓ {section.title}</Copy>)}</Card>{summary.length > 0 && <Card><Copy small strong>Your Chosen Preferences</Copy>{summary.map((item) => <Copy small key={item.label}><Text style={{ fontWeight: "600" }}>{item.label}: </Text>{item.value}</Copy>)}</Card>}<Button title={showReflection ? "Hide Optional Reflection" : "Optional Reflection"} variant="quiet" onPress={() => setShowReflection((value) => !value)} />{showReflection && <Card><Eyebrow>AN OPTIONAL REFLECTION</Eyebrow><Copy style={{ fontFamily: "serif", fontSize: 20, lineHeight: 29 }}>“{quote.text}”</Copy><Copy small strong>{quote.author}{quote.year ? ` · ${quote.year}` : ""}</Copy><Copy small muted>{quote.context}</Copy><Button title="Read the Original Source" variant="quiet" onPress={() => { void openResource(quote.sourceUrl).catch(() => setError("The source could not be opened. Please try again.")) }} /><Button title="Another Reflection" variant="quiet" onPress={() => setQuoteIndex((index) => (index + 1) % ONBOARDING_QUOTES.length)} /></Card>}</>}
    {error && <Copy accessibilityRole="alert">{error}</Copy>}
    <View style={shared.row}><View style={{ flex: 1 }}><Button title="Back" variant="outline" disabled={step === 0} onPress={() => setStep((value) => value - 1)} /></View><View style={{ flex: 2 }}><Button title={final ? testing ? "Start Test Workspace" : onCancel ? "Keep this week" : "Create my account" : "Continue"} onPress={() => final ? onAccount(answers) : setStep((value) => value + 1)} /></View></View>
    <Button title={final ? "Explore my week preview" : "Skip this question"} variant="quiet" onPress={() => final ? onPreview(answers) : setStep((value) => value + 1)} />
    <Copy small muted>{testing ? "Your preferences and test week stays in memory. This test creates no account and sends no AI requests." : "Your preferences stay in memory and are not sent to Firebase or AI. After account acknowledgements, only the derived weekly plan can be saved on this device for your account. Verify your email to use it."}</Copy><Copy small muted>Educational self-care. No psychological approach is imposed. Spiritual content is optional and off by default.</Copy>{onSignIn && <Button title="I already have an account" variant="quiet" onPress={onSignIn} />}{onCancel && <Button title={testing ? "Exit Test" : "Cancel and return"} variant="quiet" onPress={onCancel} />}
  </Page>
}

function NativeAuthScreen({ app, auth, initialMode, onPreview }: { app: App; auth: Auth; initialMode: "login" | "register"; onPreview: () => void }) {
  const [mode, setMode] = useState<"login" | "register" | "reset">(initialMode), [email, setEmail] = useState(""), [password, setPassword] = useState(""), [confirmation, setConfirmation] = useState(""), [visiblePassword, setVisiblePassword] = useState(false), [agreements, setAgreements] = useState({ ...emptyAgreements }), [message, setMessage] = useState<string | null>(null), [legal, setLegal] = useState<Legal | null>(null)
  const accepted = Object.values(agreements).every(Boolean), consent = getConsentCopy("en-US"), unverified = !!auth.user && !auth.user.emailVerified, needsAgreements = !!auth.user && !auth.legalAccepted
  const run = async (action: () => unknown | Promise<unknown>, success?: string) => { setMessage(null); try { await action(); if (success) setMessage(success) } catch (failure) { setMessage(failure instanceof Error ? failure.message : "The action could not be completed. Please try again.") } }
  const submit = () => {
    if (email.trim().toLowerCase() === TEST_EMAIL && !needsAgreements) {
      if (mode === "login" && app.demoAvailable && matchesTestAccess(email, password)) { app.startDemo(app.previewGuide); router.replace("/guide"); return }
      setMessage(mode === "login" && app.demoAvailable ? "Check the example password shown above. This test address never signs in to Firebase." : "This address is reserved for enabled example access. Use another address for real sign-up or recovery."); return
    }
    if (needsAgreements) return void run(() => auth.acceptAgreements(agreements))
    if (mode === "reset") return void run(() => auth.resetPassword(email.trim()), "If this address can receive recovery instructions, check your inbox and spam folder.")
    if (mode === "register") {
      if (password.length < 12) { setMessage("Use at least 12 characters for your password."); return }
      if (password !== confirmation) { setMessage("The passwords must match."); return }
      if (!accepted) { setMessage("Review and check all four acknowledgements."); return }
      return void run(() => auth.signUp(email.trim(), password, agreements))
    }
    if (!auth.configured) { setMessage("Use the example credentials shown above to test Anew. Real account services are not connected in this host."); return }
    void run(() => auth.signIn(email.trim(), password))
  }
  return <><Page><Eyebrow>A SPACE OF YOUR OWN</Eyebrow><Title>{needsAgreements ? "Before you begin." : unverified ? "One last step in your inbox." : mode === "register" ? "Your care, at your own pace." : mode === "reset" ? "Recover your access." : "Good to have you here."}</Title><Copy muted>Plan the next seven days with small steps. Keep only the parts that fit your week.</Copy>
    {!auth.configured && <Card><Copy strong>{auth.testingHost ? "Explore safely in Expo Go" : "Account integration is prepared"}</Copy><Copy small muted>{auth.testingHost ? "This is a shared testing host. Firebase accounts are disabled here. You can explore the preview; enabled test access uses only example records in memory." : "Firebase setup for Anew is deferred. Real sign-up and login become available after the project is connected. You can explore the read-only preview now."}</Copy></Card>}
    <Button title="Explore preview without an account" variant="outline" onPress={onPreview} /><NativeTestAccess />
    {app.demoAvailable && !auth.user && <Card><Eyebrow>EXAMPLE SIGN-IN · TESTING ONLY</Eyebrow><Copy>Use this login to explore Anew without Firebase.</Copy><Copy small selectable style={{ fontFamily: "monospace" }}>Email: {TEST_EMAIL}</Copy><Copy small selectable style={{ fontFamily: "monospace" }}>Password: {TEST_PASSWORD}</Copy><Copy small muted>This opens example records in memory. It creates no account and sends no AI requests.</Copy><Button title="Fill test login" variant="outline" disabled={auth.pending} onPress={() => { setMode("login"); setEmail(TEST_EMAIL); setPassword(TEST_PASSWORD); setConfirmation(""); setMessage(null) }} /></Card>}
    {(auth.error || message) && <Copy accessibilityRole="alert">{message || auth.error}</Copy>}{auth.deletionWarning && <Copy accessibilityRole="alert">{auth.deletionWarning}</Copy>}
    {unverified && !needsAgreements ? <Card><Copy>{auth.user?.email}</Copy><Button title="I have verified my email" disabled={auth.pending} onPress={() => void run(auth.refreshVerification)} /><Button title="Resend verification email" variant="outline" disabled={auth.pending} onPress={() => void run(auth.sendVerification, "Check your inbox and spam folder.")} /><Button title="Sign out and use another address" variant="quiet" disabled={auth.pending} onPress={() => void run(auth.signOut)} /></Card> : <>
      {!needsAgreements && <><View style={shared.wrap}><Pill title="Sign in" selected={mode === "login"} onPress={() => { setMode("login"); setPassword(""); setMessage(null) }} /><Pill title="Create account" selected={mode === "register"} onPress={() => { setMode("register"); setPassword(""); setMessage(null) }} /></View><Field label="Your email" value={email} onChangeText={setEmail} editable={(auth.configured || (mode === "login" && app.demoAvailable)) && !auth.pending} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" maxLength={254} />{mode !== "reset" && <><Field label={mode === "register" ? "Create a password" : "Your password"} value={password} onChangeText={setPassword} secureTextEntry={!visiblePassword} editable={(auth.configured || (mode === "login" && app.demoAvailable)) && !auth.pending} autoCapitalize="none" autoCorrect={false} autoComplete={mode === "register" ? "new-password" : "current-password"} maxLength={128} /><Button title={visiblePassword ? "Hide password" : "Show password"} variant="quiet" onPress={() => setVisiblePassword((value) => !value)} />{mode === "register" ? <><Copy small muted>Use at least 12 characters. A long, unique phrase can be easier to remember.</Copy><Field label="Confirm your password" value={confirmation} onChangeText={setConfirmation} secureTextEntry={!visiblePassword} editable={auth.configured && !auth.pending} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" maxLength={128} /></> : <Button title="Forgot password" variant="quiet" onPress={() => setMode("reset")} />}</>}</>}
      {(mode === "register" || needsAgreements) && <Card><Copy strong>Separate, explicit acknowledgements</Copy>{(["terms", "privacy", "health", "adult"] as const).map((key) => <View key={key} style={{ gap: 2 }}><CheckRow label={consent[key]} checked={agreements[key]} disabled={!auth.configured || auth.pending} onPress={() => setAgreements((value) => ({ ...value, [key]: !value[key] }))} />{key !== "adult" && <Button title={key === "privacy" ? "Read the Privacy Notice" : key === "health" ? "Read the health notice" : "Read the Terms of Use"} variant="quiet" onPress={() => setLegal(key === "privacy" ? "privacy" : "terms")} />}</View>)}<Copy small muted>{consent.explanation}</Copy><Copy small muted>Document version: {LEGAL_VERSION}</Copy></Card>}
      <Button title={auth.pending ? "Please wait…" : needsAgreements ? "Confirm and continue" : mode === "register" ? "Create my account" : mode === "reset" ? "Request recovery" : "Sign in"} disabled={(!auth.configured && !(mode === "login" && app.demoAvailable && !needsAgreements)) || auth.pending || ((mode === "register" || needsAgreements) && !accepted)} onPress={submit} />{mode === "reset" && <Button title="Back to sign in" variant="quiet" onPress={() => setMode("login")} />}
    </>}<View style={shared.wrap}><Button title="Terms of Use" variant="quiet" onPress={() => setLegal("terms")} /><Button title="Privacy Notice" variant="quiet" onPress={() => setLegal("privacy")} /></View><Copy small muted>Anew is educational self-care, not diagnosis, therapy or emergency monitoring.</Copy></Page><LegalSheet document={legal} onClose={() => setLegal(null)} /></>
}

function NativeSchedule({ app, onEdit }: { app: App; onEdit: (id?: string, day?: number) => void }) {
  const week = app.activeWeek
  if (!app.canEdit || !week) return <Copy small muted>Your personal space includes an editable seven-day routine. Activities can be changed, skipped or replaced by rest.</Copy>
  const days = getWeekDays(week.startDate, "en-US"), activities = week.programacao.activities
  return <View style={shared.stack}><Copy small muted>Checks record chosen activities, not health or clinical improvement. There is no need to complete everything.</Copy>{days.map((day) => <Card key={day.dateStr}><View style={shared.spread}><Copy strong>{day.dayName} · {day.formattedShort}</Copy><Button title="Add" variant="quiet" disabled={week.status === "completed"} onPress={() => onEdit(undefined, day.dayIndex)} accessibilityLabel={`Add an activity for ${day.dayName}`} /></View>{activities.filter((activity) => activity.dayIndex === day.dayIndex).sort((a, b) => a.order - b.order).map((activity) => <View key={activity.id} style={{ gap: 2 }}><CheckRow disabled={week.status === "completed"} checked={app.isDone(activity.id)} onPress={() => app.toggleDone(activity.id)} label={`${activity.time} · ${activity.description}`} /><Button title="Edit activity" variant="quiet" disabled={week.status === "completed"} onPress={() => onEdit(activity.id)} /></View>)}{!activities.some((activity) => activity.dayIndex === day.dayIndex) && <Copy small muted>No activities here. Leave room for rest or add a possibility.</Copy>}</Card>)}</View>
}

function NativeBlock({ block, app, onEdit }: { block: Block; app: App; onEdit: (id?: string, day?: number) => void }) {
  const c = useColors()
  if (block.type === "lead") return <Copy strong style={{ fontSize: 18, lineHeight: 28 }}>{block.text}</Copy>
  if (block.type === "p") return <Copy>{block.text}</Copy>
  if (block.type === "h") return <Title small>{block.text}</Title>
  if (block.type === "note") return <Card style={{ backgroundColor: c.soft }}>{block.label && <Copy small strong>{block.label}</Copy>}<Copy small>{block.text}</Copy></Card>
  if (block.type === "list") return <View style={{ gap: 9 }}>{block.items.map((item, index) => <Copy key={index}>• {item}</Copy>)}</View>
  if (block.type === "table") return <View style={shared.stack}>{block.rows.map((row, index) => <Card key={index}>{row.map((cell, column) => <View key={column}><Copy small strong>{block.head[column]}</Copy><Copy small>{cell}</Copy></View>)}</Card>)}</View>
  if (block.type === "schedule") return <NativeSchedule app={app} onEdit={onEdit} />
  if (block.type === "ladder") return <View style={shared.stack}>{block.rows.map((row) => app.canEdit ? <CheckRow key={row.id} label={row.label} disabled={app.activeWeek.status === "completed"} checked={app.isDone(row.id)} onPress={() => app.toggleDone(row.id)} /> : <Copy key={row.id}>• {row.label}</Copy>)}<Copy small muted>Optional possibilities, with no obligation to increase difficulty.</Copy></View>
  if (block.type === "fields") return <View style={shared.stack}>{block.title && <Copy small strong>{block.title}</Copy>}{block.note && <Copy small muted>{block.note}</Copy>}{block.fields.map((field, index) => field.kind === "static" ? <Copy key={index} small>{field.text}</Copy> : !app.canEdit ? <Copy small muted key={field.id}>Optional note · {field.label}</Copy> : field.kind === "scale" ? <View key={field.id} style={{ gap: 8 }}><Field label={`${field.label} (0–${field.max || 10}; optional)`} value={app.getText(field.id)} editable={app.activeWeek.status !== "completed"} onChangeText={(value) => { const clean = value.replace(/[^0-9]/g, "").slice(0, 3); if (!clean || Number(clean) <= (field.max || 10)) app.setText(field.id, clean) }} keyboardType="number-pad" maxLength={3} /><Copy small muted>A personal observation, not a clinical measurement.</Copy></View> : <Field key={field.id} label={field.label} value={app.getText(field.id)} onChangeText={(value) => app.setText(field.id, value)} multiline={field.kind === "textarea"} maxLength={10000} />)}</View>
  return null
}

function Resources({ app }: { app: App }) {
  const [search, setSearch] = useState(""), [category, setCategory] = useState("all"), [region, setRegion] = useState("all"), [savedOnly, setSavedOnly] = useState(false), [error, setError] = useState<string | null>(null)
  const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  const matches = FREE_RESOURCES.filter((resource) => (category === "all" || category === resource.category) && (region === "all" || region === resource.region) && (!savedOnly || app.resourceFavorites.includes(resource.id)) && normalized([resource.titleEn || resource.title, resource.descriptionEn || resource.description, resource.provider, ...resource.tags].join(" ")).includes(normalized(search.trim())))
  return <><Eyebrow>OPEN TO EVERYONE</Eyebrow><Title>A little knowledge. More choice.</Title><Copy muted>{RESOURCE_LIBRARY_NOTE_EN}</Copy><Field label="Search resources" value={search} onChangeText={setSearch} placeholder="Try rest, support or rights" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}><Pill title="All topics" selected={category === "all"} onPress={() => setCategory("all")} />{RESOURCE_CATEGORIES.map((item) => <Pill key={item.id} title={item.labelEn} selected={category === item.id} onPress={() => setCategory(item.id)} />)}</ScrollView><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}><Pill title="All publishers" selected={region === "all"} onPress={() => setRegion("all")} />{[{ id: "US", label: "United States" }, { id: "UK", label: "United Kingdom" }, { id: "AU", label: "Australia" }, { id: "international", label: "Global" }].map((item) => <Pill key={item.id} title={item.label} selected={region === item.id} onPress={() => setRegion(item.id)} />)}</ScrollView><CheckRow label="Show saved resources" checked={savedOnly} onPress={() => setSavedOnly((value) => !value)} /><Copy small muted>{matches.length} English {matches.length === 1 ? "resource" : "resources"} · Publisher region is not service eligibility.</Copy>{error && <Copy accessibilityRole="alert">{error}</Copy>}{matches.map((resource) => <Card key={resource.id}><View style={shared.spread}><Eyebrow>{resource.provider.toUpperCase()}</Eyebrow><Button title={app.resourceFavorites.includes(resource.id) ? "Saved ✓" : "Save"} variant="quiet" onPress={() => app.toggleResourceFavorite(resource.id)} disabled={!app.canEdit} accessibilityLabel={`${app.resourceFavorites.includes(resource.id) ? "Unsave" : "Save"} ${resource.title}`} /></View><Title small>{resource.titleEn || resource.title}</Title><Copy>{resource.descriptionEn || resource.description}</Copy><Copy small muted>{resource.accessEn || resource.access}</Copy><Copy small muted>{resource.region === "international" ? "Global publisher" : `${resource.region} publisher`} · Free English resource</Copy><Button title="Explore resource ↗" variant="outline" onPress={() => { setError(null); void openResource(resource.url).catch(() => setError("This resource could not be opened. Check your connection and try again.")) }} /></Card>)}{matches.length === 0 && <Card><Title small>No resources match yet.</Title><Copy muted>Try another topic or clear your search and filters.</Copy><Button title="Reset filters" onPress={() => { setSearch(""); setCategory("all"); setRegion("all"); setSavedOnly(false) }} /></Card>}</>
}

function NativeWorkspace({ app, auth, tab, onPersonalize }: { app: App; auth: Auth; tab: NativeTab; onPersonalize: () => void }) {
  const c = useColors(), insets = useSafeAreaInsets(), sound = useNativeSound(), alive = useRef(true)
  const [modal, setModal] = useState<ModalName>(null), [editingWeek, setEditingWeek] = useState<string | null>(null), [filePending, setFilePending] = useState(false), [legal, setLegal] = useState<Legal | null>(null), [notice, setNotice] = useState<string | null>(null), [newTitle, setNewTitle] = useState(""), [startDate, setStartDate] = useState(getTodayFormatted()), [backup, setBackup] = useState(""), [activityId, setActivityId] = useState<string | null>(null), [activityDay, setActivityDay] = useState(0), [activityTime, setActivityTime] = useState("16:30"), [activityText, setActivityText] = useState(""), [password, setPassword] = useState(""), [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null), [confirmPending, setConfirmPending] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [tutorialReplay, setTutorialReplay] = useState(0)
  const tourScrollRef = useRef<ScrollView | null>(null), tourContentRef = useRef<View | null>(null)
  const addWeekAnchor = useRef<View | null>(null), activityAnchor = useRef<View | null>(null), notesAnchor = useRef<View | null>(null), historyAnchor = useRef<View | null>(null), moreAnchor = useRef<View | null>(null)
  const confirmationLock = useRef(false)
  const guide = app.canEdit ? app.activeGuide : app.previewGuide || app.activeGuide, week = app.canEdit ? app.activeWeek : null
  const ownsRecords = app.demo || (!auth.testingHost && auth.status === "authenticated" && !!auth.user?.emailVerified && auth.legalAccepted)
  const owner = app.demo ? "demo" : auth.user?.uid || "guest"
  const confirmationAccess = useRef({ owner, edit: app.canEdit, ownerAccess: ownsRecords })
  useLayoutEffect(() => { confirmationAccess.current = { owner, edit: app.canEdit, ownerAccess: ownsRecords } }, [owner, app.canEdit, ownsRecords])
  useLayoutEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const run = async (action: () => unknown | Promise<unknown>, success?: string): Promise<boolean> => { setNotice(null); try { await action(); if (success && alive.current) setNotice(success); return true } catch (failure) { if (alive.current) setNotice(failure instanceof Error ? failure.message : "The action could not be completed. Please try again."); return false } }
  const cancelConfirmation = () => { if (alive.current && !confirmationLock.current) { setConfirmation(null); setNotice(null) } }
  const performConfirmation = async (request: PendingConfirmation) => {
    const current = confirmationAccess.current
    if (!alive.current || confirmationLock.current || request.owner !== current.owner) return
    if (!(request.access === "edit" ? current.edit : current.ownerAccess)) {
      setConfirmation(null); setNotice("Your access changed. Open this action again after restoring account access."); return
    }
    confirmationLock.current = true; setConfirmPending(true); setNotice("Applying your confirmed change…")
    try {
      const result = await request.action()
      if (!alive.current || request.owner !== confirmationAccess.current.owner) return
      if (result === false) { setNotice(request.failure || "The change was not applied. Current records were preserved."); return }
      setConfirmation(null); setNotice(request.success || null)
    } catch (failure) {
      if (alive.current && request.owner === confirmationAccess.current.owner) setNotice(failure instanceof Error ? failure.message : "The action could not be completed. Please try again.")
    } finally {
      confirmationLock.current = false
      if (alive.current) setConfirmPending(false)
    }
  }
  const askConfirmation = (request: ConfirmationRequest) => {
    const current = confirmationAccess.current
    if (!alive.current || confirmationLock.current || !(request.access === "edit" ? current.edit : current.ownerAccess)) return
    const pending = { ...request, owner: current.owner }
    setNotice(null); setConfirmation(pending)
    // React Native Web's Alert is a no-op. Its visible Sheet follows the same guarded actions.
    if (Platform.OS !== "web") Alert.alert(request.title, request.message, [
      { text: "Cancel", style: "cancel", onPress: cancelConfirmation },
      { text: request.label, style: request.destructive ? "destructive" : "default", onPress: () => { void performConfirmation(pending) } },
    ], { cancelable: true, onDismiss: cancelConfirmation })
  }
  const shareBackup = async () => {
    if (!ownsRecords || filePending) return
    const json = app.exportBackup()
    setBackup(json); setFilePending(true); setNotice(null)
    let file: File | null = null
    try {
      if (Platform.OS === "web" || !(await Sharing.isAvailableAsync())) {
        setNotice("File sharing is unavailable here. The JSON below is ready to copy to a private file."); return
      }
      if (!alive.current) return
      file = new File(Paths.cache, `anew-backup-${Date.now()}.json`)
      file.create({ overwrite: false }); file.write(json)
      await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "Save a private Anew backup", UTI: "public.json" })
      if (alive.current) setNotice("The share sheet has closed. Anew cannot confirm whether a copy was saved. Keep any exported file private.")
    } catch {
      if (alive.current) setNotice("The file could not be shared. Your records are unchanged; the JSON below remains available.")
    } finally {
      try { if (file?.exists) file.delete() } catch { if (alive.current) setNotice("The temporary backup could not be removed from the app cache. Keep device access private.") }
      if (alive.current) setFilePending(false)
    }
  }
  const pickBackup = async () => {
    if (!ownsRecords || filePending) return
    setFilePending(true); setNotice(null)
    let cachedCopy: File | null = null
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true, multiple: false })
      if (result.canceled) return
      const asset = result.assets[0]
      // Capture only the picker-created cache copy before any stale-owner or size exit.
      if (Platform.OS !== "web" && asset?.uri) {
        const selected = new File(asset.uri)
        if (selected.uri.startsWith(`${Paths.cache.uri.replace(/\/$/, "")}/`)) cachedCopy = selected
      }
      if (!alive.current) return
      if (!asset || (asset.size ?? 0) > MAX_BACKUP_BYTES) throw new Error("Choose an Anew JSON backup smaller than 10 MB.")
      let json: string
      if (Platform.OS === "web" && asset.file) json = await asset.file.text()
      else {
        const selected = cachedCopy || new File(asset.uri)
        if (selected.size > MAX_BACKUP_BYTES) throw new Error("Choose an Anew JSON backup smaller than 10 MB.")
        json = await selected.text()
      }
      if (!alive.current) return
      if (json.length > MAX_BACKUP_BYTES) throw new Error("This backup is too large. Choose a smaller Anew JSON file.")
      setBackup(json); setNotice("The file is loaded below. Review it, then choose Restore to validate and replace this workspace. Nothing has been imported yet.")
    } catch (failure) {
      if (alive.current) setNotice(failure instanceof Error ? failure.message : "The file could not be read. Current records were preserved.")
    } finally {
      try { if (cachedCopy?.exists) cachedCopy.delete() } catch { /* Cache cleanup never removes the user’s original document. */ }
      if (alive.current) setFilePending(false)
    }
  }
  const editActivity = (id?: string, day = 0) => { const activity = week?.programacao.activities.find((item) => item.id === id); setActivityId(id || null); setActivityDay(activity?.dayIndex ?? day); setActivityTime(activity?.time || "16:30"); setActivityText(activity?.description || ""); setNotice(null); setModal("activity") }
  const leave = () => { if (app.demo) { app.exitDemo(); router.replace("/") } else void run(auth.signOut).then((ok) => { if (ok) router.replace("/") }) }
  const openNewWeek = () => { setNotice(null); app.canEdit ? setModal("create-week") : router.replace("/") }
  const spiritualityEnabled = week?.guideSnapshot?.theologyEnabled ?? guide.theologyEnabled ?? false
  const tourSteps = useMemo<NativeTourStep[]>(() => [
    { title: "Add Week", copy: app.canEdit ? "Choose a pattern and optional expectations here. A new week copies the selected week's setup and daily notes; its activity checks start unchecked." : "Sign in or try the interactive demo to choose a pattern and add a week.", target: addWeekAnchor },
    ...(app.canEdit && !app.starterIsPreview && week?.status !== "completed" ? [
      { title: "Add Activity", copy: "Add a step to this week. The buttons inside each day let you edit or remove its activities. Other weeks keep their own activities.", target: activityAnchor },
      { title: "Customize Notes", copy: "Add, rename, reorder, or remove this week's note sections and fields. These edits apply to this week only.", target: notesAnchor },
    ] : []),
    { title: "Weeks", copy: "Open your week history here. Each week keeps its own notes and checks; Add Week opens the same pattern form.", target: historyAnchor },
    { title: "More", copy: "Find optional resources, backup, and privacy controls here. You can replay Quick Tour from the button at the top of My Week.", target: moreAnchor },
  ], [app.canEdit, app.starterIsPreview, week?.status])
  const tabs: { id: NativeTab; title: string; symbol: string }[] = [{ id: "guide", title: "My Week", symbol: "◇" }, { id: "weeks", title: "Weeks", symbol: "◫" }, { id: "privacy", title: "More", symbol: "···" }]
  return <View style={{ flex: 1, backgroundColor: c.background }}><Page scrollRef={tourScrollRef} contentRef={tourContentRef}><View style={shared.spread}><Title small>Anew.</Title><View style={shared.wrap}><Button title="Quick Tour" variant="quiet" onPress={() => setTutorialReplay((value) => value + 1)} />{app.canEdit && <Button title="More Options" variant="quiet" onPress={() => setModal("settings")} />}<Button title={app.demo ? "Exit Demo" : auth.user ? "Sign Out" : "Sign In"} disabled={auth.pending} variant="quiet" onPress={() => app.demo || auth.user ? leave() : router.replace("/")} /></View></View>
    {app.demo && <Card style={{ backgroundColor: c.soft }}><Eyebrow>{app.demoScenario === "first-visit" ? "FIRST VISIT TEST" : "RETURNING USER TEST · EXAMPLE RECORDS"}</Eyebrow><Copy small>Test freely. Records stay in memory for this session, with no account or AI requests. Downloaded example files stay wherever you save them.</Copy><Button title={app.demoScenario === "first-visit" ? "Restart First Visit" : "Reset Example Records"} variant="outline" onPress={() => { app.resetDemo(); setNotice("The test workspace has been reset.") }} /><Button title="Choose a Test Mode" variant="quiet" onPress={() => setModal("settings")} /></Card>}
    {!app.canEdit && <Card><Eyebrow>{ownsRecords ? "EDITING IS PAUSED" : "YOUR WEEK PREVIEW"}</Eyebrow><Copy small>{ownsRecords ? "Your records are preserved while editing is paused. Use backup recovery below to export, restore or clear local data." : "See how a light week works. Try the demo to edit example steps, or sign in to keep your own week."}</Copy>{app.demoAvailable && <Button title="Try Interactive Demo" onPress={() => app.startDemo(guide)} />}<Button title="Personalize This Preview" variant="quiet" onPress={onPersonalize} /></Card>}
    {auth.deletionWarning && <Copy accessibilityRole="alert">{auth.deletionWarning}</Copy>}{(notice || app.error || app.storageWarning) && <Copy accessibilityRole="alert">{notice || app.error || app.storageWarning}</Copy>}{app.storageWarning && ownsRecords && <Card><Copy strong>Recover your preserved local records</Copy><Copy small muted>Editing is paused. Export the original data before restoring a valid backup or clearing this account’s local records.</Copy><Button title="Open backup recovery" variant="outline" onPress={() => setModal("backup")} /><Button title="Clear this account’s local records" variant="quiet" onPress={() => askConfirmation({ title: "Clear preserved records?", message: "This removes local records for the current account. Export the original first if you want to keep a copy.", label: "Clear local records", access: "owner", destructive: true, action: app.clearLocalData, success: "Local records removed." })} /></Card>}
    {tab === "guide" && <><Eyebrow>YOUR SEVEN-DAY PLANNER</Eyebrow><Title>Seven Days. Small Steps.</Title><Copy muted>Start with a week, adjust its activities and notes, and leave room for rest.</Copy>
      <View ref={addWeekAnchor} collapsable={false}><Button title="Add Week" variant="outline" onPress={openNewWeek} /></View>
      {app.starterIsPreview && <Card><Title small>A Sample Week</Title><Copy muted>Choose whether to keep this sample or add a week with another pattern.</Copy><Button title="Use This Week" onPress={app.useStarterWeek} /><Button title="Add Week" variant="outline" onPress={openNewWeek} /></Card>}
      <Card><Title small>{week?.title ?? "Sample Week"}</Title>{week && <Copy small muted>{formatDateRangeLocale(week.startDate, week.endDate, "en-US")} · {week.status === "completed" ? "Recorded" : "Open"}</Copy>}
        {app.canEdit && !app.starterIsPreview ? <><View style={shared.wrap}><View ref={activityAnchor} collapsable={false}><Button title="Add Activity" variant="outline" disabled={week?.status === "completed"} onPress={() => editActivity()} /></View><Button title="Edit Week Details" variant="quiet" disabled={week?.status === "completed"} onPress={() => { if (!week) return; setEditingWeek(week.id); setNewTitle(week.title); setStartDate(week.startDate); setNotice(null); setModal("week") }} /></View><NativeSchedule app={app} onEdit={editActivity} /></> : guide.weeklyPlan.map((activity) => <View key={activity.id} style={{ gap: 3 }}><Copy small strong>Day {activity.dayIndex + 1}</Copy><Copy>{activity.description}</Copy></View>)}
        {week && !app.starterIsPreview && <><Copy small muted>{app.demo ? "Example changes stay in memory." : app.saveStatus === "saving" ? "Saving on this device…" : "Records stay on this device, separated by account."}</Copy><Button title={week.status === "completed" ? "Reopen This Week" : "Record This Week"} variant="outline" onPress={() => week.status === "completed" ? void run(() => app.reopenWeek(week.id)) : setModal("complete")} /></>}
      </Card>
      {!app.starterIsPreview && <>{app.canEdit && <View ref={notesAnchor} collapsable={false}><Button title="Customize Notes" variant="quiet" disabled={week?.status === "completed"} onPress={() => setModal("sections")} /></View>}
        {(week?.guideSnapshot?.sections ?? guide.sections ?? []).slice(0, app.canEdit ? undefined : 3).map((section) => <Card key={section.id}><Eyebrow>{section.number} · OPTIONAL</Eyebrow><Title small>{section.title}</Title><Button title={openSection === section.id ? "Hide Section" : "Open Section"} variant="quiet" onPress={() => setOpenSection((value) => value === section.id ? null : section.id)} />{openSection === section.id && section.blocks.filter((block) => block.type !== "schedule").map((block, index) => <NativeBlock key={`${section.id}-${index}`} block={block} app={app} onEdit={editActivity} />)}{spiritualityEnabled && section.scripture && <Copy small muted>Spiritual content was explicitly enabled for this week. It is optional.</Copy>}</Card>)}
      </>}
      {!app.canEdit && !auth.user && <Button title="Create My Account" onPress={() => router.replace({ pathname: "/", params: { mode: "register" } })} />}<Copy small muted>Educational self-care, not therapy, diagnosis or emergency monitoring. Rest and support are always valid choices.</Copy></>}
    {tab === "weeks" && <><Eyebrow>ROOM FOR REAL LIFE</Eyebrow><Title>Your Weeks, at Your Pace.</Title><Copy muted>Every week keeps its own setup, notes, and activity checks.</Copy><Button title="Add Week" onPress={openNewWeek} />
      {app.starterIsPreview ? <Card><Title small>Your First Week Is a Preview</Title><Copy>Keep the sample, or use Add Week to choose another pattern.</Copy><Button title="Use This Week" onPress={app.useStarterWeek} /></Card> : !app.canEdit ? <Card><Copy>Your private weeks stay outside the public preview.</Copy>{app.demoAvailable && <Button title="Try the Example Weeks" onPress={() => app.startDemo(guide)} />}</Card> : <>
        {[...app.weeks].sort((a, b) => b.startDate.localeCompare(a.startDate) || b.createdAt.localeCompare(a.createdAt)).map((item) => <Card key={item.id}><Title small>{item.title}</Title><Copy small muted>{formatDateRangeLocale(item.startDate, item.endDate, "en-US")} · {item.status === "completed" ? "Recorded" : "Open"}</Copy><View style={shared.wrap}><Button title={item.id === week?.id ? "Current Week" : "Open Week"} onPress={() => { app.chooseWeek(item.id); router.replace("/guide") }} /><Button title="Edit Week Details" variant="quiet" disabled={item.status === "completed"} onPress={() => { setEditingWeek(item.id); setNewTitle(item.title); setStartDate(item.startDate); setNotice(null); setModal("week") }} /><Button title="Delete Week" variant="quiet" onPress={() => askConfirmation({ title: "Delete This Week?", message: "This removes its local notes and activity records. Other weeks stay unchanged.", label: "Delete Week", access: "edit", destructive: true, action: () => app.deleteWeek(item.id), success: "The week was deleted." })} /></View></Card>)}
        {!app.weeks.length && <Card><Title small>No Weeks Here Yet.</Title><Copy muted>Add a week when you want one.</Copy></Card>}
      </>}
    </>}
    {tab === "resources" && <Resources app={app} />}
    {tab === "privacy" && <Card><Title small>More Options</Title><Button title="Resource Library" variant="outline" onPress={() => router.replace("/resources")} /><Copy small muted>Optional reading is here whenever you want it.</Copy></Card>}
    {tab === "privacy" && <><Eyebrow>CLARITY AND PERSONAL CHOICE</Eyebrow><Title>Your data. Your space.</Title><Card><Title small>Local records</Title><Copy>Weeks, notes and saved resources stay on this device. Anew does not add its own encryption. Signing in does not create cloud backup or synchronize notes between phones.</Copy><Copy small muted>{app.demo ? "Example records live only in memory and are discarded when the demo resets or closes." : "Device access, removal, storage clearing and platform backup behavior matter. Keep exported files private."}</Copy></Card><Card><Title small>Accounts and acknowledgements</Title><Copy>When connected, Firebase handles identity and the acknowledgement record. It does not receive your journal or onboarding answers.</Copy><Copy small muted>Firebase project connection is deferred. Expo Go remains an example testing host.</Copy></Card><Card><Title small>Optional AI and spiritual content</Title><Copy>AI assistance is optional and needs configured account and service access. Review fields before sharing them with Gemini. Local presets make no AI requests. Spiritual content is off by default.</Copy></Card><Card><Title small>External resources</Title><Copy>Resource links open their publisher’s website. Their privacy policies, access rules and regional eligibility apply. Opening a link does not share your notes.</Copy></Card><View style={shared.stack}><Button title="Terms of Use and health notice" variant="outline" onPress={() => setLegal("terms")} /><Button title="Privacy Notice" variant="outline" onPress={() => setLegal("privacy")} /><Button title="Export or restore a backup" disabled={!ownsRecords} onPress={() => setModal("backup")} />{app.demo ? <Button title="Reset example records" variant="outline" onPress={app.resetDemo} /> : <Button title="Delete this account’s local records" disabled={!ownsRecords} variant="outline" onPress={() => askConfirmation({ title: "Delete local records?", message: "Your local weeks and notes for this account will be removed. This does not delete the Firebase account or exported files.", label: "Delete local records", access: "owner", destructive: true, action: app.clearLocalData, success: "Local records removed." })} />}{!app.demo && auth.user && auth.configured && <Button title="Delete Firebase account" variant="danger" onPress={() => { setPassword(""); setDeleteConfirmation(""); setModal("delete") }} />}</View><Copy small muted>The app is not monitored for emergencies. If you are in immediate danger, contact local emergency services. Seek qualified professional support for health concerns.</Copy></>}
  </Page><View accessibilityRole="tablist" style={{ flexDirection: "row", backgroundColor: c.paper, borderTopColor: c.line, borderTopWidth: 1, paddingHorizontal: 8, paddingTop: 7, paddingBottom: Math.max(insets.bottom, 9) }}>{tabs.map((item) => <View key={item.id} ref={item.id === "weeks" ? historyAnchor : item.id === "privacy" ? moreAnchor : undefined} collapsable={false} style={{ flex: 1 }}><Pressable accessibilityRole="tab" accessibilityLabel={item.title} accessibilityState={{ selected: tab === item.id }} aria-selected={Platform.OS === "web" ? tab === item.id : undefined} onPress={() => { sound.tap(); router.replace(`/${item.id}`) }} style={({ pressed }) => ({ flex: 1, minHeight: 53, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 2, alignItems: "center", justifyContent: "center", gap: 2, backgroundColor: tab === item.id ? c.soft : "transparent", opacity: pressed ? .7 : 1 })}><Text style={{ fontSize: 21, color: c.primary }}>{item.symbol}</Text><Text style={{ fontSize: 11, lineHeight: 17, fontWeight: tab === item.id ? "600" : "400", color: tab === item.id ? c.primary : c.muted }}>{item.title}</Text></Pressable></View>)}</View>
    {modal === "create-week" && <NativeWeekCreator onClose={() => setModal(null)} />}
    {modal === "sections" && <NativeSectionEditor guide={{ ...guide, sections: week?.guideSnapshot?.sections ?? guide.sections }} onSave={app.updateWeekSections} onClose={() => setModal(null)} />}
    <Sheet visible={modal === "week"} title="Edit Week Details" onClose={() => setModal(null)}><Field label="Week Name (Optional)" value={newTitle} onChangeText={setNewTitle} placeholder="e.g. A Little Room for Rest" maxLength={100} /><Field label="Start Date · YYYY-MM-DD" value={startDate} onChangeText={setStartDate} placeholder="e.g. 2026-10-19" keyboardType="numbers-and-punctuation" maxLength={10} /><Copy small muted>Changes apply to this week only. The date range covers seven days.</Copy><Button title="Save This Week" onPress={() => { if (!editingWeek || !isValidDate(startDate) || !isValidDate(calculateInclusiveEndDate(startDate))) { setNotice("Enter a real start date with seven valid calendar days as YYYY-MM-DD."); return } void run(() => app.updateWeek(editingWeek, { title: newTitle.trim() || undefined, startDate })).then((ok) => { if (ok) setModal(null) }) }} />{notice && <Copy accessibilityRole="alert">{notice}</Copy>}</Sheet>
    <Sheet visible={modal === "settings"} title="More Options" onClose={() => setModal(null)}><NativeTestAccess onStart={() => setModal(null)} /><Copy strong>Appearance</Copy><View style={shared.wrap}><Pill title="Ivory Paper" selected={app.theme === "light"} onPress={() => app.setTheme("light")} /><Pill title="Evening Green" selected={app.theme === "dark"} onPress={() => app.setTheme("dark")} /></View><Copy small muted>English is the primary language. Resource content is English only.</Copy><CheckRow label="Enable Optional Spiritual Content for This Week" disabled={app.starterIsPreview || week?.status === "completed"} checked={spiritualityEnabled} onPress={() => app.setWeekSpirituality(!spiritualityEnabled)} /><Copy small muted>Off by default. This choice applies to the selected week. It does not make an AI request or add spiritual text.</Copy><Button title="Add Week" variant="outline" onPress={openNewWeek} /><Button title="Backup and Restore" variant="outline" onPress={() => setModal("backup")} /><Button title="Read the Health Notice" variant="quiet" onPress={() => setLegal("terms")} /></Sheet>
    <Sheet visible={modal === "backup"} title="Your local backup" onClose={() => setModal(null)}><Copy>Backups include the selected workspace’s week setups and notes. Keep them private. Import replaces this workspace only after validation.</Copy><Button title={filePending ? "Working with your file…" : "Save or share a backup file"} disabled={filePending || !ownsRecords} onPress={() => void shareBackup()} /><Button title="Choose a backup file" variant="outline" disabled={filePending || !ownsRecords} onPress={() => void pickBackup()} /><Button title="Prepare backup JSON" onPress={() => { setBackup(app.exportBackup()); setNotice("Backup JSON is ready below. Copy it to a private destination, or use Save or share a backup file above.") }} /><Field label="Backup JSON" value={backup} onChangeText={setBackup} multiline autoCapitalize="none" autoCorrect={false} maxLength={10000000} /><Button title="Restore this JSON backup" variant="outline" disabled={!backup.trim() || filePending || !ownsRecords} onPress={() => askConfirmation({ title: "Replace this workspace?", message: "A valid import replaces its current local weeks. Export a copy first if you want to keep them.", label: "Restore", access: "owner", destructive: true, action: () => app.importBackup(backup), success: "The backup was restored.", failure: "The backup was not imported. Check its format; current records were preserved." })} />{notice && <Copy accessibilityRole="alert">{notice}</Copy>}</Sheet>
    <Sheet visible={modal === "complete"} title="Record this week" onClose={() => setModal(null)}><Copy>This saves a local snapshot of your current activities and notes. You do not need to finish every activity. No AI request is made.</Copy><Button title="Save the week record" onPress={() => { void run(() => app.completeWeek(week?.id)).then((ok) => { if (ok) setModal(null) }) }} /><Button title="Keep this week open" variant="quiet" onPress={() => setModal(null)} /></Sheet>
    <Sheet visible={modal === "activity"} title={activityId ? "Edit a possibility" : "Add a possibility"} onClose={() => setModal(null)}><Copy small muted>An activity is optional. Make it accessible, reduce it or choose rest.</Copy><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{getWeekDays(week?.startDate || getTodayFormatted(), "en-US").map((day) => <Pill key={day.dayIndex} title={day.dayName} selected={activityDay === day.dayIndex} onPress={() => setActivityDay(day.dayIndex)} />)}</ScrollView><Field placeholder="e.g. 16:30" label="Example time · HH:MM" value={activityTime} onChangeText={setActivityTime} keyboardType="numbers-and-punctuation" maxLength={5} /><Field placeholder="e.g. A short pause after lunch." label="Your activity" value={activityText} onChangeText={setActivityText} multiline maxLength={500} /><Button title="Save activity" onPress={() => { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(activityTime) || !activityText.trim()) { setNotice("Enter a valid HH:MM time and a short activity description."); return } if (activityId) app.updateActivity(activityId, { dayIndex: activityDay, time: activityTime, description: activityText.trim() }); else app.addActivity({ dayIndex: activityDay, time: activityTime, description: activityText.trim(), countsTowardCompletion: true }); setModal(null) }} />{activityId && <Button title="Delete activity" variant="danger" onPress={() => { app.deleteActivity(activityId); setModal(null) }} />}{notice && <Copy accessibilityRole="alert">{notice}</Copy>}</Sheet>
    <Sheet visible={modal === "delete"} title="Delete your account" onClose={() => { setModal(null); setPassword(""); setDeleteConfirmation("") }}><Copy>This confirms your identity, removes your acknowledgement record and requests Firebase account deletion, then removes this account’s local records. Exported backups and other devices are separate.</Copy><Field label="Current password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} /><Field label="Type DELETE to confirm" value={deleteConfirmation} onChangeText={setDeleteConfirmation} autoCapitalize="characters" autoCorrect={false} /><Button title={auth.pending ? "Deleting…" : "Delete my account"} variant="danger" disabled={auth.pending || deleteConfirmation !== "DELETE" || !password} onPress={() => void run(() => auth.deleteAccount(password)).then((ok) => { if (ok) { setPassword(""); setDeleteConfirmation(""); setModal(null); router.replace("/") } })} />{(notice || auth.error) && <Copy accessibilityRole="alert">{notice || auth.error}</Copy>}</Sheet><Sheet visible={Platform.OS === "web" && !!confirmation} title={confirmation?.title || "Confirm your choice"} onClose={cancelConfirmation}>{confirmation && <><Copy>{confirmation.message}</Copy><Button title="Cancel" variant="outline" disabled={confirmPending} onPress={cancelConfirmation} /><Button title={confirmPending ? "Applying change…" : confirmation.label} variant={confirmation.destructive ? "danger" : "primary"} disabled={confirmPending} onPress={() => { void performConfirmation(confirmation) }} />{notice && <Copy accessibilityRole="alert">{notice}</Copy>}</>}</Sheet><LegalSheet document={legal} onClose={() => setLegal(null)} />
    <NativePlannerTutorial key={`${owner}-${app.demoEpoch}-${tutorialReplay}`} owner={owner} enabled={tab === "guide" && modal === null && legal === null && !confirmation} steps={tourSteps} scrollRef={tourScrollRef} contentRef={tourContentRef} replay={tutorialReplay} autoStart={!app.demo || app.demoScenario === "first-visit"} demoSession={app.demoEpoch} />
  </View>
}

/** Actual React Native screens, mounted by Expo Router. No website or WebView is loaded. */
export function NativeScreens({ tab }: { tab?: NativeTab }) {
  const app = useNativeApp()
  return <NativeScreenBody key={app.demoEpoch} tab={tab} />
}

function NativeScreenBody({ tab }: { tab?: NativeTab }) {
  const app = useNativeApp(), auth = useNativeAuth(), params = useLocalSearchParams<{ mode?: string }>()
  const verifiedOwner = !auth.testingHost && auth.status === "authenticated" && !!auth.user?.emailVerified && auth.legalAccepted
  const [view, setView] = useState<"auth" | "journey">("auth"), [authMode, setAuthMode] = useState<"login" | "register">("login"), [retaking, setRetaking] = useState(false)
  const finish = (answers: OnboardingAnswers, destination: "preview" | "account") => {
    if (retaking && app.canEdit) { app.personalize(hasOnboardingAnswers(answers) ? buildPersonalizedGuide(answers) : createStarterGuide()); setRetaking(false); setView("auth"); router.replace("/guide"); return }
    app.completeOnboarding(answers)
    setRetaking(false); setView("auth")
    if (app.demo || destination === "preview") router.replace("/guide")
    else { setAuthMode("register"); router.replace({ pathname: "/", params: { mode: "register" } }) }
  }
  return <UITheme dark={app.theme === "dark"}>{!app.ready ? <Busy /> : (app.demoJourneyPending || view === "journey" || (!app.demo && !app.onboardingSeen && !app.canEdit && !verifiedOwner)) ? <NativeJourney key={`${app.demoEpoch}-${retaking}`} testing={app.demoJourneyPending} onPreview={(answers) => finish(answers, "preview")} onAccount={(answers) => finish(answers, "account")} onSignIn={!retaking && !app.demo ? () => { app.completeOnboarding({}); setView("auth"); setAuthMode("login"); router.replace("/") } : undefined} onCancel={app.demoJourneyPending ? () => { app.exitDemo(); setView("auth"); router.replace("/") } : retaking ? () => { setRetaking(false); setView("auth") } : undefined} /> : app.canEdit || tab || verifiedOwner ? <NativeWorkspace key={app.demo ? `demo-${app.demoEpoch}` : auth.user?.uid || "guest"} app={app} auth={auth} tab={tab || "guide"} onPersonalize={() => { setRetaking(true); setView("journey") }} /> : <NativeAuthScreen key={`${auth.user?.uid || "guest"}-${params.mode || authMode}`} app={app} auth={auth} initialMode={params.mode === "register" ? "register" : authMode} onPreview={() => router.replace("/guide")} />}</UITheme>
}
