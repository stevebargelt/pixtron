# Supabase Setup - Direct Integration

## Overview

This directory contains SQL migrations for the LED Scoreboard's direct Supabase integration. The device polls configuration directly from the database — no agents, websockets, or edge functions required.

## Migration Structure

There are **10 migrations** in `migrations/` (001–010). See `migrations/README.md` for the full list.

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings → API

### 2. Run Migrations

Use the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### 3. Create Your Device

```sql
-- Get your user ID
SELECT id, email FROM auth.users;

-- Create a device
INSERT INTO devices (name, user_id)
VALUES ('Living Room Display', 'your-user-id-here')
RETURNING id;

-- Note the device ID for your .env file
```

## Verify Setup

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should see:
-- device_config, device_favorite_teams, device_leagues,
-- devices, game_overrides, league_teams, leagues, sports

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Check sports/leagues are seeded
SELECT l.code, l.name, s.name as sport
FROM leagues l
JOIN sports s ON l.sport_id = s.id;
```

## Configuration Flow

1. **Web Admin** writes configuration to:
   - `device_config` - Display settings (timezone, brightness, etc.)
   - `device_leagues` - Which sports are enabled
   - `device_favorite_teams` - Favorite teams per sport

2. **Device** polls every 60 seconds:
   - Reads configuration from database
   - Updates display accordingly
   - No websockets or real-time subscriptions

## Table Structure

### Core Tables
- `devices` - User devices with ownership
- `device_config` - Device settings (hybrid columns + JSONB)

### Sports Hierarchy
- `sports` - Sport definitions (Basketball, Hockey, etc.)
- `leagues` - League implementations (WNBA, NHL, etc.)
- `league_teams` - Teams within leagues
- `device_leagues` - Enabled leagues per device
- `device_favorite_teams` - Favorite teams per device

### Additional
- `game_overrides` - Force specific games to display

## Development Tips

### Using Supabase CLI

```bash
# Install CLI, then:
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### Reset Database (Development Only)

```sql
-- Drop all tables and start fresh
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then run supabase db push to re-apply all migrations
```

## Notes

- No edge functions needed - direct database access only
- No device tokens or agent authentication required
- RLS policies ensure users can only access their own devices
- The device uses read-only access (anon key)
- Web admin uses authenticated access for configuration

## Archived Content

All old migrations and edge function code have been moved to `archive/` for reference. These are from the previous agent/websocket architecture and are no longer used.