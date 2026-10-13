# Project state — October 12, 2026

Anew is a calm seven-day planner for adults in Brazil and the United States: **Seven Days. Small Steps. Your Pace.** Its core is a manageable week, with optional notes and extras, without clinical assessment, diagnosis, treatment or emergency monitoring.

| Area | Implementation |
| --- | --- |
| Identity | Anew; ivory/sage, original leaf; provisional native ID `com.retomada.app` |
| Web | Next.js 16.4, React, Tailwind; English default, optional Portuguese interface |
| Mobile | React Native 0.86.3, Expo 57, Expo Router; native screens in `native/`; Capacitor retired |
| Opening | Skippable 9.2-second first branch growth, 1.4-second returning leaf; reduced motion and opt-in sounds |
| Introduction | Immediate week preview; ten personalization questions only if chosen; no AI required |
| Guest | Compact read-only seven-day plan; notes folded; resources secondary under More |
| First Dashboard | Skippable five-step tutorial, replayable from Help/More; starter accepted with Use This Week |
| Presets | Gentle Start, Everyday Balance, One Personal Goal, Blank Week; deterministic and local |
| Customization | Custom section titles and fields, add/remove/reorder; stable IDs and historical section snapshots |
| Test access | Shared public example login on all three platforms; explicit flags; memory-only records |
| Resources | 25 English institutional resources; search, categories, publisher regions and favorites |
| Psychology | Plural perspectives without ranking; spirituality optional and off |
| Auth | Prepared Email/Password, recovery, verification, minimum-12-character validation and four acknowledgements |
| Firebase | Existing `anew-58b4a`; cloud setup and platform registration deferred |
| Firestore | Own legal acknowledgement only; version `2026-10-12-mobile-1`; prepared rules not deployed |
| Records | Owner-scoped local journals, backup and recovery; no cloud sync or app encryption |
| Logout/deletion | Native pending edits flush before sign-out/deletion; errors preserve session/records |
| AI | Optional field suggestions and weekly plan; authenticated web/native requests prepared; runtime configuration still pending |
| Release | Package export passed; binaries, devices, live Firebase and stores pending |

Web providers separate real Auth, the disposable demo and UID-keyed workspaces. Native session guards likewise separate account state from local records. Expo Go disables real account services and uses memory-only sample workspaces. Installed builds use in-memory credentials/cache and local AsyncStorage journals; sign-in after restart is required.

Shared guide data, `lib/onboarding.ts`, resources, legal version and backup validators serve both applications. Raw onboarding answers are never stored or transmitted. Only a validated derived English/secular guide can be staged under an accepted owner's UID before email verification. Existing or malformed records are preserved. Native guards immediately redact stale notes during owner changes and block recovery/export until the correct owner loads.

The public test email is `tester@anew.local` with password `AnewPreview2026!`. UI interception precedes Firebase calls. It creates no authentication identity or server authorization. Release flags default false; the EAS production profile explicitly disables it.

Automated suites passed **95 tests: 77 core and 18 API**. Web/native TypeScript, native lint, Next production compilation and Android/iOS/web exports passed for the planner changes. Separate front-end, back-end, and QA agents reviewed coherent batches and neighboring flows. Live native web checks covered tutorial skip/replay, presets, custom sections/fields, preserved historical notes, and a 390px mobile viewport. Current evidence and external limits are in `docs/PLANNER-QA-REVIEW.md`; prior reviews remain in `docs/QA-INDEPENDENT.md` and `docs/MOBILE.md`.

The dependency audit reports 24 findings (21 high, three moderate) after adding Expo. Upstream braces/node-forge and a query-string URI decoder need follow-up before release. The patched decoder changes to ESM and cannot safely replace the current CommonJS consumer through a version override. Unsupported framework downgrades were not used to silence findings.

Android backup/transfer exclusions and iOS AsyncStorage backup exclusion are prepared for installed builds. Actual storage/backup behavior requires physical tests. No APK, AAB, IPA, store submission or deployment was produced.

Official Firebase skills, CLI and MCP setup are prepared. This task has no authenticated Firebase session. Web/Apple/Android registration, provider enablement, database configuration and deployed-rule tests remain pending. That setup does not add journal synchronization.

Brazil/US source research and public notices are documented. Operator/contact, retention, privacy requests and qualified professional release review remain unresolved. Agent research is not licensed advice, clinical validation, regulatory certification or store approval.
