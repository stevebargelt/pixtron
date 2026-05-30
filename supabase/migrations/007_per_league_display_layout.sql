-- Per-league live-view layout.
--
-- The live-view layout (stacked vs side_by_side, and sport-specific layouts to
-- come, e.g. MLB) is a property of each enabled league on a device, not a single
-- device-wide setting: the valid options differ by sport, so they live on
-- device_leagues. The Go app reads enabled_leagues[].layout and picks the scene
-- per game. The device-wide render_config.live_layout remains for backward
-- compatibility but is superseded by the per-league value.

ALTER TABLE device_leagues
    ADD COLUMN IF NOT EXISTS display_layout VARCHAR(50) DEFAULT 'stacked';

-- Recreate get_device_configuration to emit each enabled league's layout.
CREATE OR REPLACE FUNCTION get_device_configuration(p_device_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_config JSON;
BEGIN
    WITH device_data AS (
        SELECT
            d.id,
            d.name,
            d.last_seen_ts,
            dc.timezone,
            dc.brightness,
            dc.matrix_width,
            dc.matrix_height,
            dc.refresh_pregame_sec,
            dc.refresh_ingame_sec,
            dc.refresh_final_sec,
            dc.live_display_layout,
            dc.display_config,
            dc.priority_config
        FROM devices d
        LEFT JOIN device_config dc ON dc.device_id = d.id
        WHERE d.id = p_device_id
    ),
    enabled_leagues AS (
        SELECT
            json_agg(
                json_build_object(
                    'code', l.code,
                    'name', l.name,
                    'priority', dl.priority,
                    'layout', COALESCE(dl.display_layout, 'stacked')
                ) ORDER BY dl.priority
            ) AS leagues
        FROM device_leagues dl
        JOIN leagues l ON l.id = dl.league_id
        WHERE dl.device_id = p_device_id
        AND dl.enabled = true
    ),
    favorite_teams AS (
        SELECT
            l.code AS league_code,
            json_agg(
                json_build_object(
                    'team_id', dft.team_id,
                    'name', COALESCE(lt.name, dft.team_id),
                    'abbreviation', COALESCE(lt.abbreviation, UPPER(LEFT(dft.team_id, 3))),
                    'logo_url', lt.logo_url
                ) ORDER BY dft.priority
            ) AS teams
        FROM device_favorite_teams dft
        JOIN leagues l ON l.id = dft.league_id
        LEFT JOIN league_teams lt ON lt.league_id = dft.league_id AND lt.team_id = dft.team_id
        WHERE dft.device_id = p_device_id
        GROUP BY l.code
    )
    SELECT json_build_object(
        'device_id', device_data.id,
        'device_name', device_data.name,
        'timezone', COALESCE(device_data.timezone, 'America/Los_Angeles'),
        'matrix_config', json_build_object(
            'width', COALESCE(device_data.matrix_width, 128),
            'height', COALESCE(device_data.matrix_height, 64),
            'brightness', COALESCE(device_data.brightness, 100)
        ),
        'refresh_config', json_build_object(
            'pregame_sec', COALESCE(device_data.refresh_pregame_sec, 600),
            'ingame_sec', COALESCE(device_data.refresh_ingame_sec, 120),
            'final_sec', COALESCE(device_data.refresh_final_sec, 900)
        ),
        'render_config', json_build_object(
            'live_layout', COALESCE(device_data.live_display_layout, 'stacked'),
            'logo_variant', COALESCE(device_data.display_config->>'logo_variant', 'mini')
        ),
        'enabled_leagues', COALESCE(enabled_leagues.leagues, '[]'::json),
        'favorite_teams', COALESCE(
            (SELECT json_object_agg(league_code, teams) FROM favorite_teams),
            '{}'::json
        ),
        'priority_config', COALESCE(device_data.priority_config::json, '{}'::json),
        'last_updated', NOW()
    ) INTO v_config
    FROM device_data
    LEFT JOIN enabled_leagues ON true;

    IF v_config IS NULL THEN
        RAISE EXCEPTION 'Device % not found', p_device_id;
    END IF;

    UPDATE devices
    SET last_seen_ts = NOW()
    WHERE id = p_device_id;

    RETURN v_config;
END;
$$;

COMMENT ON COLUMN device_leagues.display_layout IS 'Live-view scene layout for this league on this device (e.g. stacked, side_by_side); options are sport-specific.';
