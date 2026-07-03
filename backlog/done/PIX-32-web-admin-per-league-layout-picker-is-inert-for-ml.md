---
id: PIX-32
type: story
status: done
title: web-admin per-league layout picker is inert for MLB (always renders LiveBaseball)
---

**Closed:** 2026-06-03.

After MLB shipped (PR #24), the web-admin per-league live-view layout picker (device_leagues.display_layout in {stacked, side_by_side}) offers MLB the same choice as WNBA/NHL, but the Go app ignores it for MLB: cmd/scoreboard/main.go currentScene() dispatches any live MLB game to scenes.LiveBaseball before the layout check. So the MLB layout control does nothing.

Options:
- Hide/disable the layout picker for MLB in the web admin (cleanest — matches the honored-vs-inert principle), or
- Make LiveBaseball honor a layout variant if a side_by_side baseball layout is ever designed.

Low priority / cosmetic — no functional breakage, just a misleading control. Consistent with the broader 'don't expose inert settings as if they work' rule.