# Backlog

## Active

### BL-006: Add libcairo2-dev to Pi setup dependencies
The `fetch_nhl_assets.py` script requires `cairosvg` which needs the `libcairo2-dev` system package. Add it to:
- `install_rgbmatrix.sh` apt install step
- README / setup documentation

**Likely moot after #6:** `fetch_nhl_assets.py` (the only consumer of `cairosvg`) is deleted by #6; NHL/WNBA logo fetching moves to Go (`go run ./cmd/fetch-logos`). Re-evaluate / close once #6 lands.

## Done (recent)

### BL-001: Clean up dead NHL team_assets_url endpoint — CLOSED 2026-05-27
### BL-002: Update WNBA/NHL season dates for 2026 — CLOSED 2026-05-27
### BL-003: WNBA parser reads broadcasts from wrong path — CLOSED 2026-05-27
### BL-004: NBA teams parser reads 'logo' but ESPN returns 'logos' array — CLOSED 2026-05-27
### BL-005: WNBA teams parser reads venue but ESPN doesn't include it — CLOSED 2026-05-27

## Notes for next session
**Last session ended 2026-06-02 — #27 Next.js 15 upgrade shipped; backlog reconciled (PR #20 retired).**

**Where we left off:** Shipped #27 — upgraded web-admin from next@14.2.35 to next@15.5.19 (React runtime stays 18) and restored the three CI audit gates from CRITICAL-only back to `high`. Merged as PR #21 (squash cb40598); CI fully green including the restored high gates running for real (proves the highs are genuinely cleared, not just threshold-loosened). Forge chain: engineer -> test-engineer (193/193, +4 E2E) -> red-security (no regressions). A mid-way `npm ci` peer-dep failure (CI strict install rejected @types/react-dom@18 vs @types/react@19) was fixed by aligning both @types/react* to ^19. Also reconciled the backlog: closed #24/#25/#26/#27, and PR #20 (a prior session's never-merged backlog handoff) was superseded and closed unmerged — its only unique content (the #24/#26 closes) was folded in here.

**Picked up next (pick one — Steve owns the call):**
1. **#29** web-admin: GET /api/sports allows unauthenticated team enumeration (low, pre-existing; decide document-as-public vs wrap withAuth). Surfaced by red-security during #27.
2. **#30** web-admin: Next 15 logs a warning on `return res.json()` in Pages Router API handlers (low/cosmetic; drop the `return` before res.json() across src/pages/api/**). Surfaced by test-engineer during #27.
3. **#20** E2E dashboard empty-state via a dedicated no-device QA user · **#21** lock catalog tables read-only via RLS · **#15** dev/QA auth bypass (recheck relevance post admin-removal).
4. **#8** live snapshot from device · **#5** Pi deploy automation via Tailscale · **#11/#12** forge meta.

**Uncommitted working state to resolve:** CLAUDE.md is modified (forge-upgrade orchestrator-template re-render adding the documentation-maintainer role) and .forge/docs-surfaces.yml is untracked (forge config). Both are forge-upgrade artifacts, unrelated to #27 — offered to commit as a small chore; not yet done.

**External state to remember:**
- Pi: SSH alias `led-scoreboard-3`, IP `192.168.68.72` (DHCP, mDNS flaky — re-check on SSH fail). go-scoreboard dev loop is on the Pi (Forge can't reach GPIO). Steve runs `sudo` himself.
- 4 GitHub repo SECRETS wired & working: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, CLAUDE_CODE_OAUTH_TOKEN, CODECOV_TOKEN.
- Migrations through 008 applied to remote Supabase via `supabase db push`.
- CI runs strict `npm ci` — validate forge-authored web-admin dep changes with `npm ci` (not lenient `npm install`) before pushing, or the lockfile can pass locally and fail CI.
- Brand assets live in repo-root `brand/` (NOT `assets/`, which root .gitignore swallows). web-admin uses `public/brand/` + favicon tags in `_document.tsx` (Pages Router).
- WNBA logos exist locally on the Mac at `assets/logos/` (500px) + `assets/logos/variants/`. TOR (Toronto Tempo, id 131935) banner is on the Pi but NOT local — blank in Mac sim only.

**Decisions worth not relitigating:**
- **next stays on a patched 15.x, React runtime stays 18.** @types/react* are at ^19 (types ahead of runtime — intentional, type-check passes); do NOT bump react/react-dom runtime to 19 without a separate decision.
- **Security gates are back to `high`** (ci.yml npm audit + audit-ci, code-quality.yml dependency-review). 2 moderate postcss advisories remain (bundled inside next; unfixable without a next release) — acceptable, below the gate.
- **LiveBig score = 04B_24@16**, layout is per-corner; hardware-verified on a live game. See memory reference_pixel_font_native_sizes.
- **Admin screen REMOVED, not gated** (#10); catalog edits are operator/out-of-band, no JWT role system.
- **Live-view layout is PER-LEAGUE** (device_leagues.display_layout in {stacked, side_by_side}); value strings are a hard contract across Go + DB + web UI.
- **Forge container skips tsc + prettier** (jest transpiles only) -> run real type-check + prettier locally before pushing forge-authored web-admin code. Memory: reference_forge_edits_persist_in_worktree.

**Shipped recently (git log is canonical):** PR#21 -> #27 Next.js 15.5.19 upgrade + audit gates to high + 4 E2E tests · PR#16 -> #24 device rename · PR#17 -> #26 toast float (carried #25 Save label) · PR#15 LiveBig redesign (hardware-verified). Closed: #24, #25, #26, #27. PR #20 closed unmerged (superseded).

## Active

### #5 — Automate Pi deploy via Tailscale + GitHub Actions (replaces manual SSH workflow)
**Survivors from #6 (Python removal) this ticket must convert** — #6 deleted the Python app but deliberately LEFT these Pi-infra scripts as reusable templates. They still reference Python and will NOT work as-is:
- `scripts/systemd/wnba-led.service` — `ExecStart=.venv/bin/python app.py`; repoint at the Go binary (`scoreboard-matrix`, needs root for GPIO). No autostart on the Pi yet.
- `scripts/deploy/{deploy,health-check,rollback}.sh` — written for the venv/pip deploy; rewrite for the static Go binary (`git pull` → `go build -tags matrix` → restart unit).
- `scripts/install_rgbmatrix.sh` — builds the **Python** rgbmatrix bindings; the Go app only needs the C lib `librgbmatrix.a`. Reduce to building the C lib; drop the Python-binding + import-verify steps.
- `scripts/hardware_self_test.sh` — python3-based matrix test; convert to a Go `--sim`/hardware check or drop.

### #11 — Forge: feature build phase should dispatch per-discipline specialists, not one generic engineer
Observed 2026-05-28 on the web-admin redesign (run-web-admin-redesign-honest-2-tab-device-config-8ecb5c). The tech-lead plan tagged each step discipline (steps 1-4 backend, 5-6 frontend), but the feature-ui-design-provided build phase dispatched ONE generic engineer for the whole wave; the discipline tags were unused for routing. CLAUDE.md describes the intent as "engineer (specialist per step)" — mismatch. Result: the generalist twice dropped frontend craft (a11y semantics, invalid disabled-on-datalist-option duplicate-favorites bug, skipped/ignored browser-tools visual verification). Ask: make the build phase fan out per the plan discipline tags (frontend-specialist for frontend steps, backend-specialist for backend), or document that build is intentionally single-engineer. This is a Forge tooling issue, not a scoreboard-app issue.


### #12 — Forge: request-changes should drive the rationale fix-list, not a plan re-run
Observed 2026-05-28, same run. After a build gate request-changes with a detailed fix-list rationale, the follow-up build/engineer task re-anchored on the PLAN (reported "all steps already implemented"), did a visual pass, and SKIPPED the rationale fix-list entirely — the reds re-flagged the identical a11y/validation/logging issues. Ask: when a step is sent back via request-changes, the re-run task input should foreground the rationale fix-list as the work to do, not just re-run against the original plan. Forge tooling issue.


### #15 — Dev/QA auth bypass for web-admin (so authed flows are actually testable)
PROBLEM (root cause of the 2026-05-28 login breakage): the web-admin requires a real Supabase Auth session. Forge specialist containers have no session, so (a) their browser-tools visual verification only ever renders the login page — every authenticated screen (dashboard populated, device Teams/Settings, admin) goes visually UNVERIFIED; and (b) to make their container dev server boot, a specialist wrote web-admin/.env.local with NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co. Because /project is mounted rw, that file leaked onto the real machine and overrode web-admin/.env, breaking local login (browser posted to placeholder.supabase.co/auth/v1/token). Fixed for now by deleting the placeholder .env.local (web-admin/.env has the real creds).

PROPOSED FIX — a dev-only auth bypass:
- A mock-session path gated behind an env flag (e.g. NEXT_PUBLIC_DEV_AUTH_BYPASS=true) that injects a fake authenticated session (and optionally a couple of mock devices) so the app renders authed views WITHOUT a real Supabase session.
- HARD prod-safety: the bypass must be impossible to enable in production (guard on NODE_ENV !== production AND the explicit flag; never default-on).
- Document it in CLAUDE.md Stack section — the forge frontend-specialist seed explicitly checks there for "dev auth instructions (bypass env vars, test credentials, mock auth setup)." With it documented, specialists set the flag in-container, render authed screens, and do REAL visual verification — no need to touch Supabase config, no .env.local leak.

ALSO: instruct specialist passes to NEVER create/modify web-admin/.env.local (it is the real local config). Consider adding web-admin/.env.local.example with placeholders + a note, but never write a real/placeholder .env.local in automation.

This is what makes the rest of the redesign actually verifiable.


### #20 — E2E: dashboard empty-state test via a dedicated no-device QA user
Follow-up from the E2E suite build. The empty-state assertion ('No devices yet') conflicts with the per-test device-seeding fixture in the same auth context. Clean answer: a SEPARATE QA user that owns zero devices, with its own storageState, so the empty-state test isn't fighting the seed/sweep used by the device-owning QA user (qa@bargelt.com). Small: add a second programmatic login (e.g. qa-empty@bargelt.com) in globalSetup writing a second storageState, and one spec using that project/state asserting the empty-state dashboard renders. Deferred intentionally during the fixture + add-device + teams-save batch.


### #21 — Lock global catalog tables (sports/leagues/league_teams) to read-only for authenticated users via RLS
Replaces the RLS half of the now-closed #10 (the UI-gating and admin-role halves were resolved by removing the admin screen — PR #1 / 23be072).

Problem (pre-existing, multi-tenant gap): the shared catalog tables sports / leagues / league_teams currently allow writes from any authenticated user (RLS guard auth.role() = 'authenticated', migration 002_rls_policies.sql). With the admin UI gone there is no user-facing writer, but the RLS hole still lets any signed-in user edit shared catalog data directly via the Supabase client — affecting ALL users' devices (delete a league, change season dates, edit the team directory).

Decision context: 'admin' is a single platform-operator concept, NOT a per-tenant role. There is no JWT role claim or user_roles table — we deliberately descoped that. Catalog writes happen out-of-band by the operator (service-role key / migrations / scripts), coupled to Go fetcher work.

Scope:
- Tighten RLS on sports, leagues, league_teams: SELECT stays open to authenticated; INSERT/UPDATE/DELETE denied to authenticated (writes only via service-role).
- Verify the Go app (read-only catalog consumer) and any operator scripts still function under the new policies.
- New migration in supabase/migrations/ (next number), applied via `supabase db push`.

Defense-in-depth: the user-facing app no longer writes the catalog, so this is closing the direct-Postgres-client path, not unblocking a feature.


### #29 — web-admin: GET /api/sports allows unauthenticated team enumeration
Surfaced by red-security during the #27 Next.js upgrade audit (PR #21). PRE-EXISTING — not introduced by the upgrade.

`GET /api/sports` (web-admin/src/pages/api/sports/index.ts) responds without any auth check, so any unauthenticated client can enumerate all active league teams (names, abbreviations, conferences, divisions). This is low-grade information disclosure IF league composition is considered sensitive; it is likely intentional (public reference data needed for initial page load before sign-in).

Decision needed:
- If the data is genuinely public reference data: document the intentional no-auth design (a comment in the handler + a note wherever API auth conventions live) so it isn't flagged again.
- If not: wrap the handler with the existing `withAuth` helper (web-admin/src/lib/auth.ts) to require a valid Bearer token.

Severity: low (residual risk, confidence ~0.7). No action is strictly required for #27; filing so the decision is explicit and tracked.


### #30 — web-admin: Next 15 warns on 'return res.json()' in Pages Router API handlers
Surfaced by test-engineer during the #27 Next.js 15 upgrade (PR #21). Introduced by the bump; warning only, NO functional impact (all API routes respond correctly and all 193 tests pass).

Next.js 15 logs `[WebServer] API handler should not return a value, received object.` because the Pages Router API routes use `return res.status(N).json(...)`, which returns the NextApiResponse object. Next 15 now warns when a handler returns a non-undefined value.

Fix: drop the `return` keyword before `res.json()` / `res.status().json()` calls across web-admin/src/pages/api/**, converting them to early-return guards that call res.json() without capturing/returning its value. Pure cleanup — quiets the log noise, no behavior change.

Severity: low / cosmetic. Route through Forge (engineer) when convenient; bundle with other API-route touch-ups if any come up.


## Done (recent)

### #8 — Live snapshot from device — replaces removed Canvas preview
**Closed:** 2026-06-04.


### #32 — web-admin per-league layout picker is inert for MLB (always renders LiveBaseball)
**Closed:** 2026-06-03.

After MLB shipped (PR #24), the web-admin per-league live-view layout picker (device_leagues.display_layout in {stacked, side_by_side}) offers MLB the same choice as WNBA/NHL, but the Go app ignores it for MLB: cmd/scoreboard/main.go currentScene() dispatches any live MLB game to scenes.LiveBaseball before the layout check. So the MLB layout control does nothing.

Options:
- Hide/disable the layout picker for MLB in the web admin (cleanest — matches the honored-vs-inert principle), or
- Make LiveBaseball honor a layout variant if a side_by_side baseball layout is ever designed.

Low priority / cosmetic — no functional breakage, just a misleading control. Consistent with the broader 'don't expose inert settings as if they work' rule.


### #31 — MLB logo art — fetch-logos is WNBA-only, MLB renders placeholder boxes
**Closed:** 2026-06-03.

MLB shipped (PR #24) rendering placeholder boxes for team logos because go-scoreboard's fetch-logos command only supports WNBA. Add MLB to the logo pipeline so the LiveBaseball scene shows real team marks (mini for the stacked rows; banner not needed unless a side_by_side baseball layout is ever added).

- cmd/fetch-logos: add MLB team-id -> logo source mapping (ESPN baseball team assets).
- Generate mini variants into assets/logos/variants on the Pi (logos are gitignored, live on the Pi only).
- Note: ESPN MLB team IDs differ from the abbreviations; the fetcher keys on GameSnapshot.Team.ID (ESPN id string).

Low priority — placeholders render fine; this is polish.


### #26 — web-admin: 'Unsaved changes' toast causes the page to jump down
**Closed:** 2026-06-02. Commit `ca5540c`.

The unsaved-changes notification/toast (on the device Teams/config screen) shifts page layout when it appears — the content jumps down, which is jarring. Reposition so it doesn't reflow the page: overlay/fixed-position (e.g. a sticky bar or floating toast) rather than an inline element that pushes content. Noticed 2026-05-29.


### #24 — web-admin: rename a device (edit device name)
**Closed:** 2026-06-02. Commit `c51b9dd`.

Users can't change a device's name after creation. Add the ability to edit devices.name.

- UI: an editable name field / inline edit on the device Settings tab (near the existing Danger Zone delete).
- API: PATCH (or PUT) /api/device/[id] accepting { name }, owner-scoped via RLS (user-scoped client), mirroring the delete-device route.
- Validate non-empty / trimmed; reflect the new name in the dashboard + header.

Small UX gap noticed 2026-05-29.


### #27 — Upgrade Next.js (14.2.35) to clear high-severity CVEs
**Closed:** 2026-06-02. Commit `cb40598`.

web-admin runs next@14.2.35, which carries multiple HIGH-severity advisories (HTTP request deserialization DoS, Server Components DoS, i18n middleware/proxy bypass, WebSocket SSRF) plus moderates (image-optimizer DoS, request smuggling, cache poisoning). All fix only via a major Next.js upgrade (npm audit fix --force → next@15/16), which is a breaking migration.

Until then, CI gates Security Audit (npm audit / audit-ci) and Dependency Review are set to block on CRITICAL only (not high), so they don't red every PR on these framework advisories — see ci.yml / code-quality.yml. After upgrading, tighten both back to high.

Scope: bump Next.js (and eslint-config-next) to a patched major; fix breaking changes; re-run the suite + E2E; then restore audit thresholds to high.


### #25 — web-admin: Teams screen save button 'Save Teams' -> 'Save'
**Closed:** 2026-06-02. Commit `ca5540c`.

On the device Teams tab (DeviceTeamsTab.tsx), the save button reads 'Save Teams'. Shorten to just 'Save'. Trivial label change.


### #28 — web-admin: wire Pixtron brand (favicon, login + header logo)
**Closed:** 2026-05-30.

Brand assets now live in repo root `brand/` (source SVGs + PNG/ICO exports). Wire them into web-admin:

1. Favicon / app icons (Next.js 14 App Router auto-conventions):
   - Add `web-admin/app/icon.svg` (copy brand/pixtron-lettermark.svg) OR app/favicon.ico (copy brand/favicon.ico)
   - Add `web-admin/app/apple-icon.png` (copy brand/apple-touch-icon.png, 180x180)
   - Confirm <head> emits the right link tags after build.
2. Login page: add the Pixtron wordmark above the auth form.
3. Dashboard header/nav: add the lettermark (or small wordmark) as the brand mark, linking home.
   - Copy display assets into web-admin/public/brand/ and reference via next/image with width/height + alt='Pixtron'.

Assets bake in a charcoal #1A1A1A bg (fine for the dark UI). Keep value-string/layout contracts untouched — pure presentational add.
Acceptance: build passes, favicon shows in tab, wordmark on login, mark in header; screenshots on light+dark if applicable.


### #23 — Wire the big side-by-side LiveBig layout for single live games (20x20 banner logos)
**Closed:** 2026-05-30. Commit `43a298d`.

The LiveBig scene (internal/scenes/live_big.go) already exists and renders a single game side-by-side with 20x20 banner logos, properly BiLinear-scaled via pasteLogo — far more legible than the stacked Live scene's 10x10 logos. But currentScene() in cmd/scoreboard/main.go never selects it: StateLive always returns scenes.Live (stacked, tiny logos).

Scope:
- In currentScene(), return scenes.LiveBig for live games (single chosen game). Decide whether to keep Live at all (e.g. fallback) or replace it.
- Reconcile the trade-off: LiveBig shows smaller scores (smallFace, centered) vs Live's big 16px score digits. May want to enlarge LiveBig scores.
- Verify intermission status line ("Int 2 04:36") still renders well in LiveBig (it draws statusLine at top, y=7).
- Confirm banner variants exist for displayed leagues (WNBA + NHL via fetch-logos).

Context: came out of the NHL logo fix (PR #4). The stacked view is "small but correct" after that fix; this makes single games actually look good. Logos are gitignored / Pi-only.


### #22 — Modernize GitHub Actions workflows for current Pixtron (fix CI, add go-scoreboard coverage)
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


### #10 — Add admin role + gate the global Sports & Leagues catalog
**Closed:** 2026-05-30. Commit `23be072`.

Multi-tenant gap (pre-existing): the global sports/leagues/league_teams catalog RLS guard is auth.role() = 'authenticated' (migration 002_rls_policies.sql) — ANY signed-in user can edit shared catalog data that affects ALL users' devices (delete a league, change season dates, edit the team directory).

Decision (2026-05-28): for the web-admin redesign, screen 06 (admin Sports & Leagues catalog) ships OPEN to authenticated users for now, to unblock testing. Lock it down later via this ticket.

Scope:
- Introduce an admin role — Supabase app_metadata/JWT claim, or a profiles/user_roles table.
- Gate the Admin nav item + the /admin/sports-leagues route SERVER-SIDE (route guard / RLS), not just UI hiding.
- Tighten the sports / leagues / league_teams RLS policies to require admin instead of merely authenticated.
- Implement the 403 / forbidden state already designed in frame 06.

Ref: designs/web-admin-redesign-handoff.md sections 6.5 and 11 (Q3). The 6 user-facing screens (dashboard, onboarding, teams, settings, picker) need no roles; this is catalog-curation gating only.


### #16 — Admin Add League is inert today — make leagues data-driven (api_config + generic ESPN fetcher) or remove the button
**Closed:** 2026-05-30. Commit `23be072`.

FINDING: the admin "Add League" control is currently a lying control. The Go app dispatches via a STATIC registry in go-scoreboard/internal/sports/aggregator.go (registry[code]) with only wnba -> FetchWNBA and nhl -> FetchNHL registered, each a hardcoded fetcher. An admin-added league row gets no Go fetcher -> errUnknownLeague -> the league is enabled/selectable but never displays a game on the panel.

The data model already anticipated data-driven leagues: leagues.api_config JSONB ("API configuration") exists for exactly this but is UNUSED. It is also not included in get_device_configuration, so it never reaches the device.

FEASIBILITY: ESPN APIs are uniform — WNBA = site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard; the pattern is sports/{sport}/{league}/scoreboard. A GENERIC ESPN fetcher parameterized by the sport/league slug (stored in leagues.api_config) could support NBA, MLB, NFL, NCAA, MLS, etc. with NO per-league Go code. NHL is the exception (uses the NHL stats API, not ESPN -> needs a bespoke client). Caveat: confirm ESPN scoreboard JSON is uniform enough across leagues for the existing WNBA parser (team/logo/period/status fields).

OPTIONS:
(A) SHORT TERM / honest-now: remove or disable the Add League button; admin manages only the existing supported leagues (enable/disable, season dates). Cheapest, keeps honest-controls.
(B) REAL multi-league: build the generic ESPN fetcher (api_config -> include in get_device_configuration RPC -> Go builds an ESPN fetcher from it at config-load, replacing/augmenting the static registry). Constrain Add League in the UI to ESPN-backed leagues + capture the slug into api_config. Investigate ESPN JSON uniformity first. Go + RPC + schema-wiring + web-admin work.

DECISION NEEDED (Steve, 2026-05-28): A now + B as the multi-league feature, or prioritize B. B2 (uncommitted) currently ships an Add League dialog — if A, remove/disable it before committing B2.


### #1 — Route Go scoreboard work through Forge engineer (after Go lands in container)
**Closed:** 2026-05-29.

**Note from #6:** the matrix C-lib provisioning (`scripts/install_rgbmatrix.sh`, `librgbmatrix.a`) is Pi-only and stays OUT of the container. The container build must use the no-CGO `matrix_stub.go` path (`go build ./...`, no `-tags matrix`). Pi-only C-lib/hardware setup is tracked under #5, not here.

### #14 — Favorite teams: no reorder in new Teams tab (regression) + priority not persisted
**Closed:** 2026-05-29. Commit `c3326c6`.

SYMPTOM: the new DeviceTeamsTab has no way to reorder favorite teams (add/remove only). The old MultiSportFavoritesEditor had move up/down ordering, so this is a regression.

CROSS-STACK — reordering only becomes meaningful if all three layers carry order:
1. UI (web-admin/src/components/config/DeviceTeamsTab.tsx): add reorder controls (up/down or drag) per favorite chip/row.
2. API payload: send team_ids in the chosen order.
3. RPC (supabase/migrations/005_save_device_teams.sql): TODAY it inserts every favorite with priority=999 (flat, no order). Change to priority = array index so order is persisted in device_favorite_teams.priority (column already exists).
4. Go app: reloadConfig() (cmd/scoreboard/main.go) currently builds favorites as an UNORDERED set (map[league]map[teamID]bool), so favorite order has NO effect on SelectGame today. For reordering to actually change which favorite game is shown, Go must read favorite priority and honor it in selection.

So: a UI-only reorder would be cosmetic until the RPC persists priority AND Go honors it. Decide scope (full UI+RPC+Go, or defer). Natural to fold into the remaining web-admin redesign work + a small Go follow-up.


### #18 — Pre-commit hook reformats repo-wide, churning already-committed files every commit
**Closed:** 2026-05-29. Commit `fb1d598`.

Observed repeatedly 2026-05-28: each web-admin commit runs a pre-commit format step (prettier) across the whole repo, not just staged files. It re-lowercases hex and re-wraps lines in files NOT part of the commit (e.g. globals.css, Navigation.tsx, Button.tsx, Card.tsx, seed-teams.ts), leaving them modified in the working tree after the commit. I have had to git checkout HEAD -- those files multiple times to keep commits scoped. Also a contributing factor to specialists "touching" committed files. FIX: make the pre-commit hook format ONLY staged files (lint-staged), or drop the repo-wide format step. See .husky/ + package.json scripts. Low priority but recurring friction.


### #19 — WNBA game stuck at "4th 0 0" at game end — never shows Final
**Closed:** 2026-05-29. Commit `b21e689`.

BUG (seen live 2026-05-28): a WNBA game that went FINAL displayed as "4th 0 0" (4th quarter, 0:00 clock) and never showed "Final". Sibling to the Halftime bug fixed in 56fbf1a (special-cased StatusDetail=="halftime" -> "Halftime" in internal/scenes/live.go:85).

EXPECTED: when the final period ends / the game completes, the panel shows "Final" (the Final scene), not a live "4th 0:00".

ROOT CAUSE DIRECTION: state is parsed in internal/sports/wnba.go (~L124-129) from ESPN status.type.state: pre->StatePre, in->StateLive, post->StateFinal. The game was still StateLive ("in") with Period=4, DisplayClock="0:00", so the Live scene rendered "4th 0 0". Likely (a) ESPN reports state="in" at the buzzer (end-of-period / final-pending) before flipping to "post", and/or (b) the completed signal (status.type.completed==true or name=="STATUS_FINAL") is not consulted, so the transition to StateFinal is missed. "Never says final" points at the post/completed transition being missed.

FIX DIRECTION (Go, direct-edit): in the WNBA parser (and check NHL too) treat status.type.completed==true / name=="STATUS_FINAL" as StateFinal regardless of the state string; prefer fixing the STATE mapping so the Final scene shows. As a secondary guard, in scenes/live.go, a 0:00 clock at the end of the final period could render "Final"/"End 4th" instead of "4th 0 0". Repro: inspect the raw ESPN status.type (state/completed/name) for a just-completed WNBA game vs what the parser maps.


### #17 — Device Teams tab shows admin-disabled leagues (ignores leagues.is_active)
**Closed:** 2026-05-29. Commit `3574d5e`.

BUG (found 2026-05-28 in live review): a league disabled in the admin catalog (leagues.is_active = false, e.g. MLB) still appears as a toggleable card on the user-facing device Teams tab, and can be enabled for the device. The admin enable/disable flag is supposed to gate which leagues a user can configure; it is currently cosmetic on the device side.

ROOT CAUSE: GET /api/device/[id]/sports.ts builds sportConfigs from device_leagues rows (select enabled, priority, league:leagues(code)) with NO leagues.is_active filter. DeviceTeamsTab.tsx renders one card per returned sportConfig. A device with a stale device_leagues row for a now-disabled league (MLB) shows it.

FIX:
1. PRIMARY (web-admin): GET /api/device/[id]/sports must exclude leagues where leagues.is_active = false from sportConfigs — join leagues.is_active and filter to true (or filter post-query). Add a test that a disabled league is not returned. This removes MLB from the device config screen.
2. DEFENSE-IN-DEPTH (Go path): get_device_configuration RPC (supabase/migrations/004) should also exclude is_active=false leagues from enabled_leagues, so a disabled league never reaches the device even with a stale enabled device_leagues row. (New migration; orchestrator applies to Supabase. Go already errUnknownLeagues unknown codes, so this is hardening.)

RELATED: this overlaps #16 — for is_active to mean "available", the seed/admin must set is_active=true only for leagues the Go app can actually fetch (today: wnba, nhl). MLB/NBA/etc should stay is_active=false until #16 (data-driven leagues) lands. Also note: the Teams tab currently only shows leagues the device already has device_leagues rows for — it has no path to add a NOT-yet-configured active league; consider showing all is_active leagues merged with device state (separate UX gap).

> SUPERSEDED 2026-06-03: MLB shipped live (PR #24/#25) via a per-league Go fetcher (`internal/sports/mlb.go`), not the #16 data-driven path — so "MLB stays is_active=false until #16" no longer holds. Fetchable leagues today: wnba, nhl, mlb (is_active=true for all three; migrations 009/010). The separate "Teams tab can't add an un-configured active league" UX gap is still open.


### #7 — Polling: back off API calls when no game is imminent (time-to-start-aware cadence)
**Closed:** 2026-05-29. Commit `c82765d`.

**Implemented (commit `c82765d`), pending Pi live-loop verification.** `pollIntervalSec` in `cmd/scoreboard/main.go` now paces to the soonest tip-off (flat PregameSec 30m–2h out, ≤2m inside 30m, 30s inside 5m, 30m idle backoff when nothing is imminent; live still 15s, final FinalSec). Unit-tested (`poll_test.go`, 10 cases, green) + `--sim --once` render clean. NOT yet observed backing off over hours on hardware — verify after the push hold lifts and the Pi pulls. Close once confirmed live.

### #9 — Make Go honor brightness + timezone from device_config
**Closed:** 2026-05-29. Commit `b000898`.

**Implemented (commit `b000898`), pending Pi verification.** Timezone (pregame + idle scenes via `time.LoadLocation`, fallback system local) and brightness (runtime `led_matrix_set_brightness` after config load + SIGHUP) now honored; `SetBrightness` added to the Display interface + stub/sim. Mac build/vet/test green + `loadLocation` unit test. The `matrix.go` CGO path can't build off-Pi, so brightness-on-panel + tz display stay unverified until the Pi pulls (push hold). Update the CLAUDE.md "fields not yet honored" note once Pi-confirmed.

Decision (2026-05-28, paired with the web-admin redesign): turn two currently-inert device_config fields into real, honored controls so the redesigned Settings tab is not lying. See memory project_honored_config_fields.

Today DeviceConfig (go-scoreboard/internal/config/supabase.go) decodes matrix_config.brightness and timezone, but reloadConfig() (cmd/scoreboard/main.go) ignores both:
- Timezone (easier): app currently uses the Pi system TZ. Load time.LoadLocation(cfg.Timezone) and format game start-times (pregame countdown / start display) in that location. Fall back to system/UTC on empty or bad tz. Mind the ESPN start-time parsing gotcha (sports.parseEventTime).
- Brightness (more involved): matrix brightness is hardcoded --led-brightness=80 in internal/display/matrix.go and applied at Init via CGO. Honoring cfg.Matrix.Brightness (1-100) needs either passing it into matrix Init or a runtime SetBrightness on the rgbmatrix wrapper. Runtime is nicer since SIGHUP reload already re-reads config. Clamp/validate; ignore 0/unset.

go-scoreboard/ = direct-edit (not Forge). Should land before/with the redesign Settings-tab implementation so brightness+timezone ship as working controls. Update the CLAUDE.md "fields not yet honored" note once done.


### #13 — Device shows offline in web admin — Go app has no periodic heartbeat / config poll
**Closed:** 2026-05-29. Commit `7377c92`.

SYMPTOM: the web admin shows a running device as "offline". StatusBadge is online iff devices.last_seen_ts is within ~90s.

ROOT CAUSE (pre-existing, independent of #7/#9): the Go app has NO periodic heartbeat. last_seen_ts is only written as a side effect of the get_device_configuration RPC (supabase/migrations/004 lines 106-109: UPDATE devices SET last_seen_ts = NOW()). The Go app calls that RPC only inside reloadConfig() (cmd/scoreboard/main.go), which runs at STARTUP and SIGHUP only. The poll loop fetches GAMES (ESPN/NHL via refreshGames), not config. So last_seen_ts is written once at boot and never again -> the 90s freshness window reads stale ~90s after start -> online for ~1 min after a restart, then offline forever.

BIGGER IMPLICATION: the device is not polling its config after startup, contradicting the documented architecture ("60-second poll interval for configuration updates"). Config changes from the web admin (favorites, and brightness/timezone via #9) currently reach the device only on a manual SIGHUP or restart, not automatically. The offline badge is the visible symptom of that gap.

FIX (go-scoreboard, direct-edit): add a ~60s config-reload ticker to the main loop in cmd/scoreboard/main.go. Each tick calls reloadConfig() which (a) refreshes last_seen_ts via the get_device_configuration side effect -> device shows online, and (b) auto-applies config changes including d.SetBrightness (the hook added in #9). Independent of #7 game-poll backoff (this is a cheap Supabase call; #7 throttles ESPN/NHL). Use get_device_configuration (the proven anon-key path) for the heartbeat; do NOT rely on the device_heartbeat RPC — it is granted only to authenticated/service_role, not anon (migration 004 line 142), while the device authenticates with the anon key. OPTIONAL refinement: trigger refreshGames + pollC reset only when the enabled-league set actually changes, so league changes reflect promptly without re-hitting ESPN/NHL every 60s.

VERIFY: build + --sim on Mac; actual "online" can only be confirmed once the push hold lifts and the Pi pulls the new code (same pending-Pi caveat as #7/#9).


### #6 — Remove frozen Python scoreboard codebase (src/, app.py, tests/, Python scripts)
**Closed:** 2026-05-28. Commit `e62fc83`.


### #4 — Bring TS preview layouts back in sync with Go renderer (post-pregame-rework drift)
**Closed:** 2026-05-28.


### #3 — Fix TS preview to use Go's small font (04B_03B_.TTF), eliminating cross-scene font mismatch
**Closed:** 2026-05-28. Commit `a278a10`.


### #2 — Compile Go renderer to WASM for in-browser preview (eliminates TS/Go drift)
**Closed:** 2026-05-28.

**Status: deferred** — Steve approved the direction 2026-05-28 but explicitly deferred the work. Don't start without re-confirming priority.
