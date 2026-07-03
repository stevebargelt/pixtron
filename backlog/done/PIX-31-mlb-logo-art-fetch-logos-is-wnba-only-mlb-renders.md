---
id: PIX-31
type: story
status: done
title: MLB logo art — fetch-logos is WNBA-only, MLB renders placeholder boxes
---

**Closed:** 2026-06-03.

MLB shipped (PR #24) rendering placeholder boxes for team logos because go-scoreboard's fetch-logos command only supports WNBA. Add MLB to the logo pipeline so the LiveBaseball scene shows real team marks (mini for the stacked rows; banner not needed unless a side_by_side baseball layout is ever added).

- cmd/fetch-logos: add MLB team-id -> logo source mapping (ESPN baseball team assets).
- Generate mini variants into assets/logos/variants on the Pi (logos are gitignored, live on the Pi only).
- Note: ESPN MLB team IDs differ from the abbreviations; the fetcher keys on GameSnapshot.Team.ID (ESPN id string).

Low priority — placeholders render fine; this is polish.