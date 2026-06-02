import type { NextApiRequest, NextApiResponse } from 'next'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

import { createClient } from '@supabase/supabase-js'

const createClientMock = createClient as jest.MockedFunction<typeof createClient>

function makeSupabaseClient(opts: {
  userResult?: { data: { user: unknown }; error: unknown }
  deviceRow?: object | null
  updateResult?: { error: unknown }
}) {
  const userResult = opts.userResult ?? {
    data: { user: { id: 'user-123' } },
    error: null,
  }
  const deviceRow =
    opts.deviceRow !== undefined ? opts.deviceRow : { id: 'device-abc', user_id: 'user-123' }
  const updateResult = opts.updateResult ?? { error: null }

  const eqForSelect = {
    maybeSingle: jest.fn().mockResolvedValue({ data: deviceRow, error: null }),
  }
  const selectChain = {
    select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue(eqForSelect) }),
  }
  const updateChain = {
    update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue(updateResult) }),
    delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
  }

  createClientMock.mockReturnValue({
    auth: { getUser: jest.fn().mockResolvedValue(userResult) },
    from: jest.fn().mockReturnValueOnce(selectChain).mockReturnValueOnce(updateChain),
  } as unknown as ReturnType<typeof createClient>)
}

function makeReq(opts: {
  method: string
  deviceId?: string
  body?: object
  authHeader?: string | null // null = omit Authorization header entirely
}): NextApiRequest {
  const authValue = opts.authHeader === null ? undefined : (opts.authHeader ?? 'Bearer test-token')
  return {
    method: opts.method,
    query: { id: opts.deviceId ?? 'device-abc' },
    body: opts.body,
    headers: authValue !== undefined ? { authorization: authValue } : {},
  } as unknown as NextApiRequest
}

function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, unknown>,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(body: unknown) {
      this.body = body
      return this
    },
    setHeader(name: string, value: unknown) {
      this.headers[name] = value
      return this
    },
    end() {
      return this
    },
  }
  return res
}

describe('PATCH /api/device/[id] – rename handler integration', () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void | NextApiResponse>

  beforeAll(async () => {
    const mod = await import('../pages/api/device/[id]/index')
    handler = mod.default
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 200 with the trimmed name on a valid PATCH', async () => {
    makeSupabaseClient({})
    const req = makeReq({ method: 'PATCH', body: { name: '  New Name  ' } })
    const res = makeRes()

    await handler(req, res as unknown as NextApiResponse)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ name: 'New Name' })
  })

  it('returns 400 when name is an empty string', async () => {
    makeSupabaseClient({})
    const req = makeReq({ method: 'PATCH', body: { name: '' } })
    const res = makeRes()

    await handler(req, res as unknown as NextApiResponse)

    expect(res.statusCode).toBe(400)
    expect((res.body as { error: string }).error).toMatch(/non-empty/i)
  })

  it('returns 400 when name is whitespace only (trimmed to empty)', async () => {
    makeSupabaseClient({})
    const req = makeReq({ method: 'PATCH', body: { name: '   ' } })
    const res = makeRes()

    await handler(req, res as unknown as NextApiResponse)

    expect(res.statusCode).toBe(400)
    expect((res.body as { error: string }).error).toMatch(/non-empty/i)
  })

  it('returns 400 when name is missing from the request body', async () => {
    makeSupabaseClient({})
    const req = makeReq({ method: 'PATCH', body: {} })
    const res = makeRes()

    await handler(req, res as unknown as NextApiResponse)

    expect(res.statusCode).toBe(400)
  })

  it('returns 401 when the Authorization header is absent', async () => {
    const req = makeReq({ method: 'PATCH', body: { name: 'Valid' }, authHeader: null })
    const res = makeRes()

    await handler(req, res as unknown as NextApiResponse)

    expect(res.statusCode).toBe(401)
  })

  it('returns 401 when the token is invalid (getUser returns error)', async () => {
    makeSupabaseClient({
      userResult: { data: { user: null }, error: { message: 'bad token' } },
    })
    const req = makeReq({ method: 'PATCH', body: { name: 'Valid' } })
    const res = makeRes()

    await handler(req, res as unknown as NextApiResponse)

    expect(res.statusCode).toBe(401)
  })

  it('returns 403 when the device does not belong to the authenticated user', async () => {
    makeSupabaseClient({ deviceRow: null })
    const req = makeReq({ method: 'PATCH', body: { name: 'Valid' } })
    const res = makeRes()

    await handler(req, res as unknown as NextApiResponse)

    expect(res.statusCode).toBe(403)
  })

  it('returns 405 for non-PATCH non-DELETE methods', async () => {
    const req = makeReq({ method: 'GET' })
    const res = makeRes()

    await handler(req, res as unknown as NextApiResponse)

    expect(res.statusCode).toBe(405)
    expect(res.headers['Allow']).toContain('PATCH')
  })
})
