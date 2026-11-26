# AGENTS.md

Guidance for coding agents (and people) working in this repository.

## Project Overview

**Pixtron** — Live multi-league sports scores on RGB LED matrices.
The live-render app is **Go** (`go-scoreboard/`), running on a Raspberry Pi.
Web admin (`web-admin/`, Next.js) writes device config to Supabase; the device polls it.

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Go App    │────▶│   Supabase   │◀────│  Web Admin   │
│  (on Pi)    │     │   Database   │     │   (Next.js)  │
└─────────────┘     └──────────────┘     └──────────────┘
```

The Go app polls Supabase for config; ESPN/NHL APIs for game data.

## Go Scoreboard (read this first)

The live-rendering scoreboard is **`go-scoreboard/`** (Go) — the only implementation. It began as
a rewrite of an earlier Python app, which was removed once the Go app took over; the driver was
Python's dependency pain on the Pi (venv, pip, Pillow C headers, rgbmatrix build failures), which a
single static Go binary eliminates. The web admin (`web-admin/`) and Supabase schema are shared with
it and were unchanged by the rewrite.

### What an agent can and cannot verify
- **Split Go scoreboard work by whether it needs the panel — don't blanket-exempt it from agents.**
  Most of it touches no hardware: fetchers, API parsing, the snapshot model, scene layout — anything
  verifiable with `go build` / `go test` / `--sim --once` (reading `out/frame.png`). That work
  is ordinary code an agent writes and verifies like any other.
- **Only the hardware step stays host/Pi-driven**: the `-tags matrix` build (it CGO-links the
  Pi-resident `librgbmatrix.a` on aarch64) and the on-panel verification run **on the Pi over SSH**,
  with the user running `sudo`. The reason is concrete — that's the only machine with the build/run
  target, and only the host has the SSH key + LAN route to reach it. It is **not** about GPIO: the
  host has no GPIO access either; the panel does, driven over SSH. (A container *could* drive
  the Pi too if it were provisioned with the SSH key and a route — this is a provisioning gap, not a
  law.) The handoff: an engineer writes + sim-verifies the Go change; the host pulls it on the Pi,
  builds the matrix binary, and the user eyeballs the panel.
- The user collaborates directly on the hardware-tuning loop (tech-lead-style), not as a pure product
  owner.

### Hardware + remote target
- Go is installed on the Pi at `~/go-sdk/` (on PATH via `~/.profile` and `~/.bashrc`); use a
  login shell (`ssh <pi> 'bash -lc "go ..."'`) so `go` is found.
- Panel config is the verified set, hardcoded in `internal/display/matrix.go`:
  `--led-rows=32 --led-cols=32 --led-chain=2 --led-pixel-mapper=Rotate:180
  --led-slowdown-gpio=4 --led-gpio-mapping=adafruit-hat --led-brightness=80`.
- `snd_bcm2835` is blacklisted on the Pi (`/etc/modprobe.d/blacklist-rgb-matrix.conf`); this is
  required for hardware PWM. Without it you must pass `--led-no-hardware-pulse`, which produces
  garbage (dotted-red-column artifacts) on this Pi 4.
- The rgbmatrix C library is built at `/home/pi/rpi-rgb-led-matrix/lib/librgbmatrix.a`
  (headers in `.../include/`). The Go matrix backend links it via CGO `#cgo` directives — there
  is **no** third-party Go LED dependency (the 2018 `mcuadros/go-rpi-rgb-led-matrix` lacked
  GPIOSlowdown/PixelMapperConfig, so we wrote a thin direct CGO wrapper instead).

### Build & run
```bash
# From go-scoreboard/ — Mac (dev/simulator, no CGO, uses matrix_stub.go):
go build -o scoreboard ./cmd/scoreboard
./scoreboard --sim --once            # writes out/frame.png (no hardware)

# On the Pi (hardware, links librgbmatrix via -tags matrix):
go build -tags matrix -o scoreboard-matrix ./cmd/scoreboard
sudo ./scoreboard-matrix             # GPIO needs root

# Useful flags: --fetch-wnba --fetch-nhl --fetch-nba --fetch-config --demo-leagues=wnba,nhl,mlb,nba
#               --demo-baseball --env <path> --assets-dir <path> --tick-ms N --once
```

### The dev loop (exact process)
1. Edit Go source on the **Mac**.
2. Verify locally: `go build ./...` and a `--sim --once` render (read `out/frame.png`).
3. `git commit` + `git push` from the Mac.
4. On the Pi: `git pull`, then rebuild (`go build -tags matrix ...`), then run.
5. To *see* a render without a hardware run, `--sim --once` on the Pi and `scp` the
   `out/frame.png` back to the Mac to view it (logos only exist on the Pi).

### Gotchas (hard-won)
- **Never run `go get` or `go mod tidy` on the Pi.** Do all module changes on the Mac, commit,
  and let the Pi consume `go.mod`/`go.sum` read-only via `git pull`. Mutating modules on the Pi
  desyncs go.mod and makes `git pull` fail with "Please commit your changes." (This is why early
  sessions kept running `git checkout -- go.mod`; with modules touched only on the Mac, the Pi
  stays clean and that workaround is unnecessary.)
- **Logos are gitignored** (root `.gitignore` swallows all `assets/`) and live only on the Pi.
  They are white silhouettes by default; regenerate color variants with
  `go run ./cmd/fetch-logos --assets-dir ../assets` (WNBA), or add `--league nhl` / `--league mlb` /
  `--league nba` for the other leagues. Variants are namespaced by league on disk:
  `assets/logos/variants/<league>/<id>_<variant>.png`. Fonts, by contrast, are
  committed and `//go:embed`ed from `internal/render/assets/` (a local `.gitignore` override
  re-includes them).
- **ESPN start times omit seconds** (e.g. `2026-05-29T00:00Z`), which `time.RFC3339` rejects.
  Use `sports.parseEventTime` (handles both layouts) — a raw `time.Parse(time.RFC3339, ...)`
  silently yields the zero time, which renders as a bogus "4:07 PM" in `America/Los_Angeles`.
- **`.local` mDNS is flaky from the Mac**; prefer the IP/alias and re-check on connection failure.
- **Device-config fields not honored by the Go app.** Most of the config now drives behavior:
  `enabled_leagues` (including each league's `display_layout`, applied per-league in
  `currentScene`), `favorite_teams`, `refresh_config`, `matrix_config.brightness` (pushed to the
  panel via `SetBrightness` on every config reload), and `timezone` (system TZ is only the
  fallback when the name doesn't resolve). Still read-but-ignored: the rest of `matrix_config`
  (width/height/pixel mapper — hardcoded in `internal/display/matrix.go`) and `render_config`
  (`live_layout`, `logo_variant`). `priority_config` and `game_overrides` aren't in the
  `DeviceConfig` struct at all, so they're never even parsed. Don't expose those inert settings in
  the web UI as if they work.
- The Go module's `go` directive is `1.25.0`; the Pi runs Go 1.26.x and builds it fine.

## Web Admin (`web-admin/`)

Next.js 14 + TypeScript + Tailwind + Jest. Reads/writes device config to Supabase via Next.js API routes; users authenticate with Supabase Auth.

```bash
cd web-admin
npm ci
npm run dev              # local dev server
npm run build            # production build
npm run test             # jest
npm run test:ci          # with coverage
npm run lint             # eslint
npm run type-check       # tsc --noEmit
```

## Database

Supabase (Postgres + RLS). All migrations live in `supabase/migrations/`, numbered in order (`001_…`); `supabase/migrations/README.md` lists them. Apply via the Supabase CLI (project already linked):

```bash
supabase db push
```

Key tables: `devices`, `device_config`, `device_leagues`, `device_favorite_teams`, `sports`, `leagues`.

## Environment Variables

### Required
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DEVICE_ID=your-device-uuid
```

These three are the only environment variables the Go app reads. Simulation and demo modes are
**flags**, not env vars — see `--sim`, `--demo-leagues`, `--demo-live-big`, `--demo-baseball` under
"Build & run".

## Code Conventions

### TypeScript/React (web-admin)
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters`
- Separate UI components from business logic
- Error boundaries for runtime errors
- WCAG 2.1 AA accessibility
- No comments unless explicitly requested

### Database / API
- All tables use RLS policies
- Direct Supabase queries — no realtime subscriptions, no WebSockets
- Aggressive caching with intelligent invalidation
- 60-second poll interval for configuration updates

### Architecture rules
- **No WebSockets / realtime subscriptions** — polling only
- **No edge functions** — logic lives in the Go app + Next.js API
- **No device tokens** — RLS policies enforce ownership

## Troubleshooting

### Web Admin save errors
1. Check RLS policies are applied (migration 002)
2. Verify the signed-in user owns the device
3. Check browser console for API errors

### No games displaying
1. Verify sports are enabled in `device_leagues`
2. Check current season dates in `leagues` table
3. Run with `--demo-leagues=wnba,nhl` (Go) to isolate *Supabase/config* problems — it bypasses
   Supabase and takes the league list from the flag, but still calls the real ESPN/NHL endpoints,
   so it will not rule out an upstream API problem. To take the network out entirely, use
   `--demo-live-big` or `--demo-baseball`, which render a synthetic game with no network calls: if
   those draw and `--demo-leagues` doesn't, the fault is in fetching, not rendering.

## Guidelines

- Follow existing code patterns and conventions.
- Test in simulation mode before hardware deployment (`--sim --once`).
- Check that required environment variables are set.
- Prefer editing existing files over creating new ones.
- Use conventional commits (conventionalcommits.org) and gitmoji (gitmoji.dev) for all branch names, commit messages, and PR text.
- Never commit directly to main — branch first.
