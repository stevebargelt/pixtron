import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

const createClientMock = createClient as jest.MockedFunction<typeof createClient>

const getUserMock = jest.fn()
const fromMock = jest.fn()

const ORIGINAL_ENV = process.env

beforeEach(() => {
  jest.clearAllMocks()

  getUserMock.mockResolvedValue({
    data: { user: { id: 'user-uuid', email: 'test@example.com' } },
    error: null,
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
    method: (overrides.method || 'GET') as any,
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
  return res as NextApiResponse & { statusCode: number; headers: Record<string, any>; body: any }
}

async function loadHandler() {
  process.env = {
    ...ORIGINAL_ENV,
    NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  }

  let handler: ((req: NextApiRequest, res: NextApiResponse) => Promise<void>) | undefined

  await jest.isolateModulesAsync(async () => {
    handler = (await import('./sports')).default
  })

  if (!handler) throw new Error('Failed to load handler')
  return handler
}

describe('GET /api/device/[id]/sports – active league filtering', () => {
  it('only returns sportConfigs for is_active=true leagues, excluding is_active=false', async () => {
    // device_leagues rows: one active (nhl), one inactive (nba)
    const leaguesData = [
      { enabled: true, priority: 1, display_layout: 'stacked', league: { code: 'nhl', is_active: true } },
      { enabled: true, priority: 2, display_layout: 'stacked', league: { code: 'nba', is_active: false } },
    ]

    const orderMock = jest.fn().mockResolvedValue({ data: leaguesData, error: null })
    const leaguesEqMock = jest.fn().mockReturnValue({ order: orderMock })
    const leaguesSelectMock = jest.fn().mockReturnValue({ eq: leaguesEqMock })

    const favsEqMock = jest.fn().mockResolvedValue({ data: [], error: null })
    const favsSelectMock = jest.fn().mockReturnValue({ eq: favsEqMock })

    const overrideLimitMock = jest.fn().mockReturnValue({
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })
    const overrideOrderMock = jest.fn().mockReturnValue({ limit: overrideLimitMock })
    const overrideGtMock = jest.fn().mockReturnValue({ order: overrideOrderMock })
    const overrideEqMock = jest.fn().mockReturnValue({ gt: overrideGtMock })
    const overrideSelectMock = jest.fn().mockReturnValue({ eq: overrideEqMock })

    const deviceMaybeSingleMock = jest.fn().mockResolvedValue({
      data: { id: 'device-uuid' },
      error: null,
    })
    const deviceEqMock = jest.fn().mockReturnValue({ maybeSingle: deviceMaybeSingleMock })
    const deviceSelectMock = jest.fn().mockReturnValue({ eq: deviceEqMock })

    fromMock.mockImplementation((table: string) => {
      if (table === 'devices') return { select: deviceSelectMock }
      if (table === 'device_leagues') return { select: leaguesSelectMock }
      if (table === 'device_favorite_teams') return { select: favsSelectMock }
      if (table === 'game_overrides') return { select: overrideSelectMock }
      return {}
    })

    const handler = await loadHandler()
    const req = createRequest({ method: 'GET' })
    const res = createResponse()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    const { sportConfigs } = res.body
    expect(sportConfigs).toHaveLength(1)
    expect(sportConfigs[0].sport).toBe('nhl')
    expect(sportConfigs.find((c: any) => c.sport === 'nba')).toBeUndefined()
  })

  it('returns display_layout per league, defaulting absent values to stacked', async () => {
    const leaguesData = [
      { enabled: true, priority: 1, display_layout: 'side_by_side', league: { code: 'nhl', is_active: true } },
      { enabled: true, priority: 2, display_layout: null, league: { code: 'wnba', is_active: true } },
    ]

    const orderMock = jest.fn().mockResolvedValue({ data: leaguesData, error: null })
    const leaguesEqMock = jest.fn().mockReturnValue({ order: orderMock })
    const leaguesSelectMock = jest.fn().mockReturnValue({ eq: leaguesEqMock })

    const favsEqMock = jest.fn().mockResolvedValue({ data: [], error: null })
    const favsSelectMock = jest.fn().mockReturnValue({ eq: favsEqMock })

    const overrideLimitMock = jest.fn().mockReturnValue({
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })
    const overrideOrderMock = jest.fn().mockReturnValue({ limit: overrideLimitMock })
    const overrideGtMock = jest.fn().mockReturnValue({ order: overrideOrderMock })
    const overrideEqMock = jest.fn().mockReturnValue({ gt: overrideGtMock })
    const overrideSelectMock = jest.fn().mockReturnValue({ eq: overrideEqMock })

    const deviceMaybeSingleMock = jest.fn().mockResolvedValue({
      data: { id: 'device-uuid' },
      error: null,
    })
    const deviceEqMock = jest.fn().mockReturnValue({ maybeSingle: deviceMaybeSingleMock })
    const deviceSelectMock = jest.fn().mockReturnValue({ eq: deviceEqMock })

    fromMock.mockImplementation((table: string) => {
      if (table === 'devices') return { select: deviceSelectMock }
      if (table === 'device_leagues') return { select: leaguesSelectMock }
      if (table === 'device_favorite_teams') return { select: favsSelectMock }
      if (table === 'game_overrides') return { select: overrideSelectMock }
      return {}
    })

    const handler = await loadHandler()
    const req = createRequest({ method: 'GET' })
    const res = createResponse()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    const { sportConfigs } = res.body
    expect(sportConfigs).toHaveLength(2)
    expect(sportConfigs.find((c: any) => c.sport === 'nhl').display_layout).toBe('side_by_side')
    expect(sportConfigs.find((c: any) => c.sport === 'wnba').display_layout).toBe('stacked')
  })
})

describe('GET /api/device/[id]/sports – display_layout contract integrity', () => {
  function buildGetMocks(leaguesData: any[]) {
    const orderMock = jest.fn().mockResolvedValue({ data: leaguesData, error: null })
    const leaguesEqMock = jest.fn().mockReturnValue({ order: orderMock })
    const leaguesSelectMock = jest.fn().mockReturnValue({ eq: leaguesEqMock })

    const favsEqMock = jest.fn().mockResolvedValue({ data: [], error: null })
    const favsSelectMock = jest.fn().mockReturnValue({ eq: favsEqMock })

    const overrideLimitMock = jest.fn().mockReturnValue({
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })
    const overrideOrderMock = jest.fn().mockReturnValue({ limit: overrideLimitMock })
    const overrideGtMock = jest.fn().mockReturnValue({ order: overrideOrderMock })
    const overrideEqMock = jest.fn().mockReturnValue({ gt: overrideGtMock })
    const overrideSelectMock = jest.fn().mockReturnValue({ eq: overrideEqMock })

    const deviceMaybeSingleMock = jest.fn().mockResolvedValue({
      data: { id: 'device-uuid' },
      error: null,
    })
    const deviceEqMock = jest.fn().mockReturnValue({ maybeSingle: deviceMaybeSingleMock })
    const deviceSelectMock = jest.fn().mockReturnValue({ eq: deviceEqMock })

    fromMock.mockImplementation((table: string) => {
      if (table === 'devices') return { select: deviceSelectMock }
      if (table === 'device_leagues') return { select: leaguesSelectMock }
      if (table === 'device_favorite_teams') return { select: favsSelectMock }
      if (table === 'game_overrides') return { select: overrideSelectMock }
      return {}
    })
  }

  it('collapses big-logos from DB to stacked (out-of-range value guard)', async () => {
    buildGetMocks([
      { enabled: true, priority: 1, display_layout: 'big-logos', league: { code: 'nhl', is_active: true } },
    ])

    const handler = await loadHandler()
    const req = createRequest({ method: 'GET' })
    const res = createResponse()
    await handler(req, res)

    expect(res.statusCode).toBe(200)
    const { sportConfigs } = res.body
    expect(sportConfigs).toHaveLength(1)
    expect(sportConfigs[0].display_layout).toBe('stacked')
  })

  it('collapses arbitrary invalid display_layout from DB to stacked', async () => {
    buildGetMocks([
      { enabled: true, priority: 1, display_layout: 'wide', league: { code: 'nhl', is_active: true } },
      { enabled: true, priority: 2, display_layout: '', league: { code: 'wnba', is_active: true } },
    ])

    const handler = await loadHandler()
    const req = createRequest({ method: 'GET' })
    const res = createResponse()
    await handler(req, res)

    expect(res.statusCode).toBe(200)
    const { sportConfigs } = res.body
    expect(sportConfigs).toHaveLength(2)
    for (const config of sportConfigs) {
      expect(config.display_layout).toBe('stacked')
    }
  })

  it('per-league independence: NHL side_by_side and WNBA stacked returned independently', async () => {
    buildGetMocks([
      { enabled: true, priority: 1, display_layout: 'side_by_side', league: { code: 'nhl', is_active: true } },
      { enabled: true, priority: 2, display_layout: 'stacked', league: { code: 'wnba', is_active: true } },
    ])

    const handler = await loadHandler()
    const req = createRequest({ method: 'GET' })
    const res = createResponse()
    await handler(req, res)

    expect(res.statusCode).toBe(200)
    const { sportConfigs } = res.body
    expect(sportConfigs).toHaveLength(2)
    const nhl = sportConfigs.find((c: any) => c.sport === 'nhl')
    const wnba = sportConfigs.find((c: any) => c.sport === 'wnba')
    expect(nhl.display_layout).toBe('side_by_side')
    expect(wnba.display_layout).toBe('stacked')
  })
})

describe('PUT /api/device/[id]/sports – display_layout persistence', () => {
  function buildPutMocks() {
    const leagueLookupData = [
      { id: 'league-nhl-uuid', code: 'nhl' },
      { id: 'league-wnba-uuid', code: 'wnba' },
    ]
    const leaguesSelectMock = jest.fn().mockResolvedValue({ data: leagueLookupData, error: null })
    const rpcMock = jest.fn().mockResolvedValue({ error: null })
    const updateEqLeagueMock = jest.fn().mockResolvedValue({ error: null })
    const updateEqDeviceMock = jest.fn().mockReturnValue({ eq: updateEqLeagueMock })
    const updateMock = jest.fn().mockReturnValue({ eq: updateEqDeviceMock })
    const deviceMaybeSingleMock = jest.fn().mockResolvedValue({
      data: { id: 'device-uuid' },
      error: null,
    })
    const deviceEqMock = jest.fn().mockReturnValue({ maybeSingle: deviceMaybeSingleMock })
    const deviceSelectMock = jest.fn().mockReturnValue({ eq: deviceEqMock })

    fromMock.mockImplementation((table: string) => {
      if (table === 'devices') return { select: deviceSelectMock }
      if (table === 'leagues') return { select: leaguesSelectMock }
      if (table === 'device_leagues') return { update: updateMock }
      return {}
    })
    createClientMock.mockImplementation(
      () => ({ auth: { getUser: getUserMock }, from: fromMock, rpc: rpcMock }) as any
    )
    return { updateMock, updateEqDeviceMock, updateEqLeagueMock, rpcMock }
  }

  it('persists display_layout per league after save_device_teams RPC', async () => {
    const { updateMock } = buildPutMocks()

    const handler = await loadHandler()
    const req = createRequest({
      method: 'PUT',
      body: {
        sportConfigs: [
          { sport: 'nhl', enabled: true, priority: 1, display_layout: 'side_by_side', favorite_teams: [] },
          { sport: 'wnba', enabled: true, priority: 2, display_layout: 'stacked', favorite_teams: [] },
        ],
      },
    })
    const res = createResponse()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(updateMock).toHaveBeenCalledTimes(2)
    expect(updateMock.mock.calls[0][0].display_layout).toBe('side_by_side')
    expect(updateMock.mock.calls[1][0].display_layout).toBe('stacked')
  })

  it('sanitizes big-logos input to stacked before persisting (contract guard)', async () => {
    const { updateMock } = buildPutMocks()

    const handler = await loadHandler()
    const req = createRequest({
      method: 'PUT',
      body: {
        sportConfigs: [
          { sport: 'nhl', enabled: true, priority: 1, display_layout: 'big-logos', favorite_teams: [] },
          { sport: 'wnba', enabled: true, priority: 2, display_layout: 'invalid', favorite_teams: [] },
        ],
      },
    })
    const res = createResponse()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(updateMock).toHaveBeenCalledTimes(2)
    expect(updateMock.mock.calls[0][0].display_layout).toBe('stacked')
    expect(updateMock.mock.calls[1][0].display_layout).toBe('stacked')
  })

  it('per-league independence: each UPDATE targets correct league_id', async () => {
    const { updateMock, updateEqDeviceMock, updateEqLeagueMock } = buildPutMocks()

    const handler = await loadHandler()
    const req = createRequest({
      method: 'PUT',
      body: {
        sportConfigs: [
          { sport: 'nhl', enabled: true, priority: 1, display_layout: 'side_by_side', favorite_teams: [] },
          { sport: 'wnba', enabled: true, priority: 2, display_layout: 'stacked', favorite_teams: [] },
        ],
      },
    })
    const res = createResponse()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(updateMock).toHaveBeenCalledTimes(2)

    // Each league's update must target the correct league_id — not a single device-wide value
    expect(updateEqLeagueMock.mock.calls[0]).toEqual(['league_id', 'league-nhl-uuid'])
    expect(updateEqLeagueMock.mock.calls[1]).toEqual(['league_id', 'league-wnba-uuid'])

    // Both updates must also scope to the correct device_id
    expect(updateEqDeviceMock.mock.calls[0]).toEqual(['device_id', 'device-uuid'])
    expect(updateEqDeviceMock.mock.calls[1]).toEqual(['device_id', 'device-uuid'])

    // And the layout values must be correct per league
    expect(updateMock.mock.calls[0][0]).toEqual({ display_layout: 'side_by_side' })
    expect(updateMock.mock.calls[1][0]).toEqual({ display_layout: 'stacked' })
  })
})
