# Contributing to Anew

Thank you for your interest in contributing to **Anew**! We are committed to building a calm, low-cognitive-load, privacy-first personal planner that supports mental wellness and mindful routines.

To keep the application serene, accessible, and dependable, please take a moment to review our development principles and workflow.

---

## Guiding Principles

1. **Cognitive Kindness**: Every UI element must respect the user's mental bandwidth. Avoid high-saturation warning colors, punitive streak mechanics, unnecessary popups, and aggressive animations.
2. **Local-First & Privacy Sovereign**: Features must work offline and without account credentials whenever possible. Never log personal notes, auth tokens, or telemetry.
3. **Respectful Boundaries**: AI assistance and spiritual reflections are strictly opt-in and neutral. Never impose unsolicited advice.
4. **Lightweight & Efficient**: Maintain the zero-audio-bloat procedural sound philosophy. Do not add heavy external audio or 3D canvas libraries unless explicitly discussed.
5. **Accessibility**: All interactive elements must maintain WCAG AA contrast (minimum 4.5:1), visible focus states, and keyboard navigation.

---

## Development Setup

### 1. Prerequisites
- **Node.js**: `20.x` or higher
- **npm**: `10.x` or higher

### 2. Local Installation
```bash
git clone https://github.com/danielpasquini/anew-seven-day-planner.git
cd anew-seven-day-planner
npm install
```

### 3. Running Locally
```bash
# Start Web development server
npm run dev

# Open http://localhost:3000
```

### 4. Running the Native Workspace (Mobile)
```bash
# Start Expo development server
npm run native

# Check TypeScript types for native workspace
npm run native:typecheck
```

---

## Testing & Quality Assurance

Before submitting any Pull Request, ensure that all automated tests and typechecks pass:

```bash
# Run unit & contract test suite (100+ tests)
npm test

# Run TypeScript validation across web workspace
npm run typecheck
```

### Interactive Test Scenarios
You can verify features across different user states without resetting your browser cache by using the testing portal at:
- `http://localhost:3000/test?scenario=first-visit`
- `http://localhost:3000/test?scenario=returning`
- `http://localhost:3000/test?scenario=guest`
- `http://localhost:3000/test?scenario=free`
- `http://localhost:3000/test?scenario=premium`

---

## Pull Request Guidelines

1. **Branch Naming**: Use descriptive branch names:
   - `feature/calm-preset-enhancement`
   - `fix/audio-context-visibility-pause`
   - `docs/clarify-web-audio-synthesis`
2. **Atomic Commits**: Keep commits concise and meaningful with clear messages.
3. **Documentation**: If your change introduces or modifies features, please update `README.md` or the corresponding reference in `docs/`.
4. **Verification**: Run `npm test` and `npm run typecheck` before pushing your branch.

Thank you for helping make Anew a calmer space for everyone.
