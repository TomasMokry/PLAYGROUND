import { describe, expect, it } from 'vitest'
import {
  makeQuestion,
  mergeStars,
  parseTables,
  pointsFor,
  randomQuestion,
  randomQuestions,
  requeue,
  sequenceQuestions,
  starsByTable,
  starsFor,
  streakMultiplier,
  timeAttackStars,
} from './logic'

/** Deterministic pseudo-random generator for repeatable tests. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

describe('questions', () => {
  it('builds the sequence 1×t … 10×t', () => {
    const qs = sequenceQuestions(6)
    expect(qs).toHaveLength(10)
    expect(qs.map((q) => q.answer)).toEqual([6, 12, 18, 24, 30, 36, 42, 48, 54, 60])
    expect(qs.every((q) => q.table === 6)).toBe(true)
  })

  it('random questions use only selected tables, factors 1–10 and correct answers', () => {
    const qs = randomQuestions([3, 7], 200, seeded(1))
    expect(qs).toHaveLength(200)
    for (const q of qs) {
      expect([3, 7]).toContain(q.table)
      expect(q.factor).toBeGreaterThanOrEqual(1)
      expect(q.factor).toBeLessThanOrEqual(10)
      expect(q.answer).toBe(q.factor * q.table)
    }
  })

  it('never repeats a question twice in a row', () => {
    const qs = randomQuestions([2], 100, seeded(7))
    for (let i = 1; i < qs.length; i++) {
      expect(qs[i].factor === qs[i - 1].factor && qs[i].table === qs[i - 1].table).toBe(false)
    }
  })

  it('does not repeat questions until the pool is used up', () => {
    const qs = randomQuestions([5], 10, seeded(3))
    expect(new Set(qs.map((q) => q.factor)).size).toBe(10)
  })

  it('randomQuestion differs from the previous one', () => {
    const rng = seeded(42)
    let prev = makeQuestion(1, 1)
    for (let i = 0; i < 100; i++) {
      const q = randomQuestion([1, 2], prev, rng)
      expect(q.factor === prev.factor && q.table === prev.table).toBe(false)
      prev = q
    }
  })

  it('rejects an empty table selection', () => {
    expect(() => randomQuestions([], 5)).toThrow()
    expect(() => randomQuestion([])).toThrow()
  })
})

describe('requeue', () => {
  it('moves the first item to the end', () => {
    expect(requeue(['a', 'b', 'c'])).toEqual(['b', 'c', 'a'])
  })
  it('keeps a single item', () => {
    expect(requeue(['a'])).toEqual(['a'])
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

  it('computes stars per table', () => {
    const results = [
      ...sequenceQuestions(6).map((question) => ({ question, firstTry: true })),
      ...sequenceQuestions(7).map((question, i) => ({ question, firstTry: i >= 3 })),
    ]
    const stars = starsByTable(results)
    expect(stars.get(6)).toBe(3)
    expect(stars.get(7)).toBe(1)
    expect(stars.has(8)).toBe(false)
  })

  it('keeps the best stars when merging', () => {
    const merged = mergeStars({ 6: 3, 7: 1 }, new Map([[6, 1], [7, 2], [8, 3]] as const))
    expect(merged).toEqual({ 6: 3, 7: 2, 8: 3 })
  })

  it('awards time-attack stars by correct count', () => {
    expect(timeAttackStars(5)).toBe(0)
    expect(timeAttackStars(10)).toBe(1)
    expect(timeAttackStars(20)).toBe(2)
    expect(timeAttackStars(35)).toBe(3)
  })
})

describe('parseTables', () => {
  it('parses, dedupes, sorts and drops invalid values', () => {
    expect(parseTables('7,2,7,11,x,0')).toEqual([2, 7])
    expect(parseTables(null)).toEqual([])
  })
})
