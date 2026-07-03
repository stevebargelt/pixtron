---
id: PIX-9
type: story
status: done
title: Make Go honor brightness + timezone from device_config
---

**Closed:** 2026-05-29. Commit `b000898`.

**Implemented (commit `b000898`), pending Pi verification.** Timezone (pregame + idle scenes via `time.LoadLocation`, fallback system local) and brightness (runtime `led_matrix_set_brightness` after config load + SIGHUP) now honored; `SetBrightness` added to the Display interface + stub/sim. Mac build/vet/test green + `loadLocation` unit test. The `matrix.go` CGO path can't build off-Pi, so brightness-on-panel + tz display stay unverified until the Pi pulls (push hold). Update the CLAUDE.md "fields not yet honored" note once Pi-confirmed.

Decision (2026-05-28, paired with the web-admin redesign): turn two currently-inert device_config fields into real, honored controls so the redesigned Settings tab is not lying. See memory project_honored_config_fields.

Today DeviceConfig (go-scoreboard/internal/config/supabase.go) decodes matrix_config.brightness and timezone, but reloadConfig() (cmd/scoreboard/main.go) ignores both:
- Timezone (easier): app currently uses the Pi system TZ. Load time.LoadLocation(cfg.Timezone) and format game start-times (pregame countdown / start display) in that location. Fall back to system/UTC on empty or bad tz. Mind the ESPN start-time parsing gotcha (sports.parseEventTime).
- Brightness (more involved): matrix brightness is hardcoded --led-brightness=80 in internal/display/matrix.go and applied at Init via CGO. Honoring cfg.Matrix.Brightness (1-100) needs either passing it into matrix Init or a runtime SetBrightness on the rgbmatrix wrapper. Runtime is nicer since SIGHUP reload already re-reads config. Clamp/validate; ignore 0/unset.

go-scoreboard/ = direct-edit (not Forge). Should land before/with the redesign Settings-tab implementation so brightness+timezone ship as working controls. Update the CLAUDE.md "fields not yet honored" note once done.