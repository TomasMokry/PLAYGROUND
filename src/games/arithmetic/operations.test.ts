import { describe, expect, it } from 'vitest'
import type { Question } from './logic'
import { groupLabels, LEVELS, OPERATION_LIST, OPERATIONS } from './operations'

const { multiplication, addition, subtraction, division } = OPERATIONS
const ones = (n: number) => n % 10
const key = (q: Question) => `${q.left},${q.right}`

describe('every operation', () => {
  for (const op of OPERATION_LIST) {
    describe(op.title, () => {
      it('has a non-empty pool of distinct, correctly tagged questions for each group', () => {
        for (const { id } of op.groups) {
          const pool = op.pool(id)
          expect(pool.length).toBeGreaterThan(0)
          expect(new Set(pool.map(key)).size).toBe(pool.length)
          expect(pool.every((q) => q.group === id)).toBe(true)
        }
      })

      it('only asks for positive answers that fit the 3-digit input', () => {
        for (const { id } of op.groups) {
          for (const q of op.pool(id)) {
            expect(q.answer).toBeGreaterThanOrEqual(1)
            expect(q.answer).toBeLessThanOrEqual(999)
          }
        }
      })

      it('has an example that belongs to its group', () => {
        for (const g of op.groups) {
          if (!g.example) continue
          const [left, right] = g.example.split(` ${op.symbol} `).map(Number)
          expect(op.pool(g.id).some((q) => q.left === left && q.right === right)).toBe(true)
        }
      })
    })
  }
})

describe('multiplication and division tables', () => {
  it('multiplication: factor × table for factors 1–10', () => {
    const pool = multiplication.pool(6)
    expect(pool.map((q) => q.answer)).toEqual([6, 12, 18, 24, 30, 36, 42, 48, 54, 60])
    expect(pool.every((q) => q.right === 6 && q.answer === q.left * q.right)).toBe(true)
  })

  it('division: the table read backwards, with whole results', () => {
    const pool = division.pool(7)
    expect(pool.map((q) => q.left)).toEqual([7, 14, 21, 28, 35, 42, 49, 56, 63, 70])
    expect(pool.every((q) => q.right === 7 && q.answer * q.right === q.left)).toBe(true)
  })

  it('the Řada sequence goes in order', () => {
    expect(multiplication.sequence?.questions(3).map((q) => q.left)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(division.sequence?.questions(3).map((q) => q.answer)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})

describe('addition levels', () => {
  const pool = (level: number) => addition.pool(level)

  it('all answers are correct sums', () => {
    for (const { id } of addition.groups) expect(pool(id).every((q) => q.answer === q.left + q.right)).toBe(true)
  })

  it('do 20: the small addition table 1–10 + 1–10', () => {
    expect(pool(LEVELS.upTo20)).toHaveLength(100)
    expect(pool(LEVELS.upTo20).every((q) => q.left <= 10 && q.right <= 10)).toBe(true)
  })

  it('desítky: round tens up to 100', () => {
    expect(pool(LEVELS.tens).every((q) => ones(q.left) === 0 && ones(q.right) === 0 && q.answer <= 100)).toBe(true)
  })

  it('do 100: never carries over a ten', () => {
    expect(pool(LEVELS.upTo100).every((q) => ones(q.left) + ones(q.right) < 10 && q.answer < 100)).toBe(true)
  })

  it('přes 10: always carries over a ten', () => {
    expect(pool(LEVELS.carry).every((q) => ones(q.left) + ones(q.right) >= 10 && q.answer <= 100)).toBe(true)
  })

  it('do 1000: round tens with a three-digit number, below 1000', () => {
    expect(pool(LEVELS.upTo1000).every((q) => q.left >= 100 && ones(q.left) === 0 && ones(q.right) === 0 && q.answer < 1000)).toBe(true)
  })
})

describe('subtraction levels', () => {
  const pool = (level: number) => subtraction.pool(level)

  it('all answers are correct differences', () => {
    for (const { id } of subtraction.groups) expect(pool(id).every((q) => q.answer === q.left - q.right)).toBe(true)
  })

  it('do 20: the small addition table read backwards (results 1–10)', () => {
    const p = pool(LEVELS.upTo20)
    expect(p.every((q) => q.left <= 20 && q.right <= 10 && q.answer <= 10)).toBe(true)
    // Every x + y with x, y in 1–10 shows up as (x + y) − y.
    expect(p).toHaveLength(100)
  })

  it('desítky: round tens', () => {
    expect(pool(LEVELS.tens).every((q) => ones(q.left) === 0 && ones(q.right) === 0 && q.left <= 100)).toBe(true)
  })

  it('do 100: never borrows from the tens', () => {
    expect(pool(LEVELS.upTo100).every((q) => ones(q.right) <= ones(q.left) && q.left < 100)).toBe(true)
  })

  it('přes 10: always borrows from the tens', () => {
    expect(pool(LEVELS.carry).every((q) => ones(q.right) > ones(q.left) && q.left <= 100)).toBe(true)
  })

  it('do 1000: round tens from a three-digit number', () => {
    expect(pool(LEVELS.upTo1000).every((q) => q.left >= 100 && q.left < 1000 && ones(q.left) === 0 && ones(q.right) === 0)).toBe(true)
  })
})

describe('groupLabels', () => {
  it('lists the selected groups in the operation’s order', () => {
    expect(groupLabels(multiplication, [7, 3])).toBe('×3, ×7')
    expect(groupLabels(addition, [LEVELS.upTo100, LEVELS.upTo20])).toBe('do 20, do 100')
  })
})
