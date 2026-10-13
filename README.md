# Anew

Anew is a calm seven-day planner for adults in the United States and Brazil. Its core is a manageable week with small steps: choose a ready-made preset, plan around one personal goal, or start with a blank week. Notes, AI, spiritual content, and the resource library are optional extras. The main promise is **Seven Days. Small Steps. Your Pace.**

The interface opens in English with ivory paper, sage green and a leaf mark. First opening animates a growing branch for about 9.2 seconds; later openings use a brief 1.4-second leaf-on-paper animation. Animations are skippable and respect reduced-motion preferences. Gentle synthesized sounds are opt-in, with visible mute controls; they carry no therapeutic claim.

The first welcome offers a week preview immediately. Ten optional preferences are available only if the person chooses personalization. The first dashboard includes a skippable five-step tutorial that can be replayed from Help or More. A starter remains a preview until **Use This Week**; no existing records are replaced. Gentle Start, Everyday Balance, One Personal Goal, and Blank Week presets work locally without AI. Optional notes stay folded. Guide sections and their fields can be added, renamed, reordered, and removed; stable field IDs preserve existing answers and each week keeps its section snapshot. App-authored titles use Title Case in both English and Portuguese.

## Local development

```sh
npm ci
npm run dev
```

Open `http://localhost:3000/`. The public preview presents a read-only seven-day starter with optional notes. Resources and privacy information are under More and disclosures. It does not load private records or create an anonymous Firebase account. The web interface also supports explicitly selected Brazilian Portuguese; the native interface and all resource destinations are English.

```sh
npm run typecheck
npm test
npm run build
npm audit
```

The current suites have 95 passing tests: 77 core tests and 18 API tests. They execute the real modules with explicit external-service fixtures, including signed local JWT fixtures. TypeScript checks, Expo lint, the Next production build and Expo exports for Android, iOS and web have passed. Planner browser checks include the isolated demo, custom sections and fields, note preservation, mobile layout, and the tutorial. These checks do not establish a live Firebase connection, email delivery or behavior on a physical phone. See [planner QA evidence](docs/PLANNER-QA-REVIEW.md).

An interactive demo is implemented behind `NEXT_PUBLIC_ENABLE_DEMO` on the web and `EXPO_PUBLIC_ENABLE_DEMO` in the native app. Example environment files and the native production build profile keep these flags `false`. When explicitly enabled for testing, use the normal sign-in form with `tester@anew.local` and `AnewPreview2026!`, or choose the demo button. This public test login opens an isolated, memory-only example workspace; it creates no Firebase account or token, makes no AI request and grants no server authorization. Its reserved email is rejected for real sign-up, recovery and incorrect-password login. The read-only weekly preview remains available separately.

## Firebase accounts

The requested Firebase project is `anew-58b4a`. Official Firebase skills and CLI are available, and a Firebase MCP server has been registered. The owner has deferred cloud setup; the CLI login attempt was stopped before authentication. Registration of web, Apple and Android apps, Email/Password enablement and Firestore configuration remain pending authenticated access and a connected MCP session. No project resources or public app configuration have been fetched or changed.

The web and native apps use the modular Firebase JavaScript SDK for Authentication and Firestore. Email/password sign-up, recovery and email verification are prepared. Full access requires a verified email and four unchecked acknowledgements: adult age, Terms of Use, the health notice and the Privacy Notice. The current document version is `2026-10-12-mobile-1`. Web sessions use the configured browser persistence; installed native builds keep authentication tokens in memory and require sign-in again after restarting. Real account services are disabled in Expo Go, even if public Firebase configuration is present.

Onboarding answers remain in memory and are not sent to Firebase or Gemini or saved separately. After account creation and acknowledgements, only the derived guide can be staged locally under that UID so email-verification reloads do not lose it. Verification is required to open the full workspace. An existing saved workspace is preserved; personalization does not silently replace it.

Before enabling a connected build:

1. Register the web, Android and Apple apps in `anew-58b4a`. The current provisional Android package and iOS bundle ID in `native/app.json` are `com.retomada.app`; confirm them before registration and signed builds.
2. Enable Email/Password Authentication. Configure a provider password policy of at least 12 characters, email enumeration protection, authorized domains and verification/recovery messages. Form validation alone does not enforce the provider policy.
3. Confirm the selected Firestore database and deploy the reviewed `firestore.rules`. Current rules permit only the signed-in user's legal-acknowledgement document at `users/{uid}/settings/legal`; guides and journals are not stored there.
4. Fill the four public `NEXT_PUBLIC_FIREBASE_*` settings in the web `.env.local` and the matching `EXPO_PUBLIC_FIREBASE_*` settings in `native/.env.local` from the registered Firebase web app. The current native integration uses the JavaScript SDK; platform registration alone does not install a native Firebase SDK. Preserve server settings. Never put service-account credentials or the Gemini key in public variables or app bundles.
5. Restart development servers and rebuild web/mobile bundles. Validate signup, email verification, password recovery, isolation and account deletion against the configured project before release.

Web Google sign-in is prepared but is not required for Email/Password. Native Google sign-in is not implemented. Public web documents are at `/termos` and `/privacidade`; `/delete-account` supports account deletion without requiring renewed agreements or verified email. The native app displays the English documents in native modals and provides account deletion in its privacy screen when real account services are configured.

Account deletion reauthenticates the user, flushes pending local edits, suspends further local writes, removes the Firestore acknowledgement and deletes the Firebase user. It then attempts to remove that UID's local records, draft and favorites. Failures and partial local cleanup have distinct messages. Downloaded backups, other devices and data already sent to external providers are separate.

## Local records and backup

Guides, weeks, reflection entries and favorites are stored locally by UID: browser storage on the web, AsyncStorage in a configured installed native app. There is no app-level encryption or synchronization of personal records between devices. Authentication does not encrypt the device. Expo Go and the interactive demo do not persist personal workspaces; non-sensitive app preferences, such as completion of the introduction, can persist separately. Backups should be saved privately.

Legacy web records retain their original, unassigned storage key. They are never silently attached to an account. After verified sign-in, the web privacy panel explains that ownership cannot be established from login and requires explicit ownership confirmation before export. Both apps validate an entire backup before replacing current records. Invalid stored data is preserved for recovery and blocks automatic editing/persistence until repaired or explicitly removed. A verified owner can export, restore or clear preserved native records while editing is paused. Native file sharing uses a temporary cache file; closing the system share sheet does not prove a copy was saved. Web and native backups have distinct schemas; no automatic cross-platform migration is implemented.

## Optional AI

`GEMINI_API_KEY` is server-only. `AI_ENABLED=false` keeps AI disabled. When enabled, API requests require a signed Firebase token, verified email and current acknowledgements read from Firestore. Requests have schema validation, bounded sizes, timeouts, sanitized errors and a per-UID in-memory quota; production scaling needs a shared quota/budget policy.

Guide creation offers optional AI assistance for editable fields and a compact weekly plan. Both actions require explicit consent and a verified account; the person reviews suggestions before applying or saving them. Completing a week never calls AI automatically, and journal text is excluded unless separately selected for review. Installed native builds use the same authenticated guide endpoint only when `EXPO_PUBLIC_API_BASE_URL` is a valid HTTPS origin and account/service configuration is available; Expo Go and demos never authorize these requests. Local presets remain fully usable without AI. Responses are educational suggestions, not diagnosis, therapy or emergency monitoring. The operator must review the chosen Gemini plan, data restrictions, retention and international transfers before activation; consent does not override provider restrictions on sensitive data.

## iOS and Android

`native/` is a genuine Expo SDK 57 / React Native 0.86.3 application with Expo Router, native screens, native file selection/sharing and bundled leaf/audio assets. It shares pure content and validation modules with the web app. The previous Capacitor/Vite implementation and its generated platform directories were retired. The current mobile app does not load a website or use a WebView.

```sh
npm run native
# Equivalent when working inside native/:
cd native
npx expo start --go
```

Scan the development server's QR code in an Expo Go version compatible with SDK 57. Test access requires the explicit local demo flag. For checks and bundles, run `npm run native:typecheck`, `npm --workspace native run lint` and `npm run native:export` from the repository root. See [mobile setup and release checks](docs/MOBILE.md) for development builds, EAS profiles, icon generation, backup configuration and store preparation. No private Firebase credentials or Gemini key are copied into the native app.

Expo exports produce Metro/Hermes bundles, not signed APK, AAB or IPA files. No physical iOS/Android installation, real Firebase account flow, device backup/restore test or store submission has been validated. Backup restrictions are configured through Expo app settings and a generation plugin; their effective platform behavior requires generated-build and device verification.

The current dependency audit reports 24 vulnerabilities: 21 high and 3 moderate. The identified `node-forge` and `braces` advisories have no patched versions available in this dependency graph. An override to `decode-uri-component` 0.5 was avoided because its ESM interface is incompatible with the installed `query-string` 7 chain. Dependency remediation and compatibility checks remain release work; passing builds does not resolve these advisories.

## Reviews and remaining decisions

- [Project state](PROJECT-STATE.md): implemented architecture and limits.
- [Psychology review](docs/PSYCHOLOGY-REVIEW.md): plural content, English resources and sourced optional quotations.
- [Backend review](docs/BACKEND-REVIEW.md): authentication, AI and operational limits.
- [Legal review](docs/LEGAL-REVIEW.md): Brazil/US source research, disclosures and release decisions.
- [QA review](docs/QA-REVIEW.md) and [independent QA](docs/QA-INDEPENDENT.md): test evidence and scope.

Before public operation, identify the responsible operator and privacy contact, define account retention and requests, validate the configured Firebase rules and complete the native release checks. Research and code reviews do not constitute professional legal advice, clinical validation, regulatory certification or store approval.
