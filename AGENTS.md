<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Anew review cadence

Apply this workflow across the project. After every five coherent changes, run an integrated review of the affected flows and their neighboring screens before starting another batch. Review each change individually as well; fix defects as soon as they are found.

- English is the primary language. Check default screens, loading/empty/error states, labels, dialogs and mobile routes for accidental Portuguese, inconsistent capitalization, spelling and brand naming. Explicitly selected language preferences are separate from unintended translation fallbacks.
- Verify navigation, keyboard focus, small-screen layout, reduced motion and sound/mute controls. Confirm that optional questions, spirituality and AI remain optional.
- Exercise the public preview, interactive demo and account paths separately. Demo data must remain isolated from real accounts; never bypass server authentication or send demo records to providers.
- Check UID isolation, backups, deletion, and preservation of existing records. Never log secrets or personal notes.
- Run relevant tests and production builds after a completed batch; repeat only when changes or unresolved failures justify it. Document verified results and remaining external dependencies honestly.
- For Firebase tasks, find and read the applicable official Firebase agent skills first. Use the existing project `anew-58b4a`; inspect existing resources before creating anything.
