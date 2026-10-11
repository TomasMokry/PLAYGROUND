import type { GameProgress, Stars } from '../../lib/storage'
import { mergeStars, pick, type Rng } from '../shared/rules'

/** Tic tac toe (piškvorky 3 × 3) rules and the computer player. */

export type Mark = 'X' | 'O'
/** Cells 0–8, row by row. */
export type Board = (Mark | null)[]

export const emptyBoard = (): Board => Array<Mark | null>(9).fill(null)

export const other = (mark: Mark): Mark => (mark === 'X' ? 'O' : 'X')

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const

export interface Win {
  mark: Mark
  line: readonly number[]
}

export function winnerOf(board: Board): Win | null {
  for (const line of LINES) {
    const [a, b, c] = line
    const mark = board[a]
    if (mark && mark === board[b] && mark === board[c]) return { mark, line }
  }
  return null
}

export const emptyCells = (board: Board): number[] => board.flatMap((cell, i) => (cell ? [] : [i]))

export type Outcome = { kind: 'win'; win: Win } | { kind: 'draw' } | null

/** The game's result, or null while it goes on. */
export function outcomeOf(board: Board): Outcome {
  const win = winnerOf(board)
  if (win) return { kind: 'win', win }
  return emptyCells(board).length === 0 ? { kind: 'draw' } : null
}

export function place(board: Board, index: number, mark: Mark): Board {
  if (board[index] || outcomeOf(board)) return board
  const next = [...board]
  next[index] = mark
  return next
}

export type Level = 1 | 2 | 3

/** A cell that wins the game right away for `mark`, if there is one. */
function winningCell(board: Board, mark: Mark): number | undefined {
  return emptyCells(board).find((i) => winnerOf(place(board, i, mark))?.mark === mark)
}

/** Score of a position for `mark` with `toMove` to play: +, 0 or − (faster wins score higher). */
function minimax(board: Board, mark: Mark, toMove: Mark): number {
  const win = winnerOf(board)
  const free = emptyCells(board)
  if (win) return (win.mark === mark ? 1 : -1) * (free.length + 1)
  if (free.length === 0) return 0
  const scores = free.map((i) => minimax(place(board, i, toMove), mark, other(toMove)))
  return toMove === mark ? Math.max(...scores) : Math.min(...scores)
}

/**
 * The computer's move.
 * 1 (Lehká): takes a win it sees, otherwise plays at random.
 * 2 (Střední): also blocks your win and likes the middle.
 * 3 (Těžká): plays perfectly; you can only draw.
 */
export function computerMove(board: Board, mark: Mark, level: Level, rng: Rng = Math.random): number {
  const free = emptyCells(board)
  const win = winningCell(board, mark)
  if (win !== undefined) return win
  if (level === 1) return pick(free, rng)
  if (level === 2) {
    const block = winningCell(board, other(mark))
    if (block !== undefined) return block
    if (board[4] === null) return 4
    return pick(free, rng)
  }
  const scored = free.map((i) => ({ i, score: minimax(place(board, i, mark), mark, other(mark)) }))
  const best = Math.max(...scored.map((s) => s.score))
  return pick(scored.filter((s) => s.score === best).map((s) => s.i), rng)
}

/** Stars for a game against the computer: beat Lehká = ★, beat Střední = ★★, don't lose to Těžká = ★★★. */
export function starsFor(level: Level, result: 'win' | 'draw' | 'loss'): Stars {
  if (level === 3) return result === 'loss' ? 0 : 3
  return result === 'win' ? level : 0
}

/** Folds a game against the computer into the saved progress (best stars kept). */
export function recordGame(progress: GameProgress, stars: Stars): GameProgress {
  return { ...progress, stars: mergeStars(progress.stars, new Map([[0, stars]])) }
}
