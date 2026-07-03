---
id: PIX-5
type: story
status: active
title: Automate Pi deploy via Tailscale + GitHub Actions (replaces manual SSH workflow)
---

**Survivors from #6 (Python removal) this ticket must convert** — #6 deleted the Python app but deliberately LEFT these Pi-infra scripts as reusable templates. They still reference Python and will NOT work as-is:
- `scripts/systemd/wnba-led.service` — `ExecStart=.venv/bin/python app.py`; repoint at the Go binary (`scoreboard-matrix`, needs root for GPIO). No autostart on the Pi yet.
- `scripts/deploy/{deploy,health-check,rollback}.sh` — written for the venv/pip deploy; rewrite for the static Go binary (`git pull` → `go build -tags matrix` → restart unit).
- `scripts/install_rgbmatrix.sh` — builds the **Python** rgbmatrix bindings; the Go app only needs the C lib `librgbmatrix.a`. Reduce to building the C lib; drop the Python-binding + import-verify steps.
- `scripts/hardware_self_test.sh` — python3-based matrix test; convert to a Go `--sim`/hardware check or drop.