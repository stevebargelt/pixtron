---
id: PIX-10
type: story
status: done
title: Add admin role + gate the global Sports & Leagues catalog
---

**Closed:** 2026-05-30. Commit `23be072`.

Multi-tenant gap (pre-existing): the global sports/leagues/league_teams catalog RLS guard is auth.role() = 'authenticated' (migration 002_rls_policies.sql) — ANY signed-in user can edit shared catalog data that affects ALL users' devices (delete a league, change season dates, edit the team directory).

Decision (2026-05-28): for the web-admin redesign, screen 06 (admin Sports & Leagues catalog) ships OPEN to authenticated users for now, to unblock testing. Lock it down later via this ticket.

Scope:
- Introduce an admin role — Supabase app_metadata/JWT claim, or a profiles/user_roles table.
- Gate the Admin nav item + the /admin/sports-leagues route SERVER-SIDE (route guard / RLS), not just UI hiding.
- Tighten the sports / leagues / league_teams RLS policies to require admin instead of merely authenticated.
- Implement the 403 / forbidden state already designed in frame 06.

Ref: designs/web-admin-redesign-handoff.md sections 6.5 and 11 (Q3). The 6 user-facing screens (dashboard, onboarding, teams, settings, picker) need no roles; this is catalog-curation gating only.