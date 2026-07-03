---
id: PIX-16
type: story
status: done
title: Admin Add League is inert today — make leagues data-driven (api_config + generic ESPN fetcher) or remove the button
---

**Closed:** 2026-05-30. Commit `23be072`.

FINDING: the admin "Add League" control is currently a lying control. The Go app dispatches via a STATIC registry in go-scoreboard/internal/sports/aggregator.go (registry[code]) with only wnba -> FetchWNBA and nhl -> FetchNHL registered, each a hardcoded fetcher. An admin-added league row gets no Go fetcher -> errUnknownLeague -> the league is enabled/selectable but never displays a game on the panel.

The data model already anticipated data-driven leagues: leagues.api_config JSONB ("API configuration") exists for exactly this but is UNUSED. It is also not included in get_device_configuration, so it never reaches the device.

FEASIBILITY: ESPN APIs are uniform — WNBA = site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard; the pattern is sports/{sport}/{league}/scoreboard. A GENERIC ESPN fetcher parameterized by the sport/league slug (stored in leagues.api_config) could support NBA, MLB, NFL, NCAA, MLS, etc. with NO per-league Go code. NHL is the exception (uses the NHL stats API, not ESPN -> needs a bespoke client). Caveat: confirm ESPN scoreboard JSON is uniform enough across leagues for the existing WNBA parser (team/logo/period/status fields).

OPTIONS:
(A) SHORT TERM / honest-now: remove or disable the Add League button; admin manages only the existing supported leagues (enable/disable, season dates). Cheapest, keeps honest-controls.
(B) REAL multi-league: build the generic ESPN fetcher (api_config -> include in get_device_configuration RPC -> Go builds an ESPN fetcher from it at config-load, replacing/augmenting the static registry). Constrain Add League in the UI to ESPN-backed leagues + capture the slug into api_config. Investigate ESPN JSON uniformity first. Go + RPC + schema-wiring + web-admin work.

DECISION NEEDED (Steve, 2026-05-28): A now + B as the multi-league feature, or prioritize B. B2 (uncommitted) currently ships an Add League dialog — if A, remove/disable it before committing B2.