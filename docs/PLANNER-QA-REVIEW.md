# Seven-Day Planner QA Review

Review date: October 12, 2026 (America/Sao_Paulo). This document records independent QA for the current planner changes. Earlier QA documents retain their historical evidence. Existing uncommitted changes were preserved.

## Baseline Verified Directly

- `rtk npm test`: 64 core tests and 16 AI tests passed; no failures or skipped cases.
- `rtk npm run typecheck`: passed.
- `rtk npm run native:typecheck`: passed.
- `rtk npm --workspace native run lint`: passed.

These commands ran before the new planner, tutorial, and guide-editor implementation was complete. They are a baseline, not a final sign-off.

## Added Planner Regression Coverage

Thirteen added tests in `scripts/test-core.cjs` execute the real planner, native AI request helper, native workspace parser, and shared title formatter through the existing TypeScript loader. The updated suite passed all 77 core tests and 18 AI tests during the integrated review.

- Every preset in English and Portuguese validates as a guide. Nonblank presets contain exactly one step for each of seven days; the blank preset contains none. Spirituality stays disabled.
- Separate guide instances have separate IDs, activity IDs, sections, fields, and activity objects.
- The starter preview has stable content, one optional section, one note field, and seven brief suggestions. Mutating a returned starter cannot change another instance.
- Goal, pace, schedule, limits, and custom instructions are retained locally without `fetch` or storage access. Input objects remain unchanged and text lengths are bounded.
- Section reordering, renaming, addition, and deletion preserve surviving field IDs. Historical note values, completed activity state, and guide snapshot versions remain unchanged in the backup fixture.
- Duplicate sections, oversized scales, and too many sections are rejected before changing the original guide. Removing every optional section remains valid.
- Duplicate answer IDs and malformed historical sections are rejected in both current guides and week snapshots.
- Native AI accepts only an explicitly configured HTTPS origin, checks consent and account access before the mocked request, checks account access again before returning a result, validates both response modes, and discards a result cancelled during its final access check. All requests in these tests are intercepted fixtures, with no provider calls.
- Native starter flags and historical section snapshots survive backup parsing. Invalid flag values are refused, and current-guide edits cannot change historical snapshots by aliasing.
- Display Title Case covers English and Portuguese, accented words, punctuation, mixed-case brands, and acronyms. Formatting does not mutate saved text; section revisions explicitly retain their customized marker.

These are module tests. They do not establish that React providers, visible dialogs, native screens, or production Firebase accounts behave correctly.

## Findings Sent To Implementers

1. **Unsaved web notes could be lost on sign-out.** The authentication provider invalidated the session before checking whether local persistence succeeded. Store cleanup then discarded a failed pending write. Backend was asked to block sign-out on a failed flush and keep the workspace recoverable.
2. **Guide activation performed nested state mutations.** `saveAndActivateGuide` created new IDs and called `setWeeks` inside a `setGuides` updater. React updater retries could duplicate weeks. Backend was asked to make the transition pure and create the intended week once per action.
3. **Local demo previews were labeled as AI generated.** Frontend was asked to keep proposal-source labels accurate for no-AI presets and sample guides.
4. **All-skipped onboarding advertised a different preview.** The final onboarding screen built the older personalized guide while launch selected the new compact starter when no questions were answered. Coordination was asked to share the same selection rule and use the actual section count.
5. **Native sheets always animated.** The shared sheet component used a fade even with reduced motion. Coordination was asked to respect reduced motion in new tutorial and editor sheets.

Source review verified the fixes for findings 1–5. Guide activation now creates the intended week outside a state updater; sign-out checks a cancellable flush before invalidating authentication. The no-answer onboarding preview uses the same compact starter as launch and native sheets respect reduced motion. Local proposals now identify themselves as ready-made weeks without AI.

Additional findings were reviewed during the integrated batch checks:

- An unread web startup workspace now blocks automatic edits and persistence. A successful retry that reads an empty account clears the block; explicit restore or reset remains the way to replace unread records. Export re-reads the original and refuses to label a synthetic sample as the preserved backup.
- Initial web workspace write failures retain the exact attempted write in the recoverable save queue. A failed flush can therefore prevent sign-out, and Retry can attempt the real pending write.
- Completed-week section edits are refused until the week is reopened. Historical sections remain in per-week snapshots.
- Native section limits now match the 60-section schema bound. Native editor titles and field labels are checked for empty trimmed values before saving.
- Empty-account native samples stay in memory until Use This Week. A staged derived guide remains available until adoption.
- Native AI cancellation is checked after response parsing and after the final account-access check.
- The title formatter preserves mixed-case brand names such as iOS and eBay without changing stored text.
- Web guide switching and week creation are blocked while the sample remains an unaccepted preview. Read-only workspace controls cannot silently dismiss an unperformed edit.
- Web creation validates the full AI guide before rendering or saving, validates the six draft suggestions, and aborts generation when the modal closes or its owner changes.
- The web tutorial has a heading focus target and live announcement for changed steps. Its flags use the account UID or isolated demo storage; resources and privacy disclosures receive focus when opened from More.
- Schedule moves now append an activity to its destination day, and up/down actions normalize imported equal ranks. Week state actions resolve once outside React updater replay.
- Customized built-in sections are marked to prevent a later template upgrade from overwriting them. Async guide activation reads the latest guides and weeks and refuses a closed workspace.
- Native sample mutations now require explicit adoption; browsing Weeks or changing appearance cannot save an unaccepted sample. The editor receives the viewed week's section snapshot, preserving the context of historical field labels.
- Native tutorial replay remounts its state, uses an owner-specific completion flag, and announces the current step. Optional reflection stays collapsed in the final onboarding preview.

Source review is not a claim that every visible interaction was exercised in a browser or on a device.

## Integrated Automated Checks

- `rtk npm test`: 77 core tests and 18 AI tests passed; no failures or skipped cases.
- `rtk npm run typecheck`: passed after the integrated web review fixes.
- `rtk npm run native:typecheck`: passed during the native second-batch review.
- `rtk npm --workspace native run lint`: passed after four new React hook errors in the creator and tutorial were reported and corrected.

Coordination reported a successful production web build with 11 routes and a successful native export for Android, iOS, and Web. Those commands were owned by coordination and are reported separately from commands directly executed by QA. No real Google provider requests were made by these tests.

The subsequent production web review found that draft section removal relied on a blocking browser confirmation dialog. Frontend replaced that draft-only interaction with immediate removal and Undo. Independent source review verified restoration of original section/field IDs and content at a bounded previous position, preservation of later edits to surviving sections, reverse-order Undo for multiple removals, section-limit and duplicate-ID guards, and focus to Undo/restored summary. A direct web typecheck passed after the correction. Coordination reported a successful final production rebuild after this change. The final visible removal/Undo flow and narrow Portuguese recheck could not be completed because of the automation limits described below; no visible pass is claimed for them.

Final native source review also verified that the privacy copy describes optional configured AI access rather than permanent unavailability. The availability flag requires configured services, a verified legal account, and a non-demo session. The native account introduction now foregrounds seven days and small steps. Coordination reported repeated native typecheck, lint, and all-platform export passing after these source changes.

## Production Web Browser Checks Reported By Coordination

The following results were observed by coordination in the production web app; QA did not independently operate that browser tab.

- Public preview displayed its first-dashboard tutorial, and Skip worked.
- Dialogs appeared within the viewport after the retained-transform layout defect was corrected.
- The isolated demo personal-goal preset accepted a name and focus and showed seven tasks without AI.
- A custom section could be added, its title renamed, and a field given a label and type.
- Use This Week saved the example week, and an entered note remained visible afterward.

The in-app browser test tab then stalled on the earlier native browser confirmation dialog used for section removal. After that interaction was replaced by draft Undo, the available desktop automation fallback was explicitly stopped by its tool because enforcement of browser URL policy was unsupported. Coordination performed no further UI input through that fallback.

The final web field-rename preservation check, section-removal/Undo interaction, and narrow Portuguese recheck therefore remain unverified live. Their source review and successful final production build are separate evidence, not substitutes for a claimed browser pass. Native field rename, section removal, mobile layout, and historical-week preservation were directly exercised as recorded below.

## Native Browser Checks Verified Directly

The native Expo Web app was exercised at `http://localhost:8083` through a separate browser tab, using disposable example records. The older server on port 8082 displayed a blank page and was replaced for the checks. The temporary QA tab was closed after exiting the demo, and the viewport override was reset.

- The first welcome screen foregrounds a seven-day planner. Preview opens the compact starter with one suggestion per day and collapsed optional notes.
- The first-dashboard tutorial opened automatically. Next, Back, Skip, and Help replay worked; entering the separate demo opened its own first tutorial. Skipping did not adopt an account sample.
- The personal-goal preset generated seven steps locally. Its preview included the entered goal; optional instructions were retained with the guide. AI disclosure explicitly stated that demo records do not make AI requests.
- Use This Week opened the new example week. Sections could be added, renamed, moved, and removed; a new field could be given its own label and short-text type.
- A filled note remained visible after its field was renamed and another section removed.
- A second week was created with a later seven-day date range. Editing its section title left the first week's old title and note intact. Opening the first week's editor showed that week's snapshot, rather than the newer template title.
- More contained the optional resource entry. Sounds remained off during the checks, and public/account controls stayed separate from the editable demo.
- At 390 × 844, the tutorial and section editor fit within the viewport with usable scrolling and no horizontal overflow. DOM document width and scroll width were both 390 pixels. Screenshots were inspected for spacing and clipping.
- Keyboard Tab from the modal Close control reached its first field; Tab from Cancel wrapped to Close. No console errors were captured during the tested flows.

These checks validate the native Web rendering, not physical Android/iOS behavior or real authenticated accounts.

## Independent Firebase Rules Source Review

The official `firebase-auth-basics` and `firebase-security-rules-auditor` skills were read. The current rules permit an owner to get, create, update, or delete only their legal-acceptance document. Create and update share the same exact field, version, adult-declaration, and server-timestamp validation. A recursive rule denies all other reads and writes; notes and planner guides remain local.

```json
{
  "score": 5,
  "summary": "The inspected legal-acceptance rules enforce UID ownership and matching create/update validation. This is a static assessment of the local rules file, not an emulator or deployed-rule result.",
  "findings": []
}
```

No remote resources were created or modified by QA.

## Verification Limits

Production web browser checks are owned by coordination. Source review covers both languages and authenticated ownership guards, and module tests exercise backup validation, failure recovery, deletion, and provider contracts; those checks do not prove a real account's visible end-to-end flow.

Live Firebase and Gemini services are not configured for this verification. Physical iOS/Android devices, delivery of authentication emails, OAuth, account deletion against production Firebase, actual Gemini responses, and cross-device behavior remain external verification dependencies. No deployment was performed. Native sample adoption for a real UID was source-reviewed; the underlying UID-bound storage and parser were module-tested. React account switching was not exercised against production accounts.
