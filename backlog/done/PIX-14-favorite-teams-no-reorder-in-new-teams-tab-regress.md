---
id: PIX-14
type: story
status: done
title: "Favorite teams: no reorder in new Teams tab (regression) + priority not persisted"
---

**Closed:** 2026-05-29. Commit `c3326c6`.

SYMPTOM: the new DeviceTeamsTab has no way to reorder favorite teams (add/remove only). The old MultiSportFavoritesEditor had move up/down ordering, so this is a regression.

CROSS-STACK — reordering only becomes meaningful if all three layers carry order:
1. UI (web-admin/src/components/config/DeviceTeamsTab.tsx): add reorder controls (up/down or drag) per favorite chip/row.
2. API payload: send team_ids in the chosen order.
3. RPC (supabase/migrations/005_save_device_teams.sql): TODAY it inserts every favorite with priority=999 (flat, no order). Change to priority = array index so order is persisted in device_favorite_teams.priority (column already exists).
4. Go app: reloadConfig() (cmd/scoreboard/main.go) currently builds favorites as an UNORDERED set (map[league]map[teamID]bool), so favorite order has NO effect on SelectGame today. For reordering to actually change which favorite game is shown, Go must read favorite priority and honor it in selection.

So: a UI-only reorder would be cosmetic until the RPC persists priority AND Go honors it. Decide scope (full UI+RPC+Go, or defer). Natural to fold into the remaining web-admin redesign work + a small Go follow-up.