---
id: PIX-30
type: story
status: done
title: "web-admin: Next 15 warns on 'return res.json()' in Pages Router API handlers"
---

**Closed:** 2026-06-05.

Surfaced by test-engineer during the #27 Next.js 15 upgrade (PR #21). Introduced by the bump; warning only, NO functional impact (all API routes respond correctly and all 193 tests pass).

Next.js 15 logs `[WebServer] API handler should not return a value, received object.` because the Pages Router API routes use `return res.status(N).json(...)`, which returns the NextApiResponse object. Next 15 now warns when a handler returns a non-undefined value.

Fix: drop the `return` keyword before `res.json()` / `res.status().json()` calls across web-admin/src/pages/api/**, converting them to early-return guards that call res.json() without capturing/returning its value. Pure cleanup — quiets the log noise, no behavior change.

Severity: low / cosmetic. Route through Forge (engineer) when convenient; bundle with other API-route touch-ups if any come up.