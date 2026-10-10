import { describe, expect, it } from 'vitest'
import { mergeStars, pick, pointsFor, requeue, shuffle, starsFor, streakMultiplier } from './rules'
import { seeded } from './seeded'

describe('requeue', () => {
  it('moves the first item to the end', () => {
    expect(requeue(['a', 'b', 'c'])).toEqual(['b', 'c', 'a'])
  })
  it('keeps a single item', () => {
    expect(requeue(['a'])).toEqual(['a'])
  })
})

describe('random helpers', () => {
  it('shuffle keeps every item and leaves the input alone', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    const shuffled = shuffle(items, seeded(4))
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items)
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('pick returns an item from the list', () => {
    const rng = seeded(9)
    for (let i = 0; i < 50; i++) expect(['a', 'b', 'c']).toContain(pick(['a', 'b', 'c'], rng))
  })
})

describe('scoring', () => {
  it('multiplies points by streak', () => {
    expect(streakMultiplier(1)).toBe(1)
    expect(streakMultiplier(4)).toBe(1)
    expect(streakMultiplier(5)).toBe(2)
    expect(streakMultiplier(9)).toBe(2)
    expect(streakMultiplier(10)).toBe(3)
    expect(pointsFor(3)).toBe(10)
    expect(pointsFor(5)).toBe(20)
    expect(pointsFor(12)).toBe(30)
  })

  it('awards stars by first-try accuracy', () => {
    expect(starsFor(10, 10)).toBe(3)
    expect(starsFor(9, 10)).toBe(2)
    expect(starsFor(8, 10)).toBe(2)
    expect(starsFor(7, 10)).toBe(1)
    expect(starsFor(6, 10)).toBe(1)
    expect(starsFor(5, 10)).toBe(0)
    expect(starsFor(0, 0)).toBe(0)
  })

  it('keeps the best stars when merging', () => {
    const merged = mergeStars({ 6: 3, 7: 1 }, new Map([[6, 1], [7, 2], [8, 3]] as const))
    expect(merged).toEqual({ 6: 3, 7: 2, 8: 3 })
  })
})
