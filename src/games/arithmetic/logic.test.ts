import { describe, expect, it } from 'vitest'
import { parseGroups, randomQuestion, randomQuestions, starsByGroup, timeAttackStars, type Question } from './logic'
import { seeded } from '../shared/seeded'
import { LEVELS, OPERATIONS } from './operations'

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

describe('stars', () => {
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
