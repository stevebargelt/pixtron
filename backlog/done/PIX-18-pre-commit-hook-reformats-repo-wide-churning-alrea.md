---
id: PIX-18
type: story
status: done
title: Pre-commit hook reformats repo-wide, churning already-committed files every commit
---

**Closed:** 2026-05-29. Commit `fb1d598`.

Observed repeatedly 2026-05-28: each web-admin commit runs a pre-commit format step (prettier) across the whole repo, not just staged files. It re-lowercases hex and re-wraps lines in files NOT part of the commit (e.g. globals.css, Navigation.tsx, Button.tsx, Card.tsx, seed-teams.ts), leaving them modified in the working tree after the commit. I have had to git checkout HEAD -- those files multiple times to keep commits scoped. Also a contributing factor to specialists "touching" committed files. FIX: make the pre-commit hook format ONLY staged files (lint-staged), or drop the repo-wide format step. See .husky/ + package.json scripts. Low priority but recurring friction.