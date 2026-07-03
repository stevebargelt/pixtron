---
id: PIX-7
type: story
status: done
title: "Polling: back off API calls when no game is imminent (time-to-start-aware cadence)"
---

**Closed:** 2026-05-29. Commit `c82765d`.

**Implemented (commit `c82765d`), pending Pi live-loop verification.** `pollIntervalSec` in `cmd/scoreboard/main.go` now paces to the soonest tip-off (flat PregameSec 30m–2h out, ≤2m inside 30m, 30s inside 5m, 30m idle backoff when nothing is imminent; live still 15s, final FinalSec). Unit-tested (`poll_test.go`, 10 cases, green) + `--sim --once` render clean. NOT yet observed backing off over hours on hardware — verify after the push hold lifts and the Pi pulls. Close once confirmed live.