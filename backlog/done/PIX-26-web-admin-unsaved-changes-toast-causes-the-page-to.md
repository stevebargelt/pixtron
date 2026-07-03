---
id: PIX-26
type: story
status: done
title: "web-admin: 'Unsaved changes' toast causes the page to jump down"
---

**Closed:** 2026-06-02. Commit `ca5540c`.

The unsaved-changes notification/toast (on the device Teams/config screen) shifts page layout when it appears — the content jumps down, which is jarring. Reposition so it doesn't reflow the page: overlay/fixed-position (e.g. a sticky bar or floating toast) rather than an inline element that pushes content. Noticed 2026-05-29.