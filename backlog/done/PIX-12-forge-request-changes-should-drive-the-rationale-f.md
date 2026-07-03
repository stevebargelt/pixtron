---
id: PIX-12
type: story
status: done
title: "Forge: request-changes should drive the rationale fix-list, not a plan re-run"
---

**Closed:** 2026-06-05.

Observed 2026-05-28, same run. After a build gate request-changes with a detailed fix-list rationale, the follow-up build/engineer task re-anchored on the PLAN (reported "all steps already implemented"), did a visual pass, and SKIPPED the rationale fix-list entirely — the reds re-flagged the identical a11y/validation/logging issues. Ask: when a step is sent back via request-changes, the re-run task input should foreground the rationale fix-list as the work to do, not just re-run against the original plan. Forge tooling issue.