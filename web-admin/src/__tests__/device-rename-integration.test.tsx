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

const DEVICE_NAME = 'Pi Living Room'

const Providers = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

function makeFetchResponse(opts: {
  ok: boolean
  status: number
  contentType?: string
  body?: object
  jsonSpy?: jest.Mock
}) {
  const jsonFn = opts.jsonSpy ?? jest.fn().mockResolvedValue(opts.body ?? {})
  return {
    ok: opts.ok,
    status: opts.status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-type' ? (opts.contentType ?? null) : null,
    },
    json: jsonFn,
  }
}

function setupSupabaseMocks(deviceName = DEVICE_NAME) {
  ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: { access_token: 'tok-xyz' } },
    error: null,
  })
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest
      .fn()
      .mockResolvedValue({ data: { id: 'device-123', name: deviceName }, error: null }),
    single: jest
      .fn()
      .mockResolvedValue({ data: { id: 'device-123', name: deviceName }, error: null }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  }
  ;(supabase.from as jest.Mock).mockReturnValue(chain)
}

async function renderAndOpenSettings() {
  render(
    <Providers>
      <DevicePage />
    </Providers>
  )
  const settingsTab = await screen.findByRole('tab', { name: /settings/i })
  await userEvent.click(settingsTab)
}

function makePatchDispatcher(patchResponse: ReturnType<typeof makeFetchResponse>) {
  return jest.fn().mockImplementation((url: string, opts?: RequestInit) => {
    if (opts?.method === 'PATCH') return Promise.resolve(patchResponse)
    return Promise.resolve(makeFetchResponse({ ok: false, status: 404 }))
  }) as unknown as typeof fetch
}

describe('DevicePage – device rename integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default fetch: non-ok for all API calls so settings stay at defaults (no dirty banner)
    global.fetch = jest
      .fn()
      .mockResolvedValue(makeFetchResponse({ ok: false, status: 404 })) as unknown as typeof fetch
    setupSupabaseMocks()
  })

  describe('happy-path rename', () => {
    it('updates the page h1 heading to reflect the new device name after a successful rename', async () => {
      const newName = 'Game Room Pi'
      global.fetch = makePatchDispatcher(
        makeFetchResponse({
          ok: true,
          status: 200,
          contentType: 'application/json',
          body: { name: newName },
        })
      )

      await renderAndOpenSettings()

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(DEVICE_NAME)

      const nameInput = await screen.findByPlaceholderText('My Scoreboard')
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, newName)
      await userEvent.click(screen.getByRole('button', { name: /save name/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(newName)
      })
    })
  })

  describe('validation – Save Name button disabled state', () => {
    it('disables Save Name button when the name input is empty', async () => {
      await renderAndOpenSettings()

      const nameInput = await screen.findByPlaceholderText('My Scoreboard')
      await userEvent.clear(nameInput)

      expect(screen.getByRole('button', { name: /save name/i })).toBeDisabled()
    })

    it('disables Save Name button when the name input is whitespace only', async () => {
      await renderAndOpenSettings()

      const nameInput = await screen.findByPlaceholderText('My Scoreboard')
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, '   ')

      expect(screen.getByRole('button', { name: /save name/i })).toBeDisabled()
    })

    it('disables Save Name button when the trimmed input matches the current device name', async () => {
      await renderAndOpenSettings()

      await waitFor(() => {
        expect(screen.getByPlaceholderText('My Scoreboard')).toHaveValue(DEVICE_NAME)
      })

      expect(screen.getByRole('button', { name: /save name/i })).toBeDisabled()
    })
  })

  describe('error path – content-type guard on non-JSON response', () => {
    it('does not call json() on a non-JSON PATCH response and surfaces the status code', async () => {
      const jsonSpy = jest.fn()
      global.fetch = makePatchDispatcher(
        makeFetchResponse({
          ok: false,
          status: 502,
          contentType: 'text/html; charset=utf-8',
          jsonSpy,
        })
      )

      await renderAndOpenSettings()

      const nameInput = await screen.findByPlaceholderText('My Scoreboard')
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'New Name')
      await userEvent.click(screen.getByRole('button', { name: /save name/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Save failed: 502')
      })
      expect(jsonSpy).not.toHaveBeenCalled()
    })
  })

  describe('a11y live-region – before and after interaction', () => {
    it('renders no rename live-region before any save attempt', async () => {
      await renderAndOpenSettings()
      await screen.findByPlaceholderText('My Scoreboard')

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      // settings are clean (config returns 404), so no Unsaved Changes alert either
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('clears the rename live-region message when the user edits the input after a save', async () => {
      global.fetch = makePatchDispatcher(
        makeFetchResponse({
          ok: true,
          status: 200,
          contentType: 'application/json',
          body: { name: 'First Rename' },
        })
      )

      await renderAndOpenSettings()

      const nameInput = await screen.findByPlaceholderText('My Scoreboard')
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'First Rename')
      await userEvent.click(screen.getByRole('button', { name: /save name/i }))

      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Name updated.'))

      // Typing in the input clears the message (onChange handler calls setNameMessage(''))
      await userEvent.type(nameInput, ' Extra')

      await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
    })
  })
})
