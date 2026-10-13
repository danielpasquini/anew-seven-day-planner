"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { EmailAuthProvider, GoogleAuthProvider, createUserWithEmailAndPassword, deleteUser, getAdditionalUserInfo, onAuthStateChanged, reauthenticateWithCredential, reauthenticateWithPopup, reload, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut as firebaseSignOut, validatePassword, type User } from "firebase/auth"
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { hasCurrentLegalAcceptance, LEGAL_VERSION } from "@/lib/legal"
import { authConfigured, getFirebaseServices, prepareAuth } from "./firebase-client"
import { SessionGuard, type SessionTicket } from "./session-guard"
import { isNativePlatform } from "@/lib/platform"
import { ensureExistingGoogleAccount, performAccountDeletion, type AccountDeletionResult } from "./account-deletion"

export type Agreements = { terms: boolean; privacy: boolean; health: boolean; adult: boolean }
export type AccountSnapshot = Readonly<Pick<User, "uid" | "email" | "emailVerified" | "displayName">>
type AuthValue = {
  status: "loading" | "guest" | "authenticated"
  user: AccountSnapshot | null
  configured: boolean
  pendingVerification: boolean
  legalAccepted: boolean
  error: string | null
  busy: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, agreements: Agreements) => Promise<void>
  signInGoogle: (agreements?: Agreements) => Promise<void>
  signInGoogleForDeletion: () => Promise<void>
  signOut: () => Promise<void>
  deleteAccount: (password: string) => Promise<void>
  deletionResult: AccountDeletionResult | null
  resetPassword: (email: string) => Promise<void>
  resendVerification: () => Promise<void>
  refreshVerification: () => Promise<void>
  acceptAgreements: (agreements: Agreements) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthValue | null>(null)
const allAgreed = (v: Agreements | undefined) => v?.terms === true && v.privacy === true && v.health === true && v.adult === true
const snapshotOf = (account: User): AccountSnapshot => ({ uid: account.uid, email: account.email,
  emailVerified: account.emailVerified, displayName: account.displayName })
const safeMessage = (error: unknown) => {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : error instanceof Error ? error.message : ""
  switch (code) {
    case "AUTH_NOT_CONFIGURED": return "Sign-in will become available after Firebase is configured. You can still explore the preview."
    case "AGREEMENTS_REQUIRED": return "Read and confirm the terms, health notice, privacy acknowledgement and adult age requirement."
    case "AUTH_REQUIRED": return "Sign in to your account to continue."
    case "OAUTH_NATIVE_UNAVAILABLE": return "Google sign-in is not available in the installed app yet. Use email and password."
    case "PASSWORD_POLICY": return "Use at least 12 characters and meet the service's password requirements."
    case "auth/invalid-email": return "Check the email address format."
    case "auth/too-many-requests": return "Too many attempts. Please wait before trying again."
    case "auth/network-request-failed": case "unavailable": return "Check your connection and try again."
    case "auth/popup-closed-by-user": case "auth/cancelled-popup-request": return "Google sign-in was cancelled."
    case "auth/popup-blocked": return "Allow the Google sign-in popup in your browser and try again."
    case "auth/requires-recent-login": return "Confirm your identity again before deleting your account."
    case "ACCOUNT_CHANGED": return "The active account changed. Sign in again before continuing."
    case "DELETION_STORAGE_BLOCKED": return "Your latest edits could not be saved. Download a backup or clear this account's local records before trying account deletion again. Your records have been preserved."
    case "SIGN_OUT_STORAGE_BLOCKED": return "Your latest edits could not be saved. Keep this window open and download a backup, then free browser storage and retry saving before signing out."
    case "ACCOUNT_DELETION_INCOMPLETE": return "Your acknowledgements were removed, but your sign-in account could not be deleted. Retry from Account deletion. Your local records have been preserved."
    case "NO_EXISTING_GOOGLE_ACCOUNT": return "No existing Anew account was found for this Google account. The temporary sign-in account was removed; no acknowledgements were saved."
    case "NEW_GOOGLE_ACCOUNT_CLEANUP_FAILED": return "No existing account was found and automatic cleanup could not finish. No acknowledgements were saved. Use this page to delete the temporary sign-in account."
    case "permission-denied": return "The service could not save or remove your acknowledgements. Please try again. Protected access stays limited."
    default: return "The action could not be completed. Check your details or use password recovery."
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthValue["status"]>(authConfigured ? "loading" : "guest")
  const [user, setUser] = useState<AccountSnapshot | null>(null)
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletionResult, setDeletionResult] = useState<AccountDeletionResult | null>(null)
  const guard = useRef(new SessionGuard())
  const mounted = useRef(true)
  const operationLock = useRef(false)
  const operationRevision = useRef(0)

  const readAgreements = useCallback(async (account: User) => {
    const { db } = getFirebaseServices()
    const record = await getDoc(doc(db, "users", account.uid, "settings", "legal"))
    return hasCurrentLegalAcceptance(record.data())
  }, [])

  const isCurrent = useCallback((account: User, ticket: SessionTicket, checkLegal = false) => {
    return mounted.current && getFirebaseServices().auth.currentUser?.uid === account.uid
      && guard.current.matches(ticket, checkLegal)
  }, [])

  const bindAccount = useCallback((account: User) => {
    if (!mounted.current || getFirebaseServices().auth.currentUser?.uid !== account.uid) return null
    if (guard.current.transition(account.uid)) {
      setDeletionResult(null)
      setLegalAccepted(false)
      setStatus("loading")
    }
    setUser(snapshotOf(account))
    return guard.current.capture(account.uid)
  }, [])

  const refreshAgreements = useCallback(async (account: User, ticket: SessionTicket) => {
    const accepted = await readAgreements(account)
    if (isCurrent(account, ticket, true)) {
      setLegalAccepted(accepted)
      setStatus("authenticated")
    }
  }, [isCurrent, readAgreements])

  useEffect(() => {
    mounted.current = true
    if (!authConfigured) return () => { mounted.current = false; guard.current.reset() }
    let disposed = false
    let unsubscribe: (() => void) | undefined
    const deletionCompleted = (event: Event) => {
      const result = (event as CustomEvent<{ uid: string; result: AccountDeletionResult }>).detail?.result
      if (disposed || !result || getFirebaseServices().auth.currentUser !== null) return
      setDeletionResult(result)
      setUser(null); setLegalAccepted(false); setStatus("guest")
    }
    window.addEventListener("retomada:account-deleted", deletionCompleted)
    void prepareAuth().then((auth) => {
      if (disposed) return
      unsubscribe = onAuthStateChanged(auth, (account) => {
        if (disposed) return
        if (!account) {
          guard.current.transition(null)
          setUser(null); setLegalAccepted(false); setStatus("guest")
          return
        }
        const ticket = bindAccount(account)
        if (!ticket) return
        void refreshAgreements(account, ticket).catch(() => {
          if (!disposed && isCurrent(account, ticket, true)) {
            setLegalAccepted(false)
            setError("Your acknowledgements could not be checked. Access stays limited until confirmed.")
            setStatus("authenticated")
          }
        })
      })
    }).catch((failure) => { if (!disposed) { setError(safeMessage(failure)); setStatus("guest") } })
    return () => {
      disposed = true; mounted.current = false; guard.current.reset()
      operationRevision.current += 1
      unsubscribe?.()
      window.removeEventListener("retomada:account-deleted", deletionCompleted)
    }
  }, [bindAccount, isCurrent, refreshAgreements])

  const run = useCallback(async (action: () => Promise<void>) => {
    if (operationLock.current) return
    operationLock.current = true
    const operation = ++operationRevision.current
    setBusy(true); setError(null)
    try {
      await action()
    } catch (failure) {
      const message = safeMessage(failure)
      if (mounted.current && operation === operationRevision.current) setError(message)
      throw new Error(message)
    } finally {
      operationLock.current = false
      if (mounted.current && operation === operationRevision.current) setBusy(false)
    }
  }, [])

  const saveAgreements = useCallback(async (account: User, agreements: Agreements) => {
    if (!allAgreed(agreements)) throw new Error("AGREEMENTS_REQUIRED")
    if (!bindAccount(account)) throw new Error("AUTH_REQUIRED")
    const ticket = guard.current.beginLegalWrite(account.uid)
    const { db } = getFirebaseServices()
    try {
      await setDoc(doc(db, "users", account.uid, "settings", "legal"), {
        usageTermsVersion: LEGAL_VERSION, privacyVersion: LEGAL_VERSION,
        healthVersion: LEGAL_VERSION, adultConfirmed: true, acceptedAt: serverTimestamp(),
      })
    } catch (failure) {
      if (isCurrent(account, ticket) && guard.current.finishLegalWrite(ticket)) {
        setLegalAccepted(false); setStatus("authenticated")
      }
      throw failure
    }
    if (isCurrent(account, ticket) && guard.current.finishLegalWrite(ticket)) {
      setLegalAccepted(true); setStatus("authenticated")
    }
    return ticket
  }, [bindAccount, isCurrent])

  const signIn = (email: string, password: string) => run(async () => {
    const auth = await prepareAuth()
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
    const ticket = bindAccount(credential.user)
    if (ticket) await refreshAgreements(credential.user, ticket)
  })
  const signUp = (email: string, password: string, agreements: Agreements) => run(async () => {
    if (!allAgreed(agreements)) throw new Error("AGREEMENTS_REQUIRED")
    const auth = await prepareAuth()
    if (password.length < 12 || password.length > 128 || !(await validatePassword(auth, password)).isValid) throw new Error("PASSWORD_POLICY")
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
    // Failure keeps protected access limited. Accepted metadata can be retried.
    const ticket = await saveAgreements(credential.user, agreements)
    if (isCurrent(credential.user, ticket)) await sendEmailVerification(credential.user)
    if (isCurrent(credential.user, ticket)) {
      setUser(snapshotOf(credential.user)); setStatus("authenticated")
    }
  })
  const signInGoogle = (agreements?: Agreements) => run(async () => {
    if (isNativePlatform()) throw new Error("OAUTH_NATIVE_UNAVAILABLE")
    if (!allAgreed(agreements)) throw new Error("AGREEMENTS_REQUIRED")
    const auth = await prepareAuth()
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    const credential = await signInWithPopup(auth, provider)
    const ticket = await saveAgreements(credential.user, agreements!)
    if (isCurrent(credential.user, ticket)) {
      setUser(snapshotOf(credential.user)); setStatus("authenticated")
    }
  })
  const signInGoogleForDeletion = () => run(async () => {
    if (isNativePlatform()) throw new Error("OAUTH_NATIVE_UNAVAILABLE")
    const auth = await prepareAuth()
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    const credential = await signInWithPopup(auth, provider)
    // Firebase popup sign-in can provision a user. Never keep a newly created
    // account, save new legal confirmations or unlock records in this route.
    await ensureExistingGoogleAccount(getAdditionalUserInfo(credential)?.isNewUser, () => deleteUser(credential.user))
    const ticket = bindAccount(credential.user)
    if (ticket) await refreshAgreements(credential.user, ticket)
  })
  const signOut = () => run(async () => {
    const auth = await prepareAuth()
    if (auth.currentUser && typeof window !== "undefined") {
      const maySignOut = window.dispatchEvent(new CustomEvent("retomada:before-sign-out", { detail: auth.currentUser.uid, cancelable: true }))
      if (!maySignOut) throw new Error("SIGN_OUT_STORAGE_BLOCKED")
    }
    // Invalidate all pending reads immediately, including a read that later rejects.
    guard.current.reset()
    setLegalAccepted(false); setStatus("loading")
    try { await firebaseSignOut(auth) } catch (failure) {
      const account = auth.currentUser
      const ticket = account ? bindAccount(account) : null
      if (account && ticket) {
        try { await refreshAgreements(account, ticket) } catch {
          if (isCurrent(account, ticket)) { setLegalAccepted(false); setStatus("authenticated") }
        }
      }
      throw failure
    }
    if (mounted.current && !auth.currentUser) { setUser(null); setLegalAccepted(false); setStatus("guest") }
  })
  const resetPassword = (email: string) => run(async () => {
    const auth = await prepareAuth()
    try { await sendPasswordResetEmail(auth, email.trim()) } catch (failure) {
      if ((failure as { code?: string }).code !== "auth/user-not-found") throw failure
    }
  })
  const resendVerification = () => run(async () => {
    const auth = await prepareAuth()
    if (auth.currentUser && !auth.currentUser.emailVerified) await sendEmailVerification(auth.currentUser)
  })
  const refreshVerification = () => run(async () => {
    const auth = await prepareAuth()
    const account = auth.currentUser
    if (!account) return
    const ticket = bindAccount(account)
    if (!ticket) return
    await reload(account)
    if (!isCurrent(account, ticket)) return
    await account.getIdToken(true)
    if (!isCurrent(account, ticket)) return
    setUser(snapshotOf(account))
    await refreshAgreements(account, ticket)
  })
  const acceptAgreements = (agreements: Agreements) => run(async () => {
    const auth = await prepareAuth()
    if (!auth.currentUser) throw new Error("AUTH_REQUIRED")
    await saveAgreements(auth.currentUser, agreements)
  })
  const deleteAccount = (password: string) => run(async () => {
    const auth = await prepareAuth()
    const account = auth.currentUser
    if (!account?.email) throw new Error("AUTH_REQUIRED")
    const uid = account.uid
    if (account.providerData.some((provider) => provider.providerId === "password")) {
      await reauthenticateWithCredential(account, EmailAuthProvider.credential(account.email, password))
    } else {
      if (isNativePlatform()) throw new Error("OAUTH_NATIVE_UNAVAILABLE")
      await reauthenticateWithPopup(account, new GoogleAuthProvider())
    }
    if (auth.currentUser?.uid !== uid || !mounted.current) throw new Error("ACCOUNT_CHANGED")
    const ticket = guard.current.beginLegalWrite(uid)
    setDeletionResult(null)
    try {
      await performAccountDeletion({
        uid,
        isCurrent: () => isCurrent(account, ticket),
        // A's completion must never reset B, including a cross-tab switch.
        canReportCompletion: () => mounted.current && auth.currentUser === null,
        prepareLocal: () => window.dispatchEvent(new CustomEvent("retomada:account-deleting", { detail: uid, cancelable: true })),
        resumeLocal: () => window.dispatchEvent(new CustomEvent("retomada:account-deletion-failed", { detail: uid })),
        removeAcknowledgements: () => deleteDoc(doc(getFirebaseServices().db, "users", uid, "settings", "legal")),
        acknowledgementsRemoved: () => {
          if (isCurrent(account, ticket)) {
            guard.current.finishLegalWrite(ticket)
            setLegalAccepted(false)
          }
        },
        removeAccount: () => deleteUser(account),
        removeLocalKey: (key) => localStorage.removeItem(key),
        reportCompletion: (result) => {
          guard.current.reset()
          setUser(null); setLegalAccepted(false); setStatus("guest")
          setDeletionResult(result)
          window.dispatchEvent(new CustomEvent("retomada:account-deleted", { detail: { uid, result } }))
        },
      })
    } finally {
      if (isCurrent(account, ticket)) guard.current.finishLegalWrite(ticket)
    }
  })

  return <AuthContext.Provider value={{ status, user, configured: authConfigured, pendingVerification: !!user && !user.emailVerified,
    legalAccepted, error, busy, signIn, signUp, signInGoogle, signInGoogleForDeletion, signOut, resetPassword, resendVerification, refreshVerification,
    acceptAgreements, deleteAccount, deletionResult, clearError: () => setError(null) }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
