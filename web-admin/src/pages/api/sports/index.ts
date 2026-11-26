import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'
import { getAdminClient, withAuth } from '@/lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
  try {
    const { data, error } = await getAdminClient()
      .from('league_teams')
      .select('team_id, name, abbreviation, conference, division, is_active, leagues(code)')
      .eq('is_active', true)

    if (error) {
      console.error('sports API DB error:', error.message)
    }

    const supportedSports = ['wnba', 'nhl', 'nba', 'mlb', 'nfl'] as const
    const grouped: Record<string, any[]> = Object.fromEntries(supportedSports.map(s => [s, []]))

    if (data && data.length > 0) {
      for (const row of data as any[]) {
        const sport = String(row.leagues?.code || '')
        if (!grouped[sport]) continue
        grouped[sport].push({
          id: row.team_id,
          name: row.name,
          abbreviation: row.abbreviation,
          conference: row.conference,
          division: row.division,
          sport,
        })
      }
      return res.status(200).json({ sports: grouped })
    }

    // Fallback: read from local assets when DB has no rows
    try {
      const root = path.resolve(process.cwd(), '..')
      // WNBA fallback (prefer new file if present)
      let wnba: any[] = []
      try {
        const wnbaPathNew = path.join(root, 'assets', 'wnba_teams.json')
        const wnbaNew = JSON.parse(await fs.readFile(wnbaPathNew, 'utf-8'))
        wnba = (wnbaNew.teams || wnbaNew || []).map((t: any) => ({
          id: String(t.id || t.abbr),
          name: t.name || t.displayName,
          abbreviation: (t.abbr || t.abbreviation || '').toUpperCase(),
          conference: t.conference,
          division: t.division,
          sport: 'wnba',
        }))
      } catch {
        try {
          const wnbaPathLegacy = path.join(root, 'assets', 'teams.json')
          const legacy = JSON.parse(await fs.readFile(wnbaPathLegacy, 'utf-8'))
          wnba = (legacy.teams || []).map((t: any) => ({
            id: String(t.id || t.abbr),
            name: t.name || t.displayName,
            abbreviation: (t.abbr || t.abbreviation || '').toUpperCase(),
            conference: t.conference,
            division: t.division,
            sport: 'wnba',
          }))
        } catch {}
      }
      // NHL fallback
      let nhl: any[] = []
      try {
        const nhlPath = path.join(root, 'assets', 'nhl_teams.json')
        const nhlJson = JSON.parse(await fs.readFile(nhlPath, 'utf-8'))
        nhl = (nhlJson.teams || nhlJson || []).map((t: any) => ({
          id: String(t.id || t.teamId || t.abbr),
          name: t.name || t.teamName || t.displayName,
          abbreviation: (t.abbr || t.abbreviation || t.triCode || '').toUpperCase(),
          conference: t.conference,
          division: t.division,
          sport: 'nhl',
        }))
      } catch {}

      // Build grouped response
      grouped.wnba = wnba
      grouped.nhl = nhl
      return res.status(200).json({ sports: grouped })
    } catch (e: any) {
      console.error('sports API asset fallback error:', e?.message || e)
      return res.status(200).json({ sports: { wnba: [], nhl: [], nba: [], mlb: [], nfl: [] } })
    }
  } catch (error: any) {
    console.error('sports API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withAuth(handler)
