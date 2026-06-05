import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { DeviceTeamsTab } from './DeviceTeamsTab'
import { ThemeProvider } from '@/contexts/ThemeContext'

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}))

import { supabase } from '@/lib/supabaseClient'

const mockGetSession = supabase.auth.getSession as jest.Mock

function renderTab(deviceId = 'test-device-1') {
  return render(
    <ThemeProvider defaultTheme="light">
      <DeviceTeamsTab deviceId={deviceId} />
    </ThemeProvider>
  )
}

describe('DeviceTeamsTab — MLB layout-picker branch', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'jwt-token' } } })
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === '/api/sports') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ sports: { mlb: [], nhl: [] } }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          sportConfigs: [
            {
              sport: 'mlb',
              enabled: true,
              priority: 1,
              display_layout: 'stacked',
              favorite_teams: [],
            },
            {
              sport: 'nhl',
              enabled: true,
              priority: 2,
              display_layout: 'stacked',
              favorite_teams: [],
            },
          ],
        }),
      })
    }) as any
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders static Baseball indicator for MLB and Stacked/Side-by-side buttons for NHL', async () => {
    renderTab()

    await waitFor(() => {
      expect(screen.getByText('MLB')).toBeInTheDocument()
      expect(screen.getByText('NHL')).toBeInTheDocument()
    })

    // MLB card: static 'Baseball' span rendered (not a button)
    expect(screen.getByText('Baseball')).toBeInTheDocument()

    // Layout toggle buttons appear exactly once — solely from the NHL card.
    // A count of 2 would indicate MLB incorrectly rendered the toggle.
    expect(screen.getAllByRole('button', { name: 'Stacked' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Side-by-side' })).toHaveLength(1)
  })
})

describe('DeviceTeamsTab — NBA styling branch', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'jwt-token' } } })
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === '/api/sports') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ sports: { nba: [], wnba: [] } }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          sportConfigs: [
            {
              sport: 'nba',
              enabled: true,
              priority: 1,
              display_layout: 'stacked',
              favorite_teams: [],
            },
            {
              sport: 'wnba',
              enabled: true,
              priority: 2,
              display_layout: 'stacked',
              favorite_teams: [],
            },
          ],
        }),
      })
    }) as any
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders NBA and WNBA badges and layout buttons', async () => {
    renderTab()

    await waitFor(() => {
      expect(screen.getByText('NBA')).toBeInTheDocument()
      expect(screen.getByText('WNBA')).toBeInTheDocument()
    })

    // Both NBA and WNBA get layout toggle buttons (neither is MLB).
    expect(screen.getAllByRole('button', { name: 'Stacked' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Side-by-side' })).toHaveLength(2)
  })

  it('NBA badge carries the same WNBA color token class as the WNBA badge', async () => {
    const { container } = renderTab()

    await waitFor(() => {
      expect(screen.getByText('NBA')).toBeInTheDocument()
      expect(screen.getByText('WNBA')).toBeInTheDocument()
    })

    // Both NBA and WNBA badge spans share the --color-league-wnba token.
    const nbaBadge = screen.getByText('NBA').closest('span')
    const wnbaBadge = screen.getByText('WNBA').closest('span')
    expect(nbaBadge).not.toBeNull()
    expect(wnbaBadge).not.toBeNull()
    // The badge class string includes the CSS variable token; both should match.
    expect(nbaBadge!.className).toBe(wnbaBadge!.className)
    // Specifically verify the WNBA token is present (not a fallback accent token).
    expect(nbaBadge!.className).toContain('color-league-wnba')
    void container
  })
})

describe('DeviceTeamsTab — NBA team pill rendering', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'jwt-token' } } })
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === '/api/sports') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            sports: {
              nba: [{ id: '13', name: 'Miami Heat', abbreviation: 'MIA' }],
            },
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          sportConfigs: [
            {
              sport: 'nba',
              enabled: true,
              priority: 1,
              display_layout: 'stacked',
              favorite_teams: ['13'],
            },
          ],
        }),
      })
    }) as any
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('NBA favorite team pill renders with WNBA color tokens, not the accent fallback', async () => {
    renderTab()

    // Badge and pill abbreviation must both appear.
    await waitFor(() => {
      expect(screen.getByText('NBA')).toBeInTheDocument()
      expect(screen.getByText('MIA')).toBeInTheDocument()
    })

    // The pill container (rounded-pill span) wrapping the team abbreviation must
    // carry the WNBA soft token class — the same class WNBA pills use — rather
    // than the accent-soft fallback that unrecognised leagues receive.
    const miaLabel = screen.getByText('MIA')
    const pillContainer = miaLabel.parentElement
    expect(pillContainer).not.toBeNull()
    expect(pillContainer!.className).toContain('color-league-wnba-soft')
    expect(pillContainer!.className).not.toContain('accent-soft')
  })
})
