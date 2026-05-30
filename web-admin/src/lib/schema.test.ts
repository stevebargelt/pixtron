import { makeValidator } from './schema'

describe('configuration schema', () => {
  const validator = makeValidator()

  it('accepts a valid multi-sport config', () => {
    const validConfig = {
      timezone: 'America/Los_Angeles',
      matrix: { width: 64, height: 32 },
      refresh: { pregame_sec: 30, ingame_sec: 5, final_sec: 60 },
      render: { logo_variant: 'mini' },
      sports: [
        {
          sport: 'wnba',
          enabled: true,
          priority: 1,
          display_layout: 'stacked',
          favorites: [{ name: 'Seattle Storm', id: '18', abbr: 'SEA' }],
        },
      ],
    }

    expect(validator(validConfig)).toBe(true)
    expect(validator.errors).toBeNull()
  })

  it('rejects configs without sports entries', () => {
    const invalidConfig = {
      timezone: 'America/Chicago',
      matrix: { width: 64, height: 32 },
      refresh: { pregame_sec: 30, ingame_sec: 5, final_sec: 60 },
      render: { logo_variant: 'mini' },
      sports: [],
    }

    expect(validator(invalidConfig)).toBe(false)
    expect(validator.errors?.[0]?.message).toBeDefined()
  })

  it('accepts side_by_side as a valid display_layout', () => {
    const validConfig = {
      sports: [
        {
          sport: 'nhl',
          enabled: true,
          priority: 1,
          display_layout: 'side_by_side',
        },
      ],
    }

    expect(validator(validConfig)).toBe(true)
    expect(validator.errors).toBeNull()
  })

  it('rejects invalid display_layout values', () => {
    const invalidConfig = {
      sports: [
        {
          sport: 'nhl',
          enabled: true,
          priority: 1,
          display_layout: 'big-logos',
        },
      ],
    }

    expect(validator(invalidConfig)).toBe(false)
    expect(validator.errors).not.toBeNull()
  })

  it('rejects all known drift values — only stacked and side_by_side are valid', () => {
    const driftValues = ['big-logos', 'wide', 'narrow', 'banner', 'mini', 'full', '']
    for (const bad of driftValues) {
      const config = { sports: [{ sport: 'nhl', enabled: true, priority: 1, display_layout: bad }] }
      expect(validator(config)).toBe(false)
    }
  })

  it('accepts multi-sport config with both stacked and side_by_side layouts', () => {
    const config = {
      sports: [
        { sport: 'nhl', enabled: true, priority: 1, display_layout: 'side_by_side' },
        { sport: 'wnba', enabled: true, priority: 2, display_layout: 'stacked' },
      ],
    }
    expect(validator(config)).toBe(true)
    expect(validator.errors).toBeNull()
  })
})
