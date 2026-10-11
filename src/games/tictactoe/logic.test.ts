import { describe, expect, it } from 'vitest'
import { emptyProgress } from '../../lib/storage'
import { seeded } from '../shared/seeded'
import { type Board, computerMove, emptyBoard, type Level, type Mark, other, outcomeOf, place, recordGame, starsFor, winnerOf } from './logic'

/** Board from a 9-character string: X, O or . for empty. */
const board = (s: string): Board => [...s].map((c) => (c === '.' ? null : (c as Mark)))

describe('winnerOf / outcomeOf', () => {
  it('finds rows, columns and diagonals', () => {
    expect(winnerOf(board('XXX......'))).toEqual({ mark: 'X', line: [0, 1, 2] })
    expect(winnerOf(board('.O..O..O.'))).toEqual({ mark: 'O', line: [1, 4, 7] })
    expect(winnerOf(board('..X.X.X..'))?.line).toEqual([2, 4, 6])
    expect(winnerOf(board('XOX......'))).toBeNull()
  })

  it('knows a draw and a game still going', () => {
    expect(outcomeOf(board('XOXXOOOXX'))).toEqual({ kind: 'draw' })
    expect(outcomeOf(board('XO.......'))).toBeNull()
  })
})

describe('place', () => {
  it('ignores taken cells and finished games', () => {
    const b = board('X........')
    expect(place(b, 0, 'O')).toBe(b)
    const won = board('XXX.OO...')
    expect(place(won, 6, 'O')).toBe(won)
    expect(place(b, 4, 'O')[4]).toBe('O')
  })
})

describe('computerMove', () => {
  it('always takes a win', () => {
    for (const level of [1, 2, 3] as const) {
      expect(computerMove(board('OO.XX....'), 'O', level)).toBe(2)
    }
  })

  it('blocks from Střední up', () => {
    expect(computerMove(board('XX..O....'), 'O', 2)).toBe(2)
    expect(computerMove(board('XX..O....'), 'O', 3)).toBe(2)
  })

  /** Plays every possible game of `human` against the computer and reports whether the human ever wins. */
  function humanCanWin(level: Level, computer: Mark, b: Board = emptyBoard(), toMove: Mark = 'X'): boolean {
    const outcome = outcomeOf(b)
    if (outcome) return outcome.kind === 'win' && outcome.win.mark !== computer
    if (toMove === computer) return humanCanWin(level, computer, place(b, computerMove(b, computer, level, seeded(1)), computer), other(toMove))
    return b.some((cell, i) => cell === null && humanCanWin(level, computer, place(b, i, toMove), other(toMove)))
  }

  it('Těžká never loses, whoever starts', () => {
    expect(humanCanWin(3, 'O')).toBe(false)
    expect(humanCanWin(3, 'X')).toBe(false)
  })

  it('Lehká can be beaten', () => {
    expect(humanCanWin(1, 'O')).toBe(true)
  })
})

describe('stars and progress', () => {
  it('gives more stars against stronger levels', () => {
    expect(starsFor(1, 'win')).toBe(1)
    expect(starsFor(2, 'win')).toBe(2)
    expect(starsFor(2, 'draw')).toBe(0)
    expect(starsFor(3, 'draw')).toBe(3)
    expect(starsFor(3, 'loss')).toBe(0)
  })

  it('keeps the best stars', () => {
    const second = recordGame(recordGame(emptyProgress(), 2), 1)
    expect(second.stars[0]).toBe(2)
    expect(second.totalPoints).toBe(0)
  })
})
