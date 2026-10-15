# Project state — October 13, 2026

Anew is a calm seven-day planner for adults in Brazil and the United States: **Seven Days. Small Steps. Your Pace.** Its core is a manageable week, with optional notes and extras, without clinical assessment, diagnosis, treatment or emergency monitoring.

| Area | Implementation |
| --- | --- |
| Identity | Anew; ivory/sage, original leaf; provisional native ID `com.retomada.app` |
| Web | Next.js 16.4, React, Tailwind; English default, optional Portuguese interface |
| Mobile | React Native 0.86.3, Expo 57, Expo Router; native screens in `native/`; Capacitor retired |
| Opening | Skippable 9.2-second first branch growth, 1.4-second returning leaf; reduced motion and opt-in sounds |
| Introduction | Immediate week preview; ten personalization questions only if chosen; no AI required |
| Guest | Try Without an Account opens the read-only seven-day preview before account fields; notes folded; resources secondary under More |
| First Dashboard | Web/native tours attached to actual available controls, skippable and replayable from Quick Tour; starter accepted with Use This Week |
| Presets | Eight local patterns in total, including Rest Week and Start With a Blank Week; voluntary pacing from a gentle start to more active options |
| Customization | Add Week copies prior setup/preferences and daily notes independently and resets checks/AI; Edit Week Choices preserves activities/checks for the same pattern and confirms replacement of this Week's activities with a new preset when changing it; notes, custom fields, dates and earlier Weeks remain |
| Preferences | Folded optional choices with Other text and psychology explanations; saved context does not automatically adapt preset times or constraints |
| Completion | Checkmarks optional; actual zero counted activities display No completion target; Close Week preserves records and permits reopening without automatic AI |
| Test access | Shared public example login on all three platforms; explicit flags; memory-only records |
| Resources | 25 English institutional resources; search, categories, publisher regions and favorites |
| Psychology | Plural perspectives without ranking; spirituality optional and off |
| Auth | Prepared Email/Password, recovery, verification, minimum-12-character validation and four acknowledgements |
| Firebase | Existing `anew-58b4a`; recorded October 13 setup includes Anew Web and Email/Password; platform registration and live lifecycle checks remain |
| Firestore | Own legal acknowledgement only; version `2026-10-12-mobile-1`; deployed/read-back rules are recorded in earlier setup evidence; journals remain local |
| Records | Owner-scoped local journals, backup and recovery; no cloud sync or app encryption |
| Logout/deletion | Native pending edits flush before sign-out/deletion; errors preserve session/records |
| AI | Optional Week setup suggestions and separate reflection; latest October 13 synthetic HTTP 200/validated JSON recorded, transient 503 responses also retained; real account/verification/current acknowledgements/action consent still required; native HTTPS backend pending |
| Release | Next production compilation and Android/iOS/web exports pass; signed binaries, physical devices, live account lifecycle and store release remain unverified |

Web providers separate real Auth, the disposable demo and UID-keyed workspaces. Native session guards likewise separate account state from local records. Expo Go disables real account services and uses memory-only sample workspaces. Installed builds use in-memory credentials/cache and local AsyncStorage journals; sign-in after restart is required.

Shared planner content, `lib/onboarding.ts`, resources, legal version and backup validators serve both applications. Legacy guide/template fields remain internal compatibility data, with no separate creation or navigation workflow. Raw onboarding answers are never stored or transmitted. Only a validated derived English/secular planner template for the Week can be staged under an accepted owner's UID before email verification. Existing or malformed records are preserved. Native guards immediately redact stale notes during owner changes and block recovery/export until the correct owner loads.

The public test email is `tester@anew.local` with password `AnewPreview2026!`. UI interception precedes Firebase calls. It creates no authentication identity or server authorization. Release flags default false; the EAS production profile explicitly disables it.

Current automated suites pass **125 tests: 100 core and 25 AI/API**, with zero failures or skipped tests. Web/native TypeScript, native lint, Next production compilation and Android/iOS/web exports pass for the implementation batches. Source and rendered reviews cover neighboring flows, saved choices, pattern replacement, preserved notes, optional help, zero-target closure, actual tutorial targets, keyboard behavior and a 390 × 844 viewport. Native browser observations are Expo web rendering. See the [current verification report](docs/APP-VERIFICATION-2026-10-13.txt). The [earlier planner QA review](docs/PLANNER-QA-REVIEW.md), [independent QA](docs/QA-INDEPENDENT.md), [mobile review](docs/MOBILE.md), and [test-access report](docs/test-access-evidence/verification-report.txt) retain their dated historical totals and scope.

The earlier dependency review identified findings involving braces/node-forge and a query-string URI decoder; it was not rerun for this UI update. Historical audit counts do not establish the current dependency state. The patched decoder changes to ESM and cannot safely replace the current CommonJS consumer through a version override. Dependency follow-up remains separate from passing application builds.

Android backup/transfer exclusions and iOS AsyncStorage backup exclusion are prepared for installed builds. Actual storage/backup behavior requires physical tests. No APK, AAB, IPA, store submission or deployment was produced.

The [recorded October 13 Firebase setup](docs/test-access-evidence/verification-report.txt) reports an authenticated owner CLI/MCP session, retention of the existing Standard default database in `nam5`, Anew Web registration, Email/Password enablement, and owner-only legal rules deployed and read back. This documentation update makes no new cloud verification claim. Apple/Android registrations, Google sign-in, provider policy/templates and human account lifecycle checks remain. Personal journal synchronization is not implemented.

The full local browser application uses the standalone production server at `http://127.0.0.1:3100/` with `NEXT_PUBLIC_ENABLE_DEMO=false` and no `NEXT_PUBLIC_API_BASE_URL` override. Build and asset-copy instructions are in [README](README.md#full-local-browser-run). A real account, verified email, current acknowledgements, and explicit consent are required for Gemini. A synthetic provider success and configuration status do not establish an authenticated account-to-AI flow.

Complete runtime network/storage traces, two disposable live-account backup/deletion flows, OS reduced-motion interaction, signup/email delivery, authenticated account-to-Gemini behavior and physical iOS/Android evidence remain missing. The current verification report records these limits; exports and Expo web checks are not physical-device or release certification.

Brazil/US source research and public notices are documented. Operator/contact, retention, privacy requests and qualified professional release review remain unresolved. Agent research is not licensed advice, clinical validation, regulatory certification or store approval.
