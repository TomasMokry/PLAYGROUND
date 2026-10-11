import { describe, expect, it } from 'vitest'
import { emptyReward } from '../../lib/storage'
import { BANK_CAP_MS, earnReward, exerciseKey, isPerfect, isPerfectTimeAttack, localDay, minutesOf, minutesWord, REWARD_MS, spendPlayTime } from './reward'

const DAY = '2026-10-11'

describe('perfect rounds', () => {
  it('needs every answer right on the first try', () => {
    expect(isPerfect(15, 15)).toBe(true)
    expect(isPerfect(14, 15)).toBe(false)
    expect(isPerfect(0, 0)).toBe(false)
  })

  it('needs no mistake and enough answers in a time attack', () => {
    expect(isPerfectTimeAttack(20, 0)).toBe(true)
    expect(isPerfectTimeAttack(19, 0)).toBe(false)
    expect(isPerfectTimeAttack(30, 1)).toBe(false)
  })
})

describe('exerciseKey and localDay', () => {
  it('sorts the groups so the same selection gives the same key', () => {
    expect(exerciseKey('multiplication', 'practice', [7, 3, 6])).toBe('multiplication:practice:3,6,7')
    expect(exerciseKey('colors', 'write')).toBe('colors:write')
  })

  it('formats the local day', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('earnReward', () => {
  it('adds 1 minute for a new exercise', () => {
    const { reward, outcome } = earnReward(emptyReward(), 'a', DAY)
    expect(outcome).toEqual({ kind: 'earned', ms: REWARD_MS, bankMs: REWARD_MS })
    expect(reward.claimed).toEqual({ a: DAY })
  })

  it('pays each exercise once a day', () => {
    const first = earnReward(emptyReward(), 'a', DAY).reward
    expect(earnReward(first, 'a', DAY).outcome).toEqual({ kind: 'already' })
    expect(earnReward(first, 'b', DAY).outcome.kind).toBe('earned')
    expect(earnReward(first, 'a', '2026-10-12').outcome.kind).toBe('earned')
  })

  it('drops claims from other days', () => {
    const old = { bankMs: 0, claimed: { a: '2026-10-10', b: DAY } }
    expect(earnReward(old, 'c', DAY).reward.claimed).toEqual({ b: DAY, c: DAY })
  })

  it('fills the bank up to the cap and then stops', () => {
    const room = REWARD_MS / 2
    const almost = { bankMs: BANK_CAP_MS - room, claimed: {} }
    const { reward, outcome } = earnReward(almost, 'a', DAY)
    expect(outcome).toEqual({ kind: 'earned', ms: room, bankMs: BANK_CAP_MS })
    expect(earnReward(reward, 'b', DAY).outcome).toEqual({ kind: 'full' })
  })
})

describe('spendPlayTime', () => {
  it('never goes below zero', () => {
    expect(spendPlayTime({ bankMs: 3000, claimed: {} }, 1000).bankMs).toBe(2000)
    expect(spendPlayTime({ bankMs: 3000, claimed: {} }, 9000).bankMs).toBe(0)
  })

  it('rounds minutes up', () => {
    expect(minutesOf(30_000)).toBe(1)
    expect(minutesOf(REWARD_MS)).toBe(1)
  })

  it('picks the Czech plural of minutes', () => {
    expect([1, 2, 4, 5, 30].map(minutesWord)).toEqual(['minutu', 'minuty', 'minuty', 'minut', 'minut'])
  })
})
