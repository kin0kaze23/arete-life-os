# AreteLifeOS — Claude Code Instructions

> Auto-loaded by Claude Code on every session in this project.
> These rules override default behavior. Follow exactly.

---

## Identity

AreteLifeOS is a **premium life operating system** — an AI-powered personal productivity platform for iOS.

**Core Philosophy:**

- Premium, calming aesthetic (not generic AI)
- Privacy-first with local-first storage
- AI that feels like a thoughtful human, not a robot
- Mobile-first (iOS via Capacitor)

---

## Architecture

```
React 19 + Vite + TypeScript
  └── src/                    # React components, hooks, utils
  └── components/             # Feature components
  └── lib/                    # Core libraries (auth, storage, AI)

Capacitor (iOS)
  └── capacitor.config.ts    # iOS configuration
  └── ios/                    # Native iOS project

AI Integration
  └── Google Gemini           # Primary AI
  └── OpenAI                  # Fallback AI
```

---

## Tech Stack

| Layer      | Technology                         |
| ---------- | ---------------------------------- |
| Frontend   | React 19 + Vite                    |
| Language   | TypeScript                         |
| Mobile     | Capacitor (iOS)                    |
| AI         | Google Gemini, OpenAI              |
| Storage    | Local-first (Capacitor Filesystem) |
| Deployment | Vercel                             |

---

## Ports

| Service       | Port |
| ------------- | ---- |
| Client (Vite) | 5173 |

---

## Common Commands

```bash
# Setup (run once per clone)
nvm use 20
npm install
npm run setup:hooks

# Development
npm run dev

# Quality gates
npm run doctor           # Pre-commit validation
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm run test             # Unit tests
npm run test:e2e         # E2E tests (Playwright)

# Build
npm run build            # Production build
npm run preview          # Preview build
```

---

## Environment Variables

Required in `.env` (DO NOT COMMIT):

```bash
# AI Providers
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key

# Optional
VITE_API_URL=local
```

---

## Project Structure

```
AreteLifeOS/
├── src/
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Core libraries
│   │   ├── auth/         # Authentication
│   │   ├── storage/      # Local storage
│   │   └── ai/           # AI integration
│   └── App.tsx           # Main app
├── ios/                  # Native iOS (generated)
├── capacitor.config.ts   # iOS config
└── .nvmrc               # Node 20
```

---

## Delivery Model

| Environment       | Purpose     | Branch           |
| ----------------- | ----------- | ---------------- |
| Local             | Development | Feature branches |
| Vercel Preview    | Staging/QA  | PRs              |
| Vercel Production | Production  | `main`           |

---

## Critical Rules

1. **Never commit `.env` files** — Add to `.gitignore`
2. **Use feature branches** — Never commit directly to main
3. **Run `npm run doctor` before PR** — Validates lint + typecheck + tests
4. **Honor `.nvmrc`** — Use Node 20 (`nvm use 20`)
5. **Vercel preview first** — Test on preview before merging to main

---

## Known Issues

- iOS builds require Xcode
- AI API rate limits apply
- Local dev needs `.env` with API keys

---

## Related

- `docs/DEVELOPMENT.md` — Dev setup guide
- `docs/DEPLOYMENT.md` — Deployment guide
- `GATES.md` — Quality gate definitions
