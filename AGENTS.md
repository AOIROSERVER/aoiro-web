# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

AOIROSERVER App (`aoiro-web`) is a Japanese-language Next.js 14 PWA for a Minecraft/Discord community. Core features include train/road status monitoring, user profiles with gamification, and Discord integration. See `README.md` for full details.

### Dev Commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Build | `npm run build` |

### Environment Setup

- A `.env.local` file is required. At minimum set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `VAPID_PRIVATE_KEY`.
- Without real Supabase credentials, the app starts and renders pages but backend-dependent features (auth, quests, notifications) will not work.
- `VAPID_PRIVATE_KEY` is required for the build to succeed (used at module load time in `/api/notify-all`). Generate one with: `node -e "console.log(require('web-push').generateVAPIDKeys().privateKey)"`.
- hCaptcha test keys are documented in `README.md` (section 4).

### Caveats

- No automated test framework is configured (no jest/vitest). `npm run lint` is the primary code quality check.
- The project has both `.eslintrc.json` (legacy) and `eslint.config.mjs` (flat config). Next.js uses the legacy one via `next lint`.
- Supabase is a hosted external service; there is no local database setup. All DB operations go through the Supabase JS client.
- No Docker, Makefile, or devcontainer setup exists in this repo.
