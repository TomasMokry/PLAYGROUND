import { describe, expect, it } from 'vitest'
import { emptyProgress } from '../../lib/storage'
import { applyRound } from './progress'

describe('applyRound', () => {
  it('adds points, merges stars and detects a new best streak', () => {
    const before = { ...emptyProgress(), stars: { 6: 2 as const }, bestStreak: 4, totalPoints: 100 }
    const { progress, newBestStreak, newTimeAttackBest } = applyRound(before, {
      points: 120,
      bestStreak: 7,
      earnedStars: new Map([[6, 3], [7, 1]] as const),
    })
    expect(progress).toEqual({ stars: { 6: 3, 7: 1 }, bestStreak: 7, timeAttackBest: 0, totalPoints: 220, bestScore: 0 })
    expect(newBestStreak).toBe(true)
    expect(newTimeAttackBest).toBe(false)
  })

  it('keeps records that were not beaten', () => {
    const before = { ...emptyProgress(), bestStreak: 10, timeAttackBest: 25 }
    const { progress, newBestStreak, newTimeAttackBest } = applyRound(before, { points: 0, bestStreak: 3, timeAttackScore: 20 })
    expect(progress.bestStreak).toBe(10)
    expect(progress.timeAttackBest).toBe(25)
    expect(newBestStreak).toBe(false)
    expect(newTimeAttackBest).toBe(false)
  })

  it('reports a new time-attack record', () => {
    const { progress, newTimeAttackBest } = applyRound(emptyProgress(), { points: 50, bestStreak: 5, timeAttackScore: 12 })
    expect(progress.timeAttackBest).toBe(12)
    expect(newTimeAttackBest).toBe(true)
  })
})
