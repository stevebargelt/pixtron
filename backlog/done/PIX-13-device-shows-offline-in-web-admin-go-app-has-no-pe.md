---
id: PIX-13
type: story
status: done
title: Device shows offline in web admin — Go app has no periodic heartbeat / config poll
---

**Closed:** 2026-05-29. Commit `7377c92`.

SYMPTOM: the web admin shows a running device as "offline". StatusBadge is online iff devices.last_seen_ts is within ~90s.

ROOT CAUSE (pre-existing, independent of #7/#9): the Go app has NO periodic heartbeat. last_seen_ts is only written as a side effect of the get_device_configuration RPC (supabase/migrations/004 lines 106-109: UPDATE devices SET last_seen_ts = NOW()). The Go app calls that RPC only inside reloadConfig() (cmd/scoreboard/main.go), which runs at STARTUP and SIGHUP only. The poll loop fetches GAMES (ESPN/NHL via refreshGames), not config. So last_seen_ts is written once at boot and never again -> the 90s freshness window reads stale ~90s after start -> online for ~1 min after a restart, then offline forever.

BIGGER IMPLICATION: the device is not polling its config after startup, contradicting the documented architecture ("60-second poll interval for configuration updates"). Config changes from the web admin (favorites, and brightness/timezone via #9) currently reach the device only on a manual SIGHUP or restart, not automatically. The offline badge is the visible symptom of that gap.

FIX (go-scoreboard, direct-edit): add a ~60s config-reload ticker to the main loop in cmd/scoreboard/main.go. Each tick calls reloadConfig() which (a) refreshes last_seen_ts via the get_device_configuration side effect -> device shows online, and (b) auto-applies config changes including d.SetBrightness (the hook added in #9). Independent of #7 game-poll backoff (this is a cheap Supabase call; #7 throttles ESPN/NHL). Use get_device_configuration (the proven anon-key path) for the heartbeat; do NOT rely on the device_heartbeat RPC — it is granted only to authenticated/service_role, not anon (migration 004 line 142), while the device authenticates with the anon key. OPTIONAL refinement: trigger refreshGames + pollC reset only when the enabled-league set actually changes, so league changes reflect promptly without re-hitting ESPN/NHL every 60s.

VERIFY: build + --sim on Mac; actual "online" can only be confirmed once the push hold lifts and the Pi pulls the new code (same pending-Pi caveat as #7/#9).