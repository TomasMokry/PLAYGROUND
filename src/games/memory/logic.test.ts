import { describe, expect, it } from 'vitest'
import { emptyProgress } from '../../lib/storage'
import { seeded } from '../shared/seeded'
import { type Card, deal, flip, hide, isDone, isMismatch, newGame, recordGame, SIZES, starsForMoves, THEMES } from './logic'

/** A fixed deck: A A B B. */
const deck: Card[] = ['A', 'B', 'A', 'B'].map((face, id) => ({ id, face }))

describe('deal', () => {
  it('deals every face exactly twice', () => {
    for (const theme of THEMES) {
      for (const size of SIZES) {
        const cards = deal(theme, size.pairs, seeded(7))
        expect(cards).toHaveLength(size.pairs * 2)
        const counts = new Map<string, number>()
        for (const c of cards) counts.set(c.face, (counts.get(c.face) ?? 0) + 1)
        expect([...counts.values()].every((n) => n === 2)).toBe(true)
        expect(counts.size).toBe(size.pairs)
      }
    }
  })

  it('every theme has enough faces for the biggest board', () => {
    const biggest = Math.max(...SIZES.map((s) => s.pairs))
    for (const theme of THEMES) expect(new Set(theme.faces).size).toBeGreaterThanOrEqual(biggest)
  })
})

describe('flip and hide', () => {
  it('keeps a matching pair', () => {
    const state = flip(flip(newGame(deck), 0), 2)
    expect(state.matched).toEqual([0, 2])
    expect(state.open).toEqual([])
    expect(state.moves).toBe(1)
    expect(state.pairs).toEqual([1, 0])
  })

  it('shows a miss until it is hidden, and ignores flips meanwhile', () => {
    let state = flip(flip(newGame(deck), 0), 1)
    expect(isMismatch(state)).toBe(true)
    expect(flip(state, 2)).toBe(state)
    state = hide(state)
    expect(state.open).toEqual([])
    expect(state.moves).toBe(1)
  })

  it('ignores the same card twice and paired cards', () => {
    const one = flip(newGame(deck), 0)
    expect(flip(one, 0)).toBe(one)
    const paired = flip(one, 2)
    expect(flip(paired, 0)).toBe(paired)
  })

  it('passes the turn after a miss with two players, but not after a match', () => {
    let state = newGame(deck, true)
    state = flip(flip(state, 0), 2)
    expect(state.player).toBe(0)
    state = hide(flip(flip(state, 1), 3))
    expect(state.player).toBe(0)
    expect(isDone(state)).toBe(true)
    expect(state.pairs).toEqual([2, 0])

    let miss = hide(flip(flip(newGame(deck, true), 0), 1))
    expect(miss.player).toBe(1)
    miss = flip(flip(miss, 0), 2)
    expect(miss.pairs).toEqual([0, 1])
  })

  it('keeps the same player in a one-player game', () => {
    expect(hide(flip(flip(newGame(deck), 0), 1)).player).toBe(0)
  })
})

describe('stars and progress', () => {
  it('gives stars by moves per pair', () => {
    expect(starsForMoves(10, 6)).toBe(3)
    expect(starsForMoves(15, 6)).toBe(2)
    expect(starsForMoves(21, 6)).toBe(1)
    expect(starsForMoves(22, 6)).toBe(0)
  })

  it('keeps the best stars per size', () => {
    const progress = recordGame(recordGame(recordGame(emptyProgress(), 1, 2), 1, 1), 3, 3)
    expect(progress.stars).toEqual({ 1: 2, 3: 3 })
  })
})
