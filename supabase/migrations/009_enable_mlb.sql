-- Enable MLB league for the 2026 season.
--
-- The MLB row was seeded in 003_seed_data.sql with is_active=false and a stale
-- 2025 current_season. This migration activates it and updates the season dates.

UPDATE leagues
SET
    is_active      = true,
    current_season = '{
        "year": 2026,
        "startDate": "2026-03-25",
        "endDate": "2026-10-31",
        "playoffStart": "2026-09-29",
        "isActive": true,
        "description": "2026 Season"
    }'::JSONB
WHERE code = 'mlb';
