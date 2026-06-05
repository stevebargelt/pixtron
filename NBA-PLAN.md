# Plan: Add NBA Support

**Status:** proposed (awaiting go-ahead to kick off the engineer chain)
**Author:** orchestrator
**Date:** 2026-06-05

## Summary

Add the **NBA** (National Basketball Association) as a fully-supported league,
modeled on the MLB addition (GH PRs #24/#25) but **significantly lighter**.

NBA and WNBA are both ESPN `basketball` — same
`site.api.espn.com/.../basketball/<league>/scoreboard` shape, just `nba`
instead of `wnba`. Because NBA reuses the **generic basketball scene** (unlike
MLB, which required a dedicated `LiveBaseball` scene, flat baseball fields on
`GameSnapshot`, and the inert-layout-toggle hack), this is the easy league to
add:

- **~10 files**, no new scene, no `GameSnapshot` model changes.
- Web-admin works data-driven from the `leagues` table — **zero web-admin code
  changes required** (the NBA row is already seeded inactive in
  `003_seed_data.sql`; the API and `DeviceTeamsTab` iterate over whatever the
  DB returns).
- Per-league `display_layout` (stacked / side_by_side) works for NBA as-is — no
  MLB-style special-casing needed.

## Routing

`implementation` work. Under the Go-work routing rule (PR #27), the
sim/test-verifiable half **routes to an engineer**; only the logo regen +
`-tags matrix` build + on-panel eyeball stay host/Pi. This is the first real
exercise of that rule.

## Phase 1 — engineer invoke chain (sim/test-verifiable, all on the Mac)

| File | Change | Modeled on |
|------|--------|------------|
| `go-scoreboard/internal/sports/nba.go` | **NEW** — `FetchNBA`, basketball/nba endpoint, reuses `parseEvent` (no baseball fields) | `internal/sports/wnba.go` |
| `go-scoreboard/internal/sports/aggregator.go` | register `"nba"` in the fetch registry | the `"mlb"` entry |
| `go-scoreboard/cmd/scoreboard/main.go` | add `--fetch-nba` flag + fetch block; add `nba` to the `--demo-leagues` example | the `--fetch-mlb` wiring |
| `go-scoreboard/cmd/fetch-logos/main.go` | add `runNBA()` (ESPN teams endpoint); add `nba` to the `--league` switch + usage | `runMLB()` |
| `supabase/migrations/011_enable_nba.sql` | **NEW** — flip the already-seeded NBA row to `is_active=true` + 2025-26 season window | `009_enable_mlb.sql` |
| `supabase/migrations/012_seed_nba_teams.sql` | **NEW** — 30 NBA teams with ESPN IDs | `010_seed_mlb_teams.sql` |
| `go-scoreboard/internal/sports/nba_test.go` | **NEW** — parser tests (codecov/patch gates new branches) | `wnba_test.go` |

**No changes needed:**
- `internal/render/logo.go` — already league-namespaced
  (`logos/variants/<league>/<id>_<variant>.png`).
- Scene dispatch in `main.go` — NBA falls through to the generic `Live` /
  `LiveBig` scene; only MLB is special-cased.
- Web-admin — data-driven from the `leagues` table.

**Engineer self-verifies:** `go build ./...`, `go test`, `--fetch-nba` (live
ESPN), `--sim --once` read of `out/frame.png`. Then **test-engineer** runs in
the same forge run (non-optional in the quick chain).

## Phase 2 — host/Pi + Steve (after merge)

1. Orchestrator runs `supabase db push` to apply 011/012 to remote Supabase.
2. On the Pi: `git pull`, then
   `go run ./cmd/fetch-logos --assets-dir ../assets --league nba` (regen 30 NBA
   logos), then `go build -tags matrix -o scoreboard-matrix ./cmd/scoreboard`.
3. Steve `sudo`-runs the matrix binary and eyeballs a live NBA game on the panel.

## Decisions / defaults

- **Season window:** as of 2026-06-05 we're mid-NBA-Finals, so the engineer
  sets a 2025-26 window that is **active now** — Steve can verify live on the
  panel immediately.
- **NBA-specific web-admin team styling** (badge colors): **deferred.** NBA
  falls back to neutral accent colors cleanly. File as a follow-up ticket if
  wanted; keeps this PR Go + migrations only.
- **MLB data source precedent:** ESPN, not a league-specific StatsAPI. NBA
  follows the same — ESPN basketball scoreboard.

## Open question for Steve

- **PR shape:** one combined PR (Go fetcher + logos + migrations, like a merged
  #24+#25), or split logos into their own PR the way MLB was?

## Reference: how MLB was done (for parity)

- **PR #24** (feat: add MLB): `mlb.go`, `aggregator.go`, `main.go` flag/demo,
  `live_baseball.go` (NEW dedicated scene — **NBA skips this**), migrations
  009/010.
- **PR #25** (feat: MLB logos): `fetch-logos` `runMLB()`, `logo.go` league
  namespacing (**already in place — NBA reuses it**).
- **PR #26 / #32**: hid the inert layout toggle for MLB (**not needed for NBA**
  — basketball honors the layout toggle).
