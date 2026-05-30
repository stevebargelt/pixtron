-- Resolve a get_device_configuration overloading conflict.
--
-- The tracked migrations only ever define get_device_configuration(UUID)
-- (004, refreshed in 007 to add per-league layout). A get_device_configuration(TEXT)
-- overload also exists in the remote database from earlier out-of-band drift
-- (created via the SQL editor, never captured as a migration). With both present,
-- PostgREST cannot choose a candidate and the RPC fails with PGRST203.
--
-- Drop the stale TEXT overload, leaving the UUID version (which carries the
-- current body, including enabled_leagues[].layout) as the sole definition.
-- Callers pass the device id as a JSON string; PostgREST casts it to UUID.

DROP FUNCTION IF EXISTS get_device_configuration(text);
