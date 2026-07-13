# Supabase Setup

Step-by-step guide to setting up a new Supabase project for the LED Scoreboard. Higher-level overview is in `supabase/README.md` and the top-level `README.md`.

## Prerequisites

- Supabase account with project created
- Project credentials (URL, anon key, service role key) from Settings → API
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed and authenticated (`supabase login`)

## Step 1: Configure environment

Values you'll need from Supabase Dashboard → Settings → API:

- `SUPABASE_URL` (e.g. `https://abcdef.supabase.co`)
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (secret — used server-side by the web admin and by `scripts/run_supabase_migrations.sh`; the device never reads it)

Where they go:

- **Web admin** (`web-admin/.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Device** (`.env` on the Pi): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, plus `DEVICE_ID` (obtained after registering the device via the web admin)

See `.env.example` for the full device-side surface. Everything else about the device — brightness, timezone, refresh intervals, layout — lives in the `device_config` table and is edited via the web admin, not the environment.

## Step 2: Run migrations

Use the Supabase CLI to apply all migrations at once:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

This applies all 10 migrations in order (001–010). Requires the database password shown at project creation.

### Verify

```sql
-- All expected tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
-- Expect: device_config, device_favorite_teams, device_leagues,
--         devices, game_overrides, league_teams, leagues, sports

-- RLS is on
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- Seed data loaded
SELECT l.code, l.name, s.name AS sport
FROM leagues l JOIN sports s ON l.sport_id = s.id;
```

## Step 3: Register your first device

The intended flow is to sign up via the web admin and register the device through the UI — that handles ownership correctly and gives you a `DEVICE_ID` to install on the Pi.

If you need to bootstrap one manually in SQL:

```sql
INSERT INTO devices (name, user_id)
VALUES ('Living Room Display', '<your-user-id-from-auth.users>')
RETURNING id;
-- The returned UUID becomes DEVICE_ID in the device's .env
```

## Troubleshooting

- **Connection errors:** verify URL + keys; check the project isn't paused (free-tier projects pause after 7 days inactive); confirm RLS allows access for the calling user
- **Missing tables:** migrations must run in order; check `supabase db push` output for errors
- **Device-not-found in the device app:** confirm `DEVICE_ID` matches a row in `devices`, the device has `user_id` set, and the user owns it (RLS check)
