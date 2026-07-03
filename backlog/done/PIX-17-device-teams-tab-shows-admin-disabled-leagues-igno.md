---
id: PIX-17
type: story
status: done
title: Device Teams tab shows admin-disabled leagues (ignores leagues.is_active)
---

**Closed:** 2026-05-29. Commit `3574d5e`.

BUG (found 2026-05-28 in live review): a league disabled in the admin catalog (leagues.is_active = false, e.g. MLB) still appears as a toggleable card on the user-facing device Teams tab, and can be enabled for the device. The admin enable/disable flag is supposed to gate which leagues a user can configure; it is currently cosmetic on the device side.

ROOT CAUSE: GET /api/device/[id]/sports.ts builds sportConfigs from device_leagues rows (select enabled, priority, league:leagues(code)) with NO leagues.is_active filter. DeviceTeamsTab.tsx renders one card per returned sportConfig. A device with a stale device_leagues row for a now-disabled league (MLB) shows it.

FIX:
1. PRIMARY (web-admin): GET /api/device/[id]/sports must exclude leagues where leagues.is_active = false from sportConfigs — join leagues.is_active and filter to true (or filter post-query). Add a test that a disabled league is not returned. This removes MLB from the device config screen.
2. DEFENSE-IN-DEPTH (Go path): get_device_configuration RPC (supabase/migrations/004) should also exclude is_active=false leagues from enabled_leagues, so a disabled league never reaches the device even with a stale enabled device_leagues row. (New migration; orchestrator applies to Supabase. Go already errUnknownLeagues unknown codes, so this is hardening.)

RELATED: this overlaps #16 — for is_active to mean "available", the seed/admin must set is_active=true only for leagues the Go app can actually fetch (today: wnba, nhl). MLB/NBA/etc should stay is_active=false until #16 (data-driven leagues) lands. Also note: the Teams tab currently only shows leagues the device already has device_leagues rows for — it has no path to add a NOT-yet-configured active league; consider showing all is_active leagues merged with device state (separate UX gap).

> SUPERSEDED 2026-06-03: MLB shipped live (PR #24/#25) via a per-league Go fetcher (`internal/sports/mlb.go`), not the #16 data-driven path — so "MLB stays is_active=false until #16" no longer holds. Fetchable leagues today: wnba, nhl, mlb (is_active=true for all three; migrations 009/010). The separate "Teams tab can't add an un-configured active league" UX gap is still open.