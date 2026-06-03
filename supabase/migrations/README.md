# Database Migrations

There are **10 migrations** that set up the entire database. Apply them with the Supabase CLI (the project is already linked):

```bash
supabase db push
```

## Migration list

1. **`001_complete_schema.sql`** — All tables, indexes, functions, and triggers
2. **`002_rls_policies.sql`** — Complete Row Level Security setup
3. **`003_seed_data.sql`** — Initial sports and leagues data (WNBA, NHL, NBA, MLB, NFL)
4. **`004_device_config_functions.sql`** — Device configuration access functions
5. **`005_save_device_teams.sql`** — `save_device_teams` RPC
6. **`006_persist_favorite_priority.sql`** — Persists user-chosen favorite team order
7. **`007_per_league_display_layout.sql`** — Per-league live-view layout column
8. **`008_drop_text_device_config_overload.sql`** — Resolves a function overload conflict
9. **`009_enable_mlb.sql`** — Activates MLB league for the 2026 season
10. **`010_seed_mlb_teams.sql`** — Seeds all 30 MLB teams

## What Gets Created

### Tables (8 total)
- `devices` - User devices with ownership
- `device_config` - Device display settings
- `sports` - Sport definitions (Basketball, Hockey, etc.)
- `leagues` - League implementations (WNBA, NHL, MLB, NBA, NFL)
- `league_teams` - Teams within leagues
- `device_leagues` - Enabled leagues per device
- `device_favorite_teams` - Favorite teams per device
- `game_overrides` - Force specific games to display

### Automatic Features
- RLS policies for secure access
- Auto-initialization of device config
- Auto-initialization of league entries
- Update timestamp triggers

## Archived Migrations

The `archive/` folder contains old migrations from the previous architecture. These are kept for reference but should NOT be run.
