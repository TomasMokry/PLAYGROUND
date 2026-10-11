import { afterEach, describe, expect, it, vi } from 'vitest'
import { GAME_IDS, loadData, totalStars } from './storage'

function stubStorage(saved: unknown) {
  const store = new Map([['mathkids:v1', JSON.stringify(saved)]])
  vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: () => {} })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadData', () => {
  it('fills in the English games for a save from before they existed', () => {
    stubStorage({
      version: 1,
      activeProfileId: 'a',
      profiles: [
        {
          id: 'a',
          name: 'Ema',
          avatar: '🦊',
          muted: false,
          multiplication: { stars: { 6: 3 }, bestStreak: 12, timeAttackBest: 25, totalPoints: 900 },
        },
      ],
    })
    const [profile] = loadData().profiles
    for (const id of GAME_IDS) expect(profile[id]).toBeDefined()
    expect(profile.multiplication.stars[6]).toBe(3)
    expect(profile.multiplication.bestScore).toBe(0)
    expect(profile.colors).toEqual({ stars: {}, bestStreak: 0, timeAttackBest: 0, totalPoints: 0, bestScore: 0 })
    expect(profile.reward).toEqual({ bankMs: 0, claimed: {} })
    expect(totalStars(profile)).toBe(3)
    expect(totalStars(profile, ['colors', 'numbers'])).toBe(0)
  })
})
