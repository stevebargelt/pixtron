---
id: PIX-23
type: story
status: done
title: Wire the big side-by-side LiveBig layout for single live games (20x20 banner logos)
---

**Closed:** 2026-05-30. Commit `43a298d`.

The LiveBig scene (internal/scenes/live_big.go) already exists and renders a single game side-by-side with 20x20 banner logos, properly BiLinear-scaled via pasteLogo — far more legible than the stacked Live scene's 10x10 logos. But currentScene() in cmd/scoreboard/main.go never selects it: StateLive always returns scenes.Live (stacked, tiny logos).

Scope:
- In currentScene(), return scenes.LiveBig for live games (single chosen game). Decide whether to keep Live at all (e.g. fallback) or replace it.
- Reconcile the trade-off: LiveBig shows smaller scores (smallFace, centered) vs Live's big 16px score digits. May want to enlarge LiveBig scores.
- Verify intermission status line ("Int 2 04:36") still renders well in LiveBig (it draws statusLine at top, y=7).
- Confirm banner variants exist for displayed leagues (WNBA + NHL via fetch-logos).

Context: came out of the NHL logo fix (PR #4). The stacked view is "small but correct" after that fix; this makes single games actually look good. Logos are gitignored / Pi-only.