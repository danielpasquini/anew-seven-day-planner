import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import Constants, { ExecutionEnvironment } from "expo-constants"
import { getApps, initializeApp } from "firebase/app"
import { EmailAuthProvider, createUserWithEmailAndPassword, deleteUser, initializeAuth, inMemoryPersistence, onAuthStateChanged, reauthenticateWithCredential, reload, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut as firebaseSignOut, validatePassword, type User } from "firebase/auth"
import { deleteDoc, doc, getDoc, initializeFirestore, memoryLocalCache, serverTimestamp, setDoc } from "firebase/firestore"
import { hasCurrentLegalAcceptance, LEGAL_VERSION } from "../../lib/legal"
import { SessionGuard, type SessionTicket } from "../../lib/auth/session-guard"

export type Agreements = { adult: boolean; terms: boolean; privacy: boolean; health: boolean }
export type NativeAccount = Readonly<Pick<User, "uid" | "email" | "emailVerified" | "displayName">>
export type NativeDeletionHandlers = { prepare(): Promise<boolean>; resume(): void; removeLocal(uid: string): Promise<void> }
export const testingHost = Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Boolean(Constants.expoGoConfig)
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}
export const nativeAuthConfigured = !testingHost && Object.values(config).every((value) => typeof value === "string" && value.trim().length > 0)
let services: ReturnType<typeof createServices> | null = null
function createServices() {
  if (!nativeAuthConfigured) throw new Error("AUTH_NOT_CONFIGURED")
  const app = getApps().find((item) => item.name === "anew-native") ?? initializeApp(config, "anew-native")
  // Refresh tokens stay in memory. No authentication credentials go into AsyncStorage.
  const auth = initializeAuth(app, { persistence: inMemoryPersistence })
  const db = initializeFirestore(app, { localCache: memoryLocalCache() })
  return { auth, db }
}
function firebase() { return services ??= createServices() }
const snapshot = (user: User): NativeAccount => ({ uid: user.uid, email: user.email, emailVerified: user.emailVerified, displayName: user.displayName })
export const allAgreed = (agreements: Agreements | undefined): boolean => agreements?.adult === true && agreements.terms === true && agreements.privacy === true && agreements.health === true
function safeError(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : error instanceof Error ? error.message : ""
  switch (code) {
    case "AUTH_NOT_CONFIGURED": return testingHost ? "Expo Go is a testing host. Try the memory-only demo; account services require a configured installed app." : "Account services are awaiting Firebase setup. You can explore the demo."
    case "DEMO_ACCOUNT_BLOCKED": return "Account actions are unavailable during the demo. Exit the demo to continue."
    case "AGREEMENTS_REQUIRED": return "Confirm the terms, privacy acknowledgement, health notice and age requirement."
    case "PASSWORD_POLICY": return "Use at least 12 characters and meet the service's password requirements."
    case "AUTH_REQUIRED": return "Sign in again to continue."
    case "ACCOUNT_CHANGED": return "The active account changed. Sign in again before continuing."
    case "STORAGE_NOT_SAVED": return "Your latest changes could not be saved. Export a backup before trying account deletion again."
    case "SESSION_STORAGE_NOT_SAVED": return "Your latest changes could not be saved. Export a backup or retry saving before signing out. Your account is still signed in."
    case "ACCOUNT_DELETION_INCOMPLETE": return "Acknowledgements were removed, but account deletion did not finish. Local records were preserved. Sign in and retry deletion."
    case "auth/invalid-email": return "Check the email address format."
    case "auth/too-many-requests": return "Too many attempts. Wait before trying again."
    case "auth/network-request-failed": case "unavailable": return "Check your connection and try again."
    case "auth/requires-recent-login": return "Confirm your password again before deleting your account."
    case "permission-denied": return "Your acknowledgements could not be checked or updated. Protected access stays limited."
    default: return "The action could not be completed. Check your details or use password recovery."
  }
}

type NativeAuthValue = {
  configured: boolean; testingHost: boolean; status: "loading" | "guest" | "authenticated"; user: NativeAccount | null
  legalAccepted: boolean; pending: boolean; error: string | null; deletionWarning: string | null
  signIn(email: string, password: string): Promise<void>; signUp(email: string, password: string, agreements: Agreements): Promise<void>
  acceptAgreements(agreements: Agreements): Promise<void>; sendVerification(): Promise<void>; refreshVerification(): Promise<void>
  resetPassword(email: string): Promise<void>; signOut(): Promise<void>; deleteAccount(password: string): Promise<void>; clearError(): void
  setDemoActive(value: boolean): void; registerDeletionHandlers(handlers: NativeDeletionHandlers): () => void
  getAIToken(): Promise<string>
}
const NativeAuthContext = createContext<NativeAuthValue | null>(null)

export function NativeAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<NativeAuthValue["status"]>(nativeAuthConfigured ? "loading" : "guest")
  const [user, setUser] = useState<NativeAccount | null>(null)
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletionWarning, setDeletionWarning] = useState<string | null>(null)
  const mounted = useRef(true)
  const guard = useRef(new SessionGuard())
  const lock = useRef(false)
  const demoActive = useRef(false)
  const aiAccess = useRef({ status, legalAccepted, user })
  aiAccess.current = { status, legalAccepted, user }
  const handlers = useRef<NativeDeletionHandlers | null>(null)
  const setDemoActive = useCallback((value: boolean) => { demoActive.current = value }, [])
  const registerDeletionHandlers = useCallback((value: NativeDeletionHandlers) => {
    handlers.current = value
    return () => { if (handlers.current === value) handlers.current = null }
  }, [])
  const isCurrent = useCallback((account: User, ticket: SessionTicket, legal = false) => mounted.current && firebase().auth.currentUser?.uid === account.uid && guard.current.matches(ticket, legal), [])
  const bindAccount = useCallback((account: User) => {
    if (!mounted.current || firebase().auth.currentUser?.uid !== account.uid) throw new Error("ACCOUNT_CHANGED")
    if (guard.current.transition(account.uid)) { setLegalAccepted(false); setStatus("loading"); setDeletionWarning(null) }
    setUser(snapshot(account))
    return guard.current.capture(account.uid)
  }, [])
  const refreshLegal = useCallback(async (account: User, ticket: SessionTicket) => {
    const record = await getDoc(doc(firebase().db, "users", account.uid, "settings", "legal"))
    if (isCurrent(account, ticket, true)) { setLegalAccepted(hasCurrentLegalAcceptance(record.data())); setStatus("authenticated") }
  }, [isCurrent])
  useEffect(() => {
    const sessionGuard = guard.current
    mounted.current = true
    if (!nativeAuthConfigured) return () => { mounted.current = false }
    const unsubscribe = onAuthStateChanged(firebase().auth, (account) => {
      if (!mounted.current) return
      if (!account) { guard.current.transition(null); setUser(null); setLegalAccepted(false); setStatus("guest"); return }
      const ticket = bindAccount(account)
      void refreshLegal(account, ticket).catch(() => {
        if (isCurrent(account, ticket, true)) { setLegalAccepted(false); setStatus("authenticated"); setError("Your acknowledgements could not be checked. Access stays limited.") }
      })
    })
    return () => { mounted.current = false; sessionGuard.reset(); unsubscribe() }
  }, [bindAccount, refreshLegal, isCurrent])
  const run = useCallback(async (action: () => Promise<void>) => {
    if (lock.current) return
    lock.current = true
    if (mounted.current) { setPending(true); setError(null) }
    try {
      if (demoActive.current) throw new Error("DEMO_ACCOUNT_BLOCKED")
      if (!nativeAuthConfigured) throw new Error("AUTH_NOT_CONFIGURED")
      await action()
    } catch (failure) {
      const message = safeError(failure)
      if (mounted.current) setError(message)
      throw new Error(message)
    } finally { lock.current = false; if (mounted.current) setPending(false) }
  }, [])
  const requireAccount = () => {
    const account = firebase().auth.currentUser
    if (!account) throw new Error("AUTH_REQUIRED")
    return account
  }
  const getAIToken = useCallback(async () => {
    const expectedOwner = user?.uid
    const assertAccess = () => {
      if (demoActive.current) throw new Error("AI is unavailable in the demo. No information is sent to a provider.")
      if (!nativeAuthConfigured) throw new Error("Account services are not configured in this app.")
      const account = firebase().auth.currentUser
      const access = aiAccess.current
      if (!account || !account.emailVerified || access.status !== "authenticated" || !access.legalAccepted || access.user?.uid !== account.uid || account.uid !== expectedOwner) {
        throw new Error("Sign in to a verified account and confirm the acknowledgements before using AI.")
      }
      return account
    }
    const account = assertAccess()
    const ticket = guard.current.capture(account.uid)
    const token = await account.getIdToken()
    if (assertAccess().uid !== account.uid || !isCurrent(account, ticket, true)) throw new Error("The active account changed. Try again from your current account.")
    return token
  }, [isCurrent, user?.uid])
  const saveAgreements = useCallback(async (account: User, agreements: Agreements) => {
    if (!allAgreed(agreements)) throw new Error("AGREEMENTS_REQUIRED")
    bindAccount(account)
    const ticket = guard.current.beginLegalWrite(account.uid)
    let saved = false
    try {
      await setDoc(doc(firebase().db, "users", account.uid, "settings", "legal"), {
        usageTermsVersion: LEGAL_VERSION, privacyVersion: LEGAL_VERSION, healthVersion: LEGAL_VERSION,
        adultConfirmed: true, acceptedAt: serverTimestamp(),
      })
      saved = true
    } finally {
      // Failed writes also invalidate old reads and release the loading state safely.
      if (isCurrent(account, ticket) && guard.current.finishLegalWrite(ticket)) { setLegalAccepted(saved); setStatus("authenticated") }
    }
  }, [bindAccount, isCurrent])
  const signIn = (email: string, password: string) => run(async () => { await signInWithEmailAndPassword(firebase().auth, email.trim(), password) })
  const signUp = (email: string, password: string, agreements: Agreements) => run(async () => {
    if (!allAgreed(agreements)) throw new Error("AGREEMENTS_REQUIRED")
    if (password.length < 12 || password.length > 4096 || !(await validatePassword(firebase().auth, password)).isValid) throw new Error("PASSWORD_POLICY")
    const result = await createUserWithEmailAndPassword(firebase().auth, email.trim(), password)
    await saveAgreements(result.user, agreements)
    const ticket = guard.current.capture(result.user.uid)
    if (!isCurrent(result.user, ticket)) throw new Error("ACCOUNT_CHANGED")
    await sendEmailVerification(result.user)
  })
  const acceptAgreements = (agreements: Agreements) => run(() => saveAgreements(requireAccount(), agreements))
  const sendVerification = () => run(async () => { await sendEmailVerification(requireAccount()) })
  const refreshVerification = () => run(async () => {
    const account = requireAccount(); const ticket = guard.current.capture(account.uid)
    await reload(account)
    if (!isCurrent(account, ticket)) throw new Error("ACCOUNT_CHANGED")
    await account.getIdToken(true)
    if (!isCurrent(account, ticket)) throw new Error("ACCOUNT_CHANGED")
    setUser(snapshot(account)); await refreshLegal(account, guard.current.capture(account.uid))
  })
  const resetPassword = (email: string) => run(async () => { await sendPasswordResetEmail(firebase().auth, email.trim()) })
  const signOut = () => run(async () => {
    const account = requireAccount()
    const ticket = guard.current.capture(account.uid)
    const local = handlers.current
    if (!local) throw new Error("AUTH_REQUIRED")
    try {
      // Freeze edits before draining every accepted write; logout must not revoke a pending note.
      if (!(await local.prepare())) throw new Error("SESSION_STORAGE_NOT_SAVED")
      if (!isCurrent(account, ticket)) throw new Error("ACCOUNT_CHANGED")
      await firebaseSignOut(firebase().auth)
    } catch (failure) { local.resume(); throw failure }
    if (mounted.current && !firebase().auth.currentUser) { guard.current.reset(); setUser(null); setLegalAccepted(false); setStatus("guest") }
  })
  const deleteAccount = (password: string) => run(async () => {
    const account = requireAccount(); const ticket = guard.current.capture(account.uid)
    const local = handlers.current
    if (!local || !account.email) throw new Error("AUTH_REQUIRED")
    const assertCurrent = () => { if (!isCurrent(account, ticket)) throw new Error("ACCOUNT_CHANGED") }
    await reauthenticateWithCredential(account, EmailAuthProvider.credential(account.email, password))
    assertCurrent()
    if (!(await local.prepare())) throw new Error("STORAGE_NOT_SAVED")
    let metadataRemoved = false
    try {
      assertCurrent(); await deleteDoc(doc(firebase().db, "users", account.uid, "settings", "legal")); metadataRemoved = true
      assertCurrent(); setLegalAccepted(false); await deleteUser(account)
    } catch (failure) { local.resume(); if (metadataRemoved) throw new Error("ACCOUNT_DELETION_INCOMPLETE"); throw failure }
    let cleaned = true
    try { await local.removeLocal(account.uid) } catch { cleaned = false }
    if (mounted.current && !firebase().auth.currentUser) {
      guard.current.reset(); setUser(null); setLegalAccepted(false); setStatus("guest")
      setDeletionWarning(cleaned ? null : "Your account was deleted, but local device records could not be removed. Clear this app's storage in device settings.")
    }
  })
  return <NativeAuthContext.Provider value={{ configured: nativeAuthConfigured, testingHost, status, user, legalAccepted, pending, error, deletionWarning, signIn, signUp, acceptAgreements, sendVerification, refreshVerification, resetPassword, signOut, deleteAccount, clearError: () => setError(null), setDemoActive, registerDeletionHandlers, getAIToken }}>{children}</NativeAuthContext.Provider>
}

export function useNativeAuth() {
  const context = useContext(NativeAuthContext)
  if (!context) throw new Error("NativeAuthProvider is required")
  return context
}
