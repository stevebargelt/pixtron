---
id: PIX-22
type: story
status: done
title: Modernize GitHub Actions workflows for current Pixtron (fix CI, add go-scoreboard coverage)
---

**Closed:** 2026-05-30. Commit `5f17111`.

The .github/workflows/*.yml are generic Next.js scaffold boilerplate, never adapted to current Pixtron. main has failed CI on every commit since the initial commit. Keep the checks (Steve wants CI/CD); fix the wiring, drop the fake parts, add the missing Go coverage.

Decisions made (2026-05-29): keep prettier gate but format the repo ONCE first (lint-staged stays for pre-commit, CI is the backstop); drop Node matrix to 20.x only; all required values go in repo SECRETS (Steve adds them).

FIX:
- ci.yml build job: already wired to secrets.NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY — unblocked once secrets exist. (Steve adds: CLAUDE_CODE_OAUTH_TOKEN, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, optional CODECOV_TOKEN.)
- ci.yml security job: raise npm audit + audit-ci threshold moderate -> high (unfixable transitive moderates from postcss/ws/yaml need a Next 16 breaking bump; don't block on noise).
- ci.yml test job: drop 18.x from the matrix, keep 20.x.
- code-quality.yml: one-time prettier --write across web-admin/src (6 files currently fail --check: Layout.tsx, Navigation.tsx, CopyRow.test.tsx, Button.tsx, Card.tsx, globals.css), then keep the --check gate. Verify a .prettierrc matching existing style exists (only 6 files drifted, so the rest already match defaults).

REMOVE:
- ci.yml deploy-staging / deploy-production / notify jobs (placeholder echo stubs; develop branch doesn't exist; real Pi deploy is ticket #5).
- develop from branch triggers (main only).

ADD:
- go-scoreboard CI: setup-go (go-version-file: go-scoreboard/go.mod), working-directory go-scoreboard, run go build ./..., go vet ./..., go test ./... WITHOUT -tags matrix (stub backend, no CGO/hardware — runs clean on ubuntu runner). The active project currently has zero CI.

Claude workflows (claude.yml, claude-code-review.yml) are fine by design — the empty ANTHROPIC_API_KEY in the failed run traces to the unset CLAUDE_CODE_OAUTH_TOKEN secret. Consider pinning anthropics/claude-code-action to a SHA.

Validation: the real end-to-end check is opening a PR with these changes and watching the modernized pipeline go green on its own PR.