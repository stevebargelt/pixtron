---
id: PIX-19
type: story
status: done
title: WNBA game stuck at "4th 0 0" at game end — never shows Final
---

**Closed:** 2026-05-29. Commit `b21e689`.

BUG (seen live 2026-05-28): a WNBA game that went FINAL displayed as "4th 0 0" (4th quarter, 0:00 clock) and never showed "Final". Sibling to the Halftime bug fixed in 56fbf1a (special-cased StatusDetail=="halftime" -> "Halftime" in internal/scenes/live.go:85).

EXPECTED: when the final period ends / the game completes, the panel shows "Final" (the Final scene), not a live "4th 0:00".

ROOT CAUSE DIRECTION: state is parsed in internal/sports/wnba.go (~L124-129) from ESPN status.type.state: pre->StatePre, in->StateLive, post->StateFinal. The game was still StateLive ("in") with Period=4, DisplayClock="0:00", so the Live scene rendered "4th 0 0". Likely (a) ESPN reports state="in" at the buzzer (end-of-period / final-pending) before flipping to "post", and/or (b) the completed signal (status.type.completed==true or name=="STATUS_FINAL") is not consulted, so the transition to StateFinal is missed. "Never says final" points at the post/completed transition being missed.

FIX DIRECTION (Go, direct-edit): in the WNBA parser (and check NHL too) treat status.type.completed==true / name=="STATUS_FINAL" as StateFinal regardless of the state string; prefer fixing the STATE mapping so the Final scene shows. As a secondary guard, in scenes/live.go, a 0:00 clock at the end of the final period could render "Final"/"End 4th" instead of "4th 0 0". Repro: inspect the raw ESPN status.type (state/completed/name) for a just-completed WNBA game vs what the parser maps.