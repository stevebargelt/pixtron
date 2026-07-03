---
id: PIX-29
type: story
status: active
title: "web-admin: GET /api/sports allows unauthenticated team enumeration"
---

Surfaced by red-security during the #27 Next.js upgrade audit (PR #21). PRE-EXISTING — not introduced by the upgrade.

`GET /api/sports` (web-admin/src/pages/api/sports/index.ts) responds without any auth check, so any unauthenticated client can enumerate all active league teams (names, abbreviations, conferences, divisions). This is low-grade information disclosure IF league composition is considered sensitive; it is likely intentional (public reference data needed for initial page load before sign-in).

Decision needed:
- If the data is genuinely public reference data: document the intentional no-auth design (a comment in the handler + a note wherever API auth conventions live) so it isn't flagged again.
- If not: wrap the handler with the existing `withAuth` helper (web-admin/src/lib/auth.ts) to require a valid Bearer token.

Severity: low (residual risk, confidence ~0.7). No action is strictly required for #27; filing so the decision is explicit and tracked.