"use client"

import { useState } from "react"
import { AuthProvider, useAuth } from "@/lib/auth/client"
import { AccountDeletion, AccountDeletionNotice } from "@/components/account-deletion"
import { isNativePlatform } from "@/lib/platform"

function DeletionAccess() {
  const { user, configured, googleConfigured, status, busy, signIn, signInGoogleForDeletion, resetPassword, error } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  return <main className="mx-auto max-w-xl space-y-6 px-5 py-10">
    <a href="/" className="inline-flex min-h-11 items-center text-primary underline">Return to Anew</a>
    <h1 className="font-serif text-4xl">Account Deletion</h1>
    <p className="text-sm leading-relaxed text-muted-foreground">You can request deletion here or in the app's Privacy area. Sign in to the account you own, confirm your identity, then confirm permanent deletion. You do not need to accept new terms or verify your email to delete an existing account.</p>
    <AccountDeletionNotice />
    {!configured && <p role="status" className="rounded-xl border border-border p-4 text-sm">Account services have not been activated in this development build. No Firebase accounts are created here. This page becomes operational when the Firebase integration is configured.</p>}
    {status === "loading" && <p role="status">Checking your account…</p>}
    {user ? <AccountDeletion /> : <form className="space-y-4 rounded-2xl border border-border bg-card p-5" onSubmit={async (event) => {
      event.preventDefault(); setMessage("")
      try { await signIn(email, password); setPassword("") } catch { /* The shared error is displayed below. */ }
    }}>
      <label className="block text-sm font-medium">Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={!configured || busy} maxLength={254} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-base" /></label>
      <label className="block text-sm font-medium">Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={!configured || busy} maxLength={128} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-base" /></label>
      <button type="submit" disabled={!configured || busy} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-40">Sign In to Manage Deletion</button>
      {!isNativePlatform() && <button type="button" disabled={!googleConfigured || busy} onClick={async () => { setMessage(""); try { await signInGoogleForDeletion() } catch {} }} className="block min-h-11 rounded-xl border border-border px-5 text-sm font-semibold disabled:opacity-40">Use an Existing Google Account</button>}
      <button type="button" disabled={!configured || busy || !email} onClick={async () => { try { await resetPassword(email); setMessage("If this address can receive recovery messages, check your inbox and spam folder.") } catch {} }} className="block min-h-11 text-sm text-primary underline">Request Password Recovery</button>
    </form>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    <p className="text-xs leading-relaxed text-muted-foreground">Deletion removes your Firebase account and acknowledgement record and attempts to remove the current account's local records on this device. It does not delete downloaded backups, records on other devices, shared appearance preferences, technical hosting logs or information previously sent to external services. No cloud journal storage is configured in this version.</p>
    <a href="/privacidade" className="inline-flex min-h-11 text-sm text-primary underline">Read the Privacy Notice</a>
  </main>
}

export function AccountDeletionPage() {
  return <AuthProvider><DeletionAccess /></AuthProvider>
}
