export type AccountDeletionResult = Readonly<{
  cloudCompleted: true
  localDataRemoved: boolean
}>

type DeletionSteps = {
  uid: string
  isCurrent: () => boolean
  canReportCompletion: () => boolean
  prepareLocal: () => boolean
  resumeLocal: () => void
  removeAcknowledgements: () => Promise<void>
  acknowledgementsRemoved: () => void
  removeAccount: () => Promise<void>
  removeLocalKey: (key: string) => void
  reportCompletion: (result: AccountDeletionResult) => void
}

export class IncompleteAccountDeletion extends Error {
  readonly code = "ACCOUNT_DELETION_INCOMPLETE"
  constructor(cause: unknown) {
    super("Account deletion did not finish after acknowledgement removal", { cause })
  }
}

export function accountDataKeys(uid: string): string[] {
  return [`guia-retomada-v2:${uid}`, `guia-novo-draft:${uid}`, `guia-resource-favorites:${uid}`, `anew-onboarding-guide-v1:${uid}`, `anew-planner-tour:${uid}:v1`]
}

/** Firebase Google sign-in can create a user even on an existing-account route. */
export async function ensureExistingGoogleAccount(isNewUser: boolean | undefined, removeTemporaryAccount: () => Promise<void>): Promise<void> {
  if (isNewUser !== true) return
  try { await removeTemporaryAccount() } catch { throw new Error("NEW_GOOGLE_ACCOUNT_CLEANUP_FAILED") }
  throw new Error("NO_EXISTING_GOOGLE_ACCOUNT")
}

/** Keep local records recoverable until both remote deletions have succeeded. */
export async function performAccountDeletion(steps: DeletionSteps): Promise<AccountDeletionResult> {
  const assertCurrent = () => { if (!steps.isCurrent()) throw new Error("ACCOUNT_CHANGED") }
  let acknowledgementsRemoved = false
  try {
    assertCurrent()
    if (!steps.prepareLocal()) throw new Error("DELETION_STORAGE_BLOCKED")
    assertCurrent()
    await steps.removeAcknowledgements()
    acknowledgementsRemoved = true
    assertCurrent()
    steps.acknowledgementsRemoved()
    assertCurrent()
    await steps.removeAccount()
  } catch (failure) {
    steps.resumeLocal()
    if (acknowledgementsRemoved) throw new IncompleteAccountDeletion(failure)
    throw failure
  }

  // Attempt every owned key, including when a storage policy blocks one of them.
  let localDataRemoved = true
  for (const key of accountDataKeys(steps.uid)) {
    try { steps.removeLocalKey(key) } catch { localDataRemoved = false }
  }
  const result: AccountDeletionResult = { cloudCompleted: true, localDataRemoved }
  // The deleted account may have signed out while another account signed in.
  if (steps.canReportCompletion()) steps.reportCompletion(result)
  return result
}
