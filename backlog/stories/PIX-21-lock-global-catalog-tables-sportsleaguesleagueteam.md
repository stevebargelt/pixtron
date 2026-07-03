---
id: PIX-21
type: story
status: active
title: Lock global catalog tables (sports/leagues/league_teams) to read-only for authenticated users via RLS
---

Replaces the RLS half of the now-closed #10 (the UI-gating and admin-role halves were resolved by removing the admin screen — PR #1 / 23be072).

Problem (pre-existing, multi-tenant gap): the shared catalog tables sports / leagues / league_teams currently allow writes from any authenticated user (RLS guard auth.role() = 'authenticated', migration 002_rls_policies.sql). With the admin UI gone there is no user-facing writer, but the RLS hole still lets any signed-in user edit shared catalog data directly via the Supabase client — affecting ALL users' devices (delete a league, change season dates, edit the team directory).

Decision context: 'admin' is a single platform-operator concept, NOT a per-tenant role. There is no JWT role claim or user_roles table — we deliberately descoped that. Catalog writes happen out-of-band by the operator (service-role key / migrations / scripts), coupled to Go fetcher work.

Scope:
- Tighten RLS on sports, leagues, league_teams: SELECT stays open to authenticated; INSERT/UPDATE/DELETE denied to authenticated (writes only via service-role).
- Verify the Go app (read-only catalog consumer) and any operator scripts still function under the new policies.
- New migration in supabase/migrations/ (next number), applied via `supabase db push`.

Defense-in-depth: the user-facing app no longer writes the catalog, so this is closing the direct-Postgres-client path, not unblocking a feature.