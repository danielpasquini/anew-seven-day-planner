# Anew

Anew is a calm seven-day planner for adults in the United States and Brazil. Its core is a manageable week with small steps: choose a ready-made preset, plan around one personal goal, or start with a blank week. Notes, AI, spiritual content, and the resource library are optional extras. The main promise is **Seven Days. Small Steps. Your Pace.**

The interface opens in English with ivory paper, sage green and a leaf mark. First opening animates a growing branch for about 9.2 seconds; later openings use a brief 1.4-second leaf-on-paper animation. Animations are skippable and respect reduced-motion preferences. Gentle synthesized sounds are opt-in, with visible mute controls; they carry no therapeutic claim.

The first welcome offers a week preview immediately. Ten optional preferences are available only if the person chooses personalization. The first web dashboard includes a skippable guided tour attached to its available controls, replayable from Quick Tour or More. A starter remains a preview until **Use This Week**; no existing records are replaced. All eight week patterns work locally without AI. Optional notes stay folded. App-authored titles use Title Case in both English and Portuguese.

The planner uses **Weeks** throughout. **Add Week** starts with “What do you expect for this week?” and eight local patterns in total: Rest Week, A Gentle Start, Build a Routine, Everyday Balance, One Personal Goal, Build Momentum, More Active Week, and Start With a Blank Week. The progression is voluntary; rest and staying at the same pace remain available. Setup choices, optional fields, and daily notes carry forward from the selected previous Week; completed checkboxes and AI reflections reset. Keeping the same pattern also retains the previous activities; choosing another pattern rebuilds activities from the new preset while preserving notes. Each Week has independent records.

**Edit Week Choices** updates the selected open Week. Keeping its pattern preserves activities and checkmarks; changing it requires confirmation before replacing this Week's activities with the new preset and clearing their checks. Dates, daily notes, custom fields, unrelated note checkboxes, and earlier Weeks remain. **Close Week** keeps its records and can be followed by **Reopen Week**. Checkmarks remain optional; Weeks with no counted activities display **No completion target**.

Further personalization is folded by default: everyday difficulties, habits, psychology preferences, and optional spirituality use selectable choices with an **Other:** text box. Psychology options include optional explanations; they do not assign a diagnosis or turn the planner into psychotherapy. Spirituality starts off. Empty text boxes show grey examples. Preferences save context, and preset activities still need manual changes to fit times or constraints. With an expectation entered, optional **Gemini Suggestions** is a separate action that offers editable setup suggestions after a review and consent step; daily notes are excluded from the request. Suggestions do not overwrite filled fields or create a Week automatically. Legacy guide/template structures remain internal compatibility data, with no separate creation or navigation workflow.

## Local development

```sh
rtk npm ci
rtk npm run dev
```

Open `http://localhost:3000/`. The public preview presents a read-only seven-day starter with optional notes. Resources and privacy information are under More and disclosures. It does not load private records or create an anonymous Firebase account. The web interface also supports explicitly selected Brazilian Portuguese; the native interface and all resource destinations are English.

```sh
rtk npm run typecheck
rtk npm test
rtk npm run build
rtk npm audit
```

The October 13, 2026 implementation checks pass **125 tests: 100 core and 25 AI/API tests**, with zero failures or skipped tests. They execute real modules with explicit external-service fixtures, including signed local JWT fixtures. Web/native TypeScript, Expo lint, the Next production build, and Expo exports for Android, iOS and web pass. Current browser checks cover the isolated demo, saved Week choices, pattern replacement, note preservation, optional help, zero-target closure, actual tour targets, mobile layout, and dialog keyboard behavior. See the [current verification report](docs/APP-VERIFICATION-2026-10-13.txt). The [planner QA review](docs/PLANNER-QA-REVIEW.md) and [earlier test-access and Gemini report](docs/test-access-evidence/verification-report.txt) retain their historical counts and scope.

Missing evidence remains explicit: complete runtime network/storage traces, two disposable live-account backup/deletion flows, OS reduced-motion interaction, human signup and email delivery, authenticated account-to-Gemini behavior, and physical iOS/Android behavior. Expo web rendering and successful exports do not establish physical-device results. The current verification report is not a release sign-off.

### Full local browser run

Use the existing configured `.env.local` privately. Set `NEXT_PUBLIC_ENABLE_DEMO=false` and leave `NEXT_PUBLIC_API_BASE_URL` unset in both that file and the launching shell so the browser uses this server's relative API routes. Retain the Firebase public SDK configuration and server-only AI settings; never put a Gemini key in a `NEXT_PUBLIC_` variable. Rebuild after changing public variables, because Next.js includes them in the browser bundle at build time.

This repository uses `output: 'standalone'`. After a fresh build, copy the public and static assets and start its generated server from the repository root in PowerShell. The generated server changes its working directory, so explicitly load the root `.env.local` at launch. Keep that ignored file server-only; do not copy it into public assets.

```powershell
rtk npm run build
rtk proxy powershell -NoProfile -Command 'Copy-Item -LiteralPath public -Destination .next/standalone/public -Recurse -Force'
rtk proxy powershell -NoProfile -Command 'Copy-Item -LiteralPath .next/static -Destination .next/standalone/.next/static -Recurse -Force'
$env:PORT = "3100"
$env:HOSTNAME = "127.0.0.1"
rtk proxy node --env-file=.env.local .next/standalone/server.js
```

Open `http://127.0.0.1:3100/`. **Try Without an Account** opens the read-only preview. Use your own account through **Sign in** or **Create account**, review the four acknowledgements when requested, and verify your email to open your personal workspace. In **Add Week** or **Edit Week Choices**, enter an expectation, open **Gemini Suggestions**, review the selected fields, and explicitly consent before requesting suggestions. Daily notes are excluded. A separate AI reflection is optional after closing a Week. The disabled demo and reserved test credentials cannot authorize Gemini; `/api/ai-status` reports configuration presence, while a successful real-account request also requires current identity and acknowledgements.

An interactive demo is implemented behind `NEXT_PUBLIC_ENABLE_DEMO` on the web and `EXPO_PUBLIC_ENABLE_DEMO` in the native app. Example environment files and the native production build profile keep these flags `false`. When explicitly enabled for testing, use the normal sign-in form with `tester@anew.local` and `AnewPreview2026!`, or choose the demo button. This public test login opens an isolated, memory-only example workspace; it creates no Firebase account or token, makes no AI request and grants no server authorization. Its reserved email is rejected for real sign-up, recovery and incorrect-password login. The read-only weekly preview remains available separately.

For direct access to both test experiences, open `http://localhost:3000/test` with `NEXT_PUBLIC_ENABLE_DEMO=true`. **First-Time Visit** replays the opening and welcome, offers optional personalization, and opens a clean week without existing notes or history. **Returning User** opens an editable workspace immediately with sample Weeks and completed-week history. **Test the App** at the top of the normal app offers the same choices; use the selector to restart, switch, or exit. Visiting `/test` alone does not mark the real introduction as seen. Native welcome, sign-in, and Settings screens offer **Test First Visit** and **Test Returning User** with `EXPO_PUBLIC_ENABLE_DEMO=true`. Test preferences and records stay in memory, resets clear test edits, and existing account edits must save successfully before switching into a test. Live account registration, email verification/recovery, deletion, and AI still require configured services and a real account; demo access does not simulate successful provider operations.

## Firebase accounts

The Firebase project is `anew-58b4a`. On 2026-10-13, the owner authenticated the Firebase CLI/MCP connection. The existing `(default)` Standard Firestore database in `nam5` was retained, the Anew Web app was registered, Email/Password Authentication was enabled, and the repository's owner-only acknowledgement rules were deployed and read back. Its four public SDK identifiers are configured in the ignored web and native local environment files. No personal guides or journals were uploaded. Platform registrations, Google sign-in provider setup, provider password policy, email templates, and live account lifecycle verification remain release work.

The web and native apps use the modular Firebase JavaScript SDK for Authentication and Firestore. Email/password sign-up, recovery and email verification are prepared. Full access requires a verified email and four unchecked acknowledgements: adult age, Terms of Use, the health notice and the Privacy Notice. The current document version is `2026-10-12-mobile-1`. Web sessions use the configured browser persistence; installed native builds keep authentication tokens in memory and require sign-in again after restarting. Real account services are disabled in Expo Go, even if public Firebase configuration is present.

Onboarding answers remain in memory and are not sent to Firebase or Gemini or saved separately. After account creation and acknowledgements, only the derived planner template for the Week can be staged locally under that UID so email-verification reloads do not lose it. This template uses the internal legacy-compatible storage structure. Verification is required to open the full workspace. An existing saved workspace is preserved; personalization does not silently replace it.

For other environments and before release:

1. Confirm the existing web registration and register the Android and Apple apps in `anew-58b4a`. The current provisional Android package and iOS bundle ID in `native/app.json` are `com.retomada.app`; confirm them before registration and signed builds.
2. Enable Email/Password Authentication. Configure a provider password policy of at least 12 characters, email enumeration protection, authorized domains and verification/recovery messages. Form validation alone does not enforce the provider policy.
3. Confirm the selected Firestore database and deploy the reviewed `firestore.rules`. Current rules permit only the signed-in user's legal-acknowledgement document at `users/{uid}/settings/legal`; guides and journals are not stored there.
4. Fill the four public `NEXT_PUBLIC_FIREBASE_*` settings in the web `.env.local` and the matching `EXPO_PUBLIC_FIREBASE_*` settings in `native/.env.local` from the registered Firebase web app. The current native integration uses the JavaScript SDK; platform registration alone does not install a native Firebase SDK. Preserve server settings. Never put service-account credentials or the Gemini key in public variables or app bundles.
5. Restart development servers and rebuild web/mobile bundles. Validate signup, email verification, password recovery, isolation and account deletion against the configured project before release.

Web Google sign-in is prepared but is not required for Email/Password. Its buttons stay disabled until the Google provider and authorized domains are configured and `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true` is explicitly set. Native Google sign-in is not implemented. Public web documents are at `/termos` and `/privacidade`; `/delete-account` supports account deletion without requiring renewed agreements or verified email. The native app displays the English documents in native modals and provides account deletion in its privacy screen when real account services are configured.

Account deletion reauthenticates the user, flushes pending local edits, suspends further local writes, removes the Firestore acknowledgement and deletes the Firebase user. It then attempts to remove that UID's local records, draft and favorites. Failures and partial local cleanup have distinct messages. Downloaded backups, other devices and data already sent to external providers are separate.

## Local records and backup

Weeks, their plans, notes, reflections and favorites are stored locally by UID: browser storage on the web, AsyncStorage in a configured installed native app. Internal template and snapshot fields keep legacy backups compatible. There is no app-level encryption or synchronization of personal records between devices. Authentication does not encrypt the device. Expo Go and the interactive demo do not persist personal workspaces; non-sensitive app preferences, such as completion of the introduction, can persist separately. Backups should be saved privately.

Legacy web records retain their original, unassigned storage key. They are never silently attached to an account. After verified sign-in, the web privacy panel explains that ownership cannot be established from login and requires explicit ownership confirmation before export. Both apps validate an entire backup before replacing current records. Invalid stored data is preserved for recovery and blocks automatic editing/persistence until repaired or explicitly removed. A verified owner can export, restore or clear preserved native records while editing is paused. Native file sharing uses a temporary cache file; closing the system share sheet does not prove a copy was saved. Web and native backups have distinct schemas; no automatic cross-platform migration is implemented.

## Optional AI

`GEMINI_API_KEY` is server-only. `AI_ENABLED=false` keeps AI disabled. When enabled, API requests require a signed Firebase token, verified email and current acknowledgements read from Firestore. Requests have schema validation, bounded sizes, timeouts, sanitized errors and a per-UID in-memory quota; production scaling needs a shared quota/budget policy.

The ignored local web configuration enables AI using the existing key and `GEMINI_MODEL=gemini-3.1-flash-lite`. The latest fixed synthetic request through the actual server adapter on 2026-10-13 returned HTTP 200 and validated JSON. Transient HTTP 503 responses were also observed and retained in the evidence; the previously configured 3.8 model returned service-unavailable errors. The [current verification report](docs/APP-VERIFICATION-2026-10-13.txt) distinguishes these results from the unverified authenticated account-to-AI flow. Run `rtk npm run check:ai` for a bounded live connectivity check that prints only status and safe configuration metadata. It sends no account or demo records and does not authorize app endpoints. Transient provider errors are retried at most twice within the original deadline; access failures and rate limits are not retried. Sign into a verified real account, acknowledge the current notices, then explicitly consent to use AI for Week setup or reflection. Native AI also needs a deployed HTTPS API origin, which is not set in the local native environment.

**Add Week** and **Edit Week Choices** offer optional AI suggestions for editable setup fields. A verified account, current acknowledgements and consent for the selected fields are required; the person reviews suggestions before applying or saving them. Closing a Week never calls AI automatically. A separate optional reflection excludes journal text unless the person selects it explicitly. Installed native builds use the same authenticated setup endpoint only when `EXPO_PUBLIC_API_BASE_URL` is a valid HTTPS origin and account/service configuration is available; Expo Go and demos never authorize these requests. Local presets remain fully usable without AI. Responses are educational suggestions, not diagnosis, therapy or emergency monitoring. The operator must review the chosen Gemini plan, data restrictions, retention and international transfers before public activation; consent does not override provider restrictions on sensitive data.

## iOS and Android

`native/` is a genuine Expo SDK 57 / React Native 0.86.3 application with Expo Router, native screens, native file selection/sharing and bundled leaf/audio assets. It shares pure content and validation modules with the web app. The previous Capacitor/Vite implementation and its generated platform directories were retired. The current mobile app does not load a website or use a WebView.

```sh
rtk npm run native
# Equivalent when working inside native/:
cd native
rtk proxy npx expo start --go
```

Scan the development server's QR code in an Expo Go version compatible with SDK 57. Test access requires the explicit local demo flag. For checks and bundles, run `rtk npm run native:typecheck`, `rtk npm --workspace native run lint` and `rtk npm run native:export` from the repository root. See [mobile setup and release checks](docs/MOBILE.md) for development builds, EAS profiles, icon generation, backup configuration and store preparation. No private Firebase credentials or Gemini key are copied into the native app.

Expo exports produce Metro/Hermes bundles, not signed APK, AAB or IPA files. No physical iOS/Android installation, real Firebase account flow, device backup/restore test or store submission has been validated. Backup restrictions are configured through Expo app settings and a generation plugin; their effective platform behavior requires generated-build and device verification.

The earlier dependency review identified findings involving `node-forge`, `braces` and a `query-string` URI decoder. It was not rerun for this UI update; its historical counts do not establish the current dependency state. An override to `decode-uri-component` 0.5 was avoided because its ESM interface is incompatible with the installed `query-string` 7 chain. Dependency remediation and compatibility checks remain release work; passing builds does not resolve dependency findings.

## Reviews and remaining decisions

- [Project state](PROJECT-STATE.md): implemented architecture and limits.
- [October 13 app verification](docs/APP-VERIFICATION-2026-10-13.txt): current commands, observations and missing evidence.
- [Psychology review](docs/PSYCHOLOGY-REVIEW.md): plural content, English resources and sourced optional quotations.
- [Backend review](docs/BACKEND-REVIEW.md): authentication, AI and operational limits.
- [Legal review](docs/LEGAL-REVIEW.md): Brazil/US source research, disclosures and release decisions.
- [QA review](docs/QA-REVIEW.md) and [independent QA](docs/QA-INDEPENDENT.md): test evidence and scope.

Before public operation, identify the responsible operator and privacy contact, define account retention and requests, validate the configured Firebase rules and complete the native release checks. Research and code reviews do not constitute professional legal advice, clinical validation, regulatory certification or store approval.
