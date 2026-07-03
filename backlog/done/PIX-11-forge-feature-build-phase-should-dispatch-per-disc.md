---
id: PIX-11
type: story
status: done
title: "Forge: feature build phase should dispatch per-discipline specialists, not one generic engineer"
---

**Closed:** 2026-06-05.

Observed 2026-05-28 on the web-admin redesign (run-web-admin-redesign-honest-2-tab-device-config-8ecb5c). The tech-lead plan tagged each step discipline (steps 1-4 backend, 5-6 frontend), but the feature-ui-design-provided build phase dispatched ONE generic engineer for the whole wave; the discipline tags were unused for routing. CLAUDE.md describes the intent as "engineer (specialist per step)" — mismatch. Result: the generalist twice dropped frontend craft (a11y semantics, invalid disabled-on-datalist-option duplicate-favorites bug, skipped/ignored browser-tools visual verification). Ask: make the build phase fan out per the plan discipline tags (frontend-specialist for frontend steps, backend-specialist for backend), or document that build is intentionally single-engineer. This is a Forge tooling issue, not a scoreboard-app issue.