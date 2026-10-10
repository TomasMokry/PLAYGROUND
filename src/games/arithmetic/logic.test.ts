import { describe, expect, it } from 'vitest'
import {
  mergeStars,
  parseGroups,
  pointsFor,
  randomQuestion,
  randomQuestions,
  requeue,
  starsByGroup,
  starsFor,
  streakMultiplier,
  timeAttackStars,
  type Question,
} from './logic'
import { LEVELS, OPERATIONS } from './operations'

/** Deterministic pseudo-random generator for repeatable tests. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

const multiplication = OPERATIONS.multiplication
const addition = OPERATIONS.addition

const same = (a: Question, b: Question) => a.left === b.left && a.right === b.right && a.group === b.group

describe('questions', () => {
  it('random questions use only selected groups and come from their pools', () => {
    const qs = randomQuestions(multiplication, [3, 7], 200, seeded(1))
    expect(qs).toHaveLength(200)
    for (const q of qs) {
      expect([3, 7]).toContain(q.group)
      expect(q.right).toBe(q.group)
      expect(q.left).toBeGreaterThanOrEqual(1)
      expect(q.left).toBeLessThanOrEqual(10)
      expect(q.answer).toBe(q.left * q.right)
    }
  })

  it('never repeats a question twice in a row', () => {
    const qs = randomQuestions(multiplication, [2], 100, seeded(7))
    for (let i = 1; i < qs.length; i++) expect(same(qs[i], qs[i - 1])).toBe(false)
  })

  it('does not repeat questions until the pool is used up', () => {
    const qs = randomQuestions(multiplication, [5], 10, seeded(3))
    expect(new Set(qs.map((q) => q.left)).size).toBe(10)
  })

  it('gives a small group its fair share next to a big one', () => {
    // "do 20" has 100 questions, "do 1000" thousands: they should still alternate.
    const qs = randomQuestions(addition, [LEVELS.upTo20, LEVELS.upTo1000], 20, seeded(5))
    const small = qs.filter((q) => q.group === LEVELS.upTo20).length
    expect(small).toBe(10)
  })

  it('randomQuestion differs from the previous one', () => {
    const rng = seeded(42)
    let prev = multiplication.pool(1)[0]
    for (let i = 0; i < 100; i++) {
      const q = randomQuestion(multiplication, [1, 2], prev, rng)
      expect(same(q, prev)).toBe(false)
      prev = q
    }
  })

  it('rejects an empty group selection', () => {
    expect(() => randomQuestions(multiplication, [], 5)).toThrow()
    expect(() => randomQuestion(multiplication, [])).toThrow()
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

  it('computes stars per group', () => {
    const results = [
      ...multiplication.pool(6).map((question) => ({ question, firstTry: true })),
      ...multiplication.pool(7).map((question, i) => ({ question, firstTry: i >= 3 })),
    ]
    const stars = starsByGroup(results)
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

describe('parseGroups', () => {
  it('parses, dedupes, sorts and drops invalid values', () => {
    expect(parseGroups(multiplication, '7,2,7,11,x,0')).toEqual([2, 7])
    expect(parseGroups(multiplication, null)).toEqual([])
  })

  it('only accepts the operation’s own groups', () => {
    expect(parseGroups(addition, '5,3,6,1')).toEqual([1, 3, 5])
  })
})
