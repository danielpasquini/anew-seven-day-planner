"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/client"
import { Loader2, Trash2 } from "lucide-react"

export function AccountDeletionNotice() {
  const { deletionResult } = useAuth()
  if (!deletionResult) return null
  return <div role={deletionResult.localDataRemoved ? "status" : "alert"} className="space-y-2 rounded-2xl border border-primary/25 bg-primary/5 p-5 text-sm leading-relaxed">
    <p className="font-semibold">Your account and stored acknowledgements were deleted.</p>
    <p>{deletionResult.localDataRemoved ? "This account's records, drafts and favorites were also removed from this device." : "This device blocked local cleanup. Clear this app's storage in browser or device settings to remove its remaining local records."}</p>
    <p className="text-muted-foreground">Downloaded backups, other devices, hosting logs and information previously sent to external providers are separate.</p>
  </div>
}

export function AccountDeletion() {
  const { user, busy, deleteAccount } = useAuth()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  useEffect(() => { setOpen(false); setPassword(""); setConfirmation(""); setError("") }, [user?.uid])
  if (!user) return null
  return <section className="space-y-4 rounded-2xl border border-destructive/30 p-5" aria-labelledby="delete-account-title">
    <h3 id="delete-account-title" className="font-serif text-xl">Delete Your Account</h3>
    <p className="text-sm leading-relaxed text-muted-foreground">Delete your sign-in account, stored acknowledgements and this account's records on this device. This is permanent. Export a backup first if you want to keep your notes. Downloaded files, other devices, hosting logs and information already sent to an external provider are separate.</p>
    <button type="button" onClick={() => { setOpen(!open); setError(""); setPassword(""); setConfirmation("") }} disabled={busy} aria-expanded={open} aria-controls="account-deletion-form" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-destructive/30 px-4 text-sm text-destructive"><Trash2 className="size-4" aria-hidden="true" />{open ? "Cancel Deletion" : "Start Account Deletion"}</button>
    {open && <form id="account-deletion-form" className="space-y-4" onSubmit={async (event) => {
      event.preventDefault()
      if (confirmation !== "DELETE" || busy) return
      setError("")
      try { await deleteAccount(password) } catch (failure) { setError(failure instanceof Error ? failure.message : "Account deletion could not be completed. You can retry.") }
    }}>
      <p className="break-all text-sm">Account: {user.email}</p>
      <label className="block text-sm font-medium">Current Password <span className="font-normal text-muted-foreground">(Google accounts confirm with Google)</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} maxLength={128} className="mt-2 block min-h-11 w-full rounded-xl border border-border bg-background px-3 text-base" /></label>
      <label className="block text-sm font-medium">Type DELETE to Confirm<input autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} className="mt-2 block min-h-11 w-full rounded-xl border border-border bg-background px-3 text-base" /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={busy || confirmation !== "DELETE"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground disabled:opacity-40">{busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}Permanently Delete My Account</button>
    </form>}
  </section>
}
