# Firestore access review

Reviewed October 12, 2026. Status: **restricted design reviewed; emulator and deployed project unverified**.

This document replaces the obsolete August audit that claimed recursive access to all user subcollections and “READY FOR DATA MIGRATION.” Its former “26/26” JavaScript simulator result did not execute Google's Firestore rules engine and is not evidence for the present rules. There is no cloud journal migration enabled in this version.

## Actual rule surface

| Document / operation | Current rule |
| --- | --- |
| `users/{uid}/settings/legal`, get | Signed-in account's UID must equal `{uid}`. Email verification is not required to read registration metadata. |
| Same document, create or update | Owner only; exact five-field schema, all three document versions equal `2026-10-12-mobile-1`, adult confirmation true, and `acceptedAt` is a timestamp equal to `request.time`. Use a server timestamp. |
| Same document, delete | Owner only. Removal disables protected server features that require a current acceptance record. |
| Collection listing | No `list` permission is defined. |
| User root, other settings, guides, weeks, journals, backups, nested or global paths | Denied, including requests by the owner. |

Required fields are `usageTermsVersion`, `privacyVersion`, `healthVersion`, `adultConfirmed`, `acceptedAt`; missing and extra fields are rejected. A root user document is unnecessary. No recursive owner-write rule or public allow rule is present. Future cloud schemas require a separate review and changed notices before permission is added.

`lib/legal.ts` and `firestore.rules` were updated together for this material web/mobile revision. Client code writes these fields with `serverTimestamp()`. `hasCurrentLegalAcceptance` is a UI gate, not server authorization. The protected server API separately verifies token signature/claims, verified email, current versions, adult declaration, and a valid acceptance timestamp from Firestore through the requesting user's token. It does not accept a client-supplied body as proof of acceptance. An adult declaration does not verify actual age or identity.

Rules govern Firestore client/token requests, not the security of local storage. Administrative credentials could bypass these rules and need independent protection; this app's acceptance check is designed to use the user's token rather than a service account. Authentication does not encrypt browser/webview notes. Firebase configuration has not been supplied, so no deployed rule match or live request has been verified.

## Account deletion and acceptance evidence

The prepared deletion flow reauthenticates, stops pending local writes, deletes the acceptance document, requests Firebase Auth deletion, and attempts current-device cleanup for that UID. The rule's owner-delete permission supports this flow. Failure between these operations is possible; do not describe the sequence as atomic or silently re-create acceptance metadata while retrying. Other devices and external copies are outside local cleanup.

This record stores the **most recent** acknowledgement only. It is not an immutable audit of every accepted document version or separate proof of each checkbox interaction. Decide whether historical evidence is necessary before launch; if needed, implement a server-managed, access-restricted history with defined purpose and retention. Do not open a client-writable history collection by analogy with the obsolete catch-all rule.

## Required emulator and deployment checks

Execute the actual rules engine using the Firebase emulator before release, covering:

- Valid owner create/update using server timestamp; owner get/delete; registration before verified email.
- Anonymous and another UID denied for get, create, update, and delete.
- Missing/extra fields, outdated versions, false or malformed adult confirmation, client-supplied dates, and malformed timestamp values denied.
- Listing and every unapproved root/nested/global path denied even for the owner.
- Removing acceptance metadata limits protected API access; retrying partial account deletion does not grant access or lose another account's local data.

Then deploy the reviewed rules to the intended project and verify them through authenticated real requests without logging private tokens or sensitive content. Record the project, rule revision, commands, and observed results. Unit tests of TypeScript parsing or a mirrored JavaScript expression must not be relabeled as emulator or deployed-rules validation.

No emulator run, native deletion test, live Firebase operation, or production deployment was verified by this review. There is therefore no security-readiness or migration certification. See `LEGAL-REVIEW.md` for release blockers and privacy/health context.
