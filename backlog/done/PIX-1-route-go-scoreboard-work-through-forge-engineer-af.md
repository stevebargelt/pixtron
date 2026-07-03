---
id: PIX-1
type: story
status: done
title: Route Go scoreboard work through Forge engineer (after Go lands in container)
---

**Closed:** 2026-05-29.

**Note from #6:** the matrix C-lib provisioning (`scripts/install_rgbmatrix.sh`, `librgbmatrix.a`) is Pi-only and stays OUT of the container. The container build must use the no-CGO `matrix_stub.go` path (`go build ./...`, no `-tags matrix`). Pi-only C-lib/hardware setup is tracked under #5, not here.