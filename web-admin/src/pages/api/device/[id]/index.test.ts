import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

const createClientMock = createClient as jest.MockedFunction<typeof createClient>

const getUserMock = jest.fn()
const maybeSingleMock = jest.fn()
const eqMock = jest.fn()
const selectMock = jest.fn()
const deleteMock = jest.fn()
const updateMock = jest.fn()
const fromMock = jest.fn()

const ORIGINAL_ENV = process.env

beforeEach(() => {
  jest.clearAllMocks()

  getUserMock.mockResolvedValue({
    data: { user: { id: 'user-uuid', email: 'test@example.com' } },
    error: null,
  })

  maybeSingleMock.mockResolvedValue({ data: { id: 'device-uuid', user_id: 'user-uuid' }, error: null })
  eqMock.mockReturnValue({ maybeSingle: maybeSingleMock })
  selectMock.mockReturnValue({ eq: eqMock })
  deleteMock.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) })
  updateMock.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) })

  fromMock.mockImplementation((table: string) => {
    if (table === 'devices')
      return { select: selectMock, delete: deleteMock, update: updateMock }
    return {}
  })

  createClientMock.mockImplementation(
    () =>
      ({
        auth: { getUser: getUserMock },
        from: fromMock,
      }) as any
  )
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

function createRequest(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: (overrides.method || 'DELETE') as any,
    headers: {
      authorization: 'Bearer user-token',
      ...(overrides.headers || {}),
    },
    body: overrides.body ?? {},
    query: (overrides as any).query || { id: 'device-uuid' },
    cookies: {},
  } as NextApiRequest
}

function createResponse() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, any>,
    body: undefined,
    _ended: false,
    setHeader(name: string, value: any) {
      this.headers[name] = value
    },
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: any) {
      this.body = payload
      return this
    },
    end() {
      this._ended = true
      return this
    },
  }
  return res as NextApiResponse & {
    statusCode: number
    headers: Record<string, any>
    body: any
    _ended: boolean
  }
}

async function loadHandler() {
  process.env = {
    ...ORIGINAL_ENV,
    NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  }

  let handler: ((req: NextApiRequest, res: NextApiResponse) => Promise<any>) | undefined

  await jest.isolateModulesAsync(async () => {
    handler = (await import('./index')).default
  })

  if (!handler) throw new Error('Failed to load handler')
  return handler
}

describe('PATCH /api/device/[id] – rename device', () => {
  it('returns 200 and updated name on valid input', async () => {
    const handler = await loadHandler()
    const req = createRequest({ method: 'PATCH', body: { name: 'New Name' } })
    const res = createResponse()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ name: 'New Name' })
  })

  it('trims the name before saving', async () => {
    const handler = await loadHandler()
    const req = createRequest({ method: 'PATCH', body: { name: '  Trimmed  ' } })
    const res = createResponse()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ name: 'Trimmed' })
    const updateEqMock = updateMock.mock.results[0].value.eq as jest.Mock
    expect(updateEqMock).toHaveBeenCalledWith('id', 'device-uuid')
  })

  it('rejects an empty name', async () => {
    const handler = await loadHandler()
    const req = createRequest({ method: 'PATCH', body: { name: '' } })
    const res = createResponse()

    await handler(req, res)

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/name/i)
  })

  it('rejects a whitespace-only name', async () => {
    const handler = await loadHandler()
    const req = createRequest({ method: 'PATCH', body: { name: '   ' } })
    const res = createResponse()

    await handler(req, res)

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/name/i)
  })

  it('rejects a non-string name', async () => {
    const handler = await loadHandler()
    const req = createRequest({ method: 'PATCH', body: { name: 42 } })
    const res = createResponse()

    await handler(req, res)

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/name/i)
  })

  it('returns 401 when no auth header', async () => {
    const handler = await loadHandler()
    const req = createRequest({ method: 'PATCH', headers: { authorization: '' }, body: { name: 'X' } })
    const res = createResponse()

    await handler(req, res)

    expect(res.statusCode).toBe(401)
  })

  it('returns 403 when device not found or not owned', async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null })
    const handler = await loadHandler()
    const req = createRequest({ method: 'PATCH', body: { name: 'X' } })
    const res = createResponse()

    await handler(req, res)

    expect(res.statusCode).toBe(403)
  })
})

describe('DELETE /api/device/[id]', () => {
  it('returns 204 on successful delete', async () => {
    const handler = await loadHandler()
    const req = createRequest({ method: 'DELETE' })
    const res = createResponse()

    await handler(req, res)

    expect(res.statusCode).toBe(204)
    expect(res._ended).toBe(true)
  })

  it('returns 405 for unsupported methods', async () => {
    const handler = await loadHandler()
    const req = createRequest({ method: 'GET' } as any)
    const res = createResponse()

    await handler(req, res)

    expect(res.statusCode).toBe(405)
    expect(res.headers['Allow']).toEqual(['DELETE', 'PATCH'])
  })
})
