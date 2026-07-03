---
id: PIX-15
type: story
status: done
title: Dev/QA auth bypass for web-admin (so authed flows are actually testable)
---

**Closed:** 2026-06-05.

PROBLEM (root cause of the 2026-05-28 login breakage): the web-admin requires a real Supabase Auth session. Forge specialist containers have no session, so (a) their browser-tools visual verification only ever renders the login page — every authenticated screen (dashboard populated, device Teams/Settings, admin) goes visually UNVERIFIED; and (b) to make their container dev server boot, a specialist wrote web-admin/.env.local with NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co. Because /project is mounted rw, that file leaked onto the real machine and overrode web-admin/.env, breaking local login (browser posted to placeholder.supabase.co/auth/v1/token). Fixed for now by deleting the placeholder .env.local (web-admin/.env has the real creds).

PROPOSED FIX — a dev-only auth bypass:
- A mock-session path gated behind an env flag (e.g. NEXT_PUBLIC_DEV_AUTH_BYPASS=true) that injects a fake authenticated session (and optionally a couple of mock devices) so the app renders authed views WITHOUT a real Supabase session.
- HARD prod-safety: the bypass must be impossible to enable in production (guard on NODE_ENV !== production AND the explicit flag; never default-on).
- Document it in CLAUDE.md Stack section — the forge frontend-specialist seed explicitly checks there for "dev auth instructions (bypass env vars, test credentials, mock auth setup)." With it documented, specialists set the flag in-container, render authed screens, and do REAL visual verification — no need to touch Supabase config, no .env.local leak.

ALSO: instruct specialist passes to NEVER create/modify web-admin/.env.local (it is the real local config). Consider adding web-admin/.env.local.example with placeholders + a note, but never write a real/placeholder .env.local in automation.

This is what makes the rest of the redesign actually verifiable.