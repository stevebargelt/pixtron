import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

const createClientMock = createClient as jest.MockedFunction<typeof createClient>

const getUserMock = jest.fn()
const eqMock = jest.fn()
const selectMock = jest.fn()
const fromMock = jest.fn()

const ORIGINAL_ENV = process.env

beforeEach(() => {
  jest.clearAllMocks()

  getUserMock.mockResolvedValue({
    data: { user: { id: 'user-uuid', email: 'test@example.com' } },
    error: null,
  })
  eqMock.mockResolvedValue({
    data: [
      {
        team_id: '18',
        name: 'Seattle Storm',
        abbreviation: 'SEA',
        conference: 'West',
        division: null,
        is_active: true,
        leagues: { code: 'wnba' },
      },
    ],
    error: null,
  })
  selectMock.mockReturnValue({ eq: eqMock })
  fromMock.mockReturnValue({ select: selectMock })

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

function createRequest(headers: Record<string, string> = {}, method = 'GET'): NextApiRequest {
  return { method, headers, query: {}, body: {}, cookies: {} } as unknown as NextApiRequest
}

function createResponse() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, any>,
    body: undefined,
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
  }
  return res as NextApiResponse & { statusCode: number; body: any }
}

async function loadHandler() {
  process.env = {
    ...ORIGINAL_ENV,
    NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  }

  let handler: ((req: NextApiRequest, res: NextApiResponse) => Promise<any>) | undefined
  await jest.isolateModulesAsync(async () => {
    handler = (await import('@/pages/api/sports/index')).default
  })
  if (!handler) throw new Error('Failed to load handler')
  return handler
}

describe('GET /api/sports', () => {
  it('returns 401 without an Authorization header and does not query the catalog', async () => {
    const handler = await loadHandler()
    const res = createResponse()
    await handler(createRequest(), res)
    expect(res.statusCode).toBe(401)
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('returns 401 when the token is invalid', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: 'bad jwt' } })
    const handler = await loadHandler()
    const res = createResponse()
    await handler(createRequest({ authorization: 'Bearer bad-token' }), res)
    expect(res.statusCode).toBe(401)
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('returns teams grouped by sport for a signed-in user', async () => {
    const handler = await loadHandler()
    const res = createResponse()
    await handler(createRequest({ authorization: 'Bearer user-token' }), res)
    expect(res.statusCode).toBe(200)
    expect(fromMock).toHaveBeenCalledWith('league_teams')
    expect(res.body.sports.wnba).toEqual([
      {
        id: '18',
        name: 'Seattle Storm',
        abbreviation: 'SEA',
        conference: 'West',
        division: null,
        sport: 'wnba',
      },
    ])
  })
})
