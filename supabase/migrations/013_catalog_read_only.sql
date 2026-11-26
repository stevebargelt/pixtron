-- Lock the shared catalog (sports, leagues, league_teams) to read-only for app users.
--
-- 002_rls_policies.sql gave every signed-in user FOR ALL on these tables, so any
-- authenticated client could insert, update or delete catalog rows that every
-- device reads. Drop those policies. The "... viewable by everyone" SELECT
-- policies from 002 stay as they are, so reads are unchanged. With no
-- INSERT/UPDATE/DELETE policy left, writes are denied to anon and authenticated;
-- the service role bypasses RLS, so operator writes (migrations, scripts) still work.

DROP POLICY IF EXISTS "Authenticated users can modify sports" ON sports;
DROP POLICY IF EXISTS "Authenticated users can modify leagues" ON leagues;
DROP POLICY IF EXISTS "Authenticated users can modify teams" ON league_teams;
