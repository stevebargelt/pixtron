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
