import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabaseClient'

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    query: { id: 'device-123' },
    push: jest.fn(),
    route: '/device/[id]',
    pathname: '/device/[id]',
    asPath: '/device/device-123',
    prefetch: jest.fn().mockResolvedValue(undefined),
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
    isFallback: false,
    beforePopState: jest.fn(),
  }),
}))

import DevicePage from '../pages/device/[id]'

const Providers = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

function makeFetchResponse(opts: {
  ok: boolean
  status: number
  contentType?: string
  body?: object
}) {
  return {
    ok: opts.ok,
    status: opts.status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-type' ? (opts.contentType ?? null) : null,
    },
    json: jest.fn().mockResolvedValue(opts.body ?? {}),
  }
}

async function renderOnSettingsTab() {
  render(
    <Providers>
      <DevicePage />
    </Providers>
  )
  const settingsTab = await screen.findByRole('tab', { name: /settings/i })
  await userEvent.click(settingsTab)
}

describe('DevicePage – rename message live-region and fetch guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: 'test-jwt' } },
      error: null,
    })
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: { id: 'device-123', name: 'My Device' }, error: null }),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: 'device-123', name: 'My Device' }, error: null }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    }
    ;(supabase.from as jest.Mock).mockReturnValue(mockChain)
  })

  it('shows "Save failed: <status>" with role=alert when PATCH returns a non-JSON error', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        makeFetchResponse({ ok: false, status: 502, contentType: 'text/html' })
      ) as any

    await renderOnSettingsTab()

    const nameInput = await screen.findByPlaceholderText('My Scoreboard')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'New Name')

    await userEvent.click(screen.getByRole('button', { name: /save name/i }))

    await waitFor(() => {
      const msg = screen.getByRole('alert')
      expect(msg).toHaveTextContent('Save failed: 502')
    })
  })

  it('shows "Save failed: <error>" with role=alert when PATCH returns a JSON error', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      makeFetchResponse({
        ok: false,
        status: 400,
        contentType: 'application/json',
        body: { error: 'name must be a non-empty string' },
      })
    ) as any

    await renderOnSettingsTab()

    const nameInput = await screen.findByPlaceholderText('My Scoreboard')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Valid Name')

    await userEvent.click(screen.getByRole('button', { name: /save name/i }))

    await waitFor(() => {
      const msg = screen.getByRole('alert')
      expect(msg).toHaveTextContent('Save failed: name must be a non-empty string')
    })
  })

  it('shows "Name updated." with role=status on successful rename', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      makeFetchResponse({
        ok: true,
        status: 200,
        contentType: 'application/json',
        body: { name: 'Updated' },
      })
    ) as any

    await renderOnSettingsTab()

    const nameInput = await screen.findByPlaceholderText('My Scoreboard')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Updated')

    await userEvent.click(screen.getByRole('button', { name: /save name/i }))

    await waitFor(() => {
      const msg = screen.getByRole('status')
      expect(msg).toHaveTextContent('Name updated.')
    })
  })
})
