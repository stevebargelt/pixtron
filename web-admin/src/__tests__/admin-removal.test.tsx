import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import fs from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'

// Mock @supabase/supabase-js used directly by auth.ts
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

import { createClient } from '@supabase/supabase-js'
import { Navigation } from '../components/layout/Navigation'

const createClientMock = createClient as jest.MockedFunction<typeof createClient>
const getUserMock = jest.fn()

const PAGES_DIR = path.resolve(process.cwd(), 'src/pages')

// ─── 1. Admin route files are absent ────────────────────────────────────────

describe('Admin route file absence', () => {
  function collectRouteFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return []
    const results: string[] = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...collectRouteFiles(full))
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        results.push(full)
      }
    }
    return results
  }

  it('src/pages/admin/ contains no route files', () => {
    const adminPageFiles = collectRouteFiles(path.join(PAGES_DIR, 'admin'))
    expect(adminPageFiles).toHaveLength(0)
  })

  it('src/pages/api/admin/ contains no route files', () => {
    const adminApiFiles = collectRouteFiles(path.join(PAGES_DIR, 'api', 'admin'))
    expect(adminApiFiles).toHaveLength(0)
  })

  it('src/pages/api/auth/ contains no route files (no is-admin endpoint)', () => {
    const authApiFiles = collectRouteFiles(path.join(PAGES_DIR, 'api', 'auth'))
    expect(authApiFiles).toHaveLength(0)
  })
})

// ─── 2. Navigation renders no Admin nav item ─────────────────────────────────

describe('Navigation — no Admin nav item', () => {
  it('renders no link or text labelled "Admin" for any authenticated user', async () => {
    render(<Navigation />)

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /admin/i })).toBeNull()
      expect(screen.queryByText(/^admin$/i)).toBeNull()
    })
  })

  it('only renders the Dashboard nav item', async () => {
    render(<Navigation />)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
      const links = screen.getAllByRole('link')
      const linkTexts = links.map(l => l.textContent?.trim().toLowerCase())
      expect(linkTexts).not.toContain('admin')
    })
  })
})

// ─── 3. auth.ts — no requireAdmin, withAuth behaves correctly ────────────────

describe('auth.ts — admin code fully removed', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'

    createClientMock.mockImplementation(
      () =>
        ({
          auth: { getUser: getUserMock },
        }) as any
    )
  })

  it('requireAdmin is not exported from auth.ts', async () => {
    const authModule = await import('../lib/auth')
    expect((authModule as Record<string, unknown>).requireAdmin).toBeUndefined()
  })

  it('verifyAuth returns 401-destined result when Authorization header is missing', async () => {
    const { verifyAuth } = await import('../lib/auth')
    const req = { headers: {} } as unknown as NextApiRequest
    const result = await verifyAuth(req)
    expect(result.authenticated).toBe(false)
    expect(result.error).toMatch(/missing or invalid/i)
  })

  it('withAuth returns HTTP 401 when no token is provided', async () => {
    const { withAuth } = await import('../lib/auth')
    const handler = jest.fn()
    const wrapped = withAuth(handler)

    const req = {
      headers: {},
    } as unknown as NextApiRequest

    const res: any = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(body: unknown) {
        this.body = body
        return this
      },
    }

    await wrapped(req, res as NextApiResponse)
    expect(res.statusCode).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })

  it('withAuth passes through to handler when token is valid', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'user@example.com', role: 'authenticated' } },
      error: null,
    })

    const { withAuth } = await import('../lib/auth')
    const handler = jest.fn().mockResolvedValue(undefined)
    const wrapped = withAuth(handler)

    const req = {
      headers: { authorization: 'Bearer valid-token' },
    } as unknown as NextApiRequest

    const res: any = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(body: unknown) {
        this.body = body
        return this
      },
    }

    await wrapped(req, res as NextApiResponse)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(
      req,
      res,
      expect.objectContaining({ id: 'user-123', email: 'user@example.com' })
    )
  })

  it('withAuth never returns 403 (no admin gating remains)', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'user@example.com', role: 'authenticated' } },
      error: null,
    })

    const { withAuth } = await import('../lib/auth')
    const handler = jest.fn().mockResolvedValue(undefined)
    const wrapped = withAuth(handler)

    const req = {
      headers: { authorization: 'Bearer valid-token' },
    } as unknown as NextApiRequest

    const res: any = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(body: unknown) {
        this.body = body
        return this
      },
    }

    await wrapped(req, res as NextApiResponse)
    expect(res.statusCode).not.toBe(403)
  })
})
