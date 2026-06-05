-- Enable NBA league for the 2025-26 season.
--
-- The NBA row was seeded in 003_seed_data.sql with is_active=false and a stale
-- 2024-25 season. This migration activates it and updates the season dates.
-- As of 2026-06-05 we are mid-NBA-Finals, so the window covers Oct 2025 through
-- late June 2026 to keep NBA active now.

UPDATE leagues
SET
    is_active      = true,
    current_season = '{
        "year": 2026,
        "startDate": "2025-10-22",
        "endDate": "2026-06-25",
        "playoffStart": "2026-04-15",
        "isActive": true,
        "description": "2025-26 Season"
    }'::JSONB
WHERE code = 'nba';
