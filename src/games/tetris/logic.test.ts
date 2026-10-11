import { describe, expect, it } from 'vitest'
import { emptyProgress } from '../../lib/storage'
import {
  type Board,
  clearLines,
  collides,
  COLS,
  dropInterval,
  emptyBoard,
  type GameState,
  levelFor,
  lineScore,
  newGame,
  PIECE_TYPES,
  pieceCells,
  recordGame,
  reduce,
  ROWS,
  shapeCells,
  spawn,
  starsForLines,
} from './logic'

const fullRow = (): Board[number] => Array(COLS).fill('O')

/** A game with a chosen current piece, so tests don't depend on the shuffle. */
function gameWith(type: GameState['piece']['type'], board: Board = emptyBoard()): GameState {
  return { ...newGame(1), board, piece: spawn(type) }
}

describe('shapes', () => {
  it('turning four times comes back to the start', () => {
    for (const type of PIECE_TYPES) {
      expect(shapeCells(type, 4)).toEqual(shapeCells(type, 0))
    }
  })

  it('turns the I piece upright', () => {
    expect(shapeCells('I', 1)).toEqual([[2, 0], [2, 1], [2, 2], [2, 3]])
  })

  it('spawns every piece inside the board, in the top row', () => {
    for (const type of PIECE_TYPES) {
      const cells = pieceCells(spawn(type))
      expect(Math.min(...cells.map(([, y]) => y))).toBe(0)
      expect(collides(emptyBoard(), spawn(type))).toBe(false)
    }
  })
})

describe('collides', () => {
  it('stops at the walls and the floor', () => {
    const piece = spawn('O')
    expect(collides(emptyBoard(), { ...piece, x: -1 })).toBe(true)
    expect(collides(emptyBoard(), { ...piece, x: COLS - 1 })).toBe(true)
    expect(collides(emptyBoard(), { ...piece, y: ROWS - 1 })).toBe(true)
    expect(collides(emptyBoard(), { ...piece, y: ROWS - 2 })).toBe(false)
  })

  it('allows cells above the top of the board', () => {
    expect(collides(emptyBoard(), { ...spawn('O'), y: -1 })).toBe(false)
  })
})

describe('clearLines', () => {
  it('removes full rows and drops the rest down', () => {
    const board = emptyBoard()
    board[ROWS - 1] = fullRow()
    board[ROWS - 2][0] = 'T'
    board[ROWS - 3] = fullRow()
    const result = clearLines(board)
    expect(result.cleared).toBe(2)
    expect(result.board).toHaveLength(ROWS)
    expect(result.board[ROWS - 1][0]).toBe('T')
    expect(result.board.slice(0, ROWS - 1).flat().every((c) => c === null)).toBe(true)
  })
})

describe('scoring and levels', () => {
  it('pays more for more lines at once and at higher levels', () => {
    expect(lineScore(0, 1)).toBe(0)
    expect(lineScore(1, 1)).toBe(100)
    expect(lineScore(4, 1)).toBe(800)
    expect(lineScore(2, 3)).toBe(900)
  })

  it('goes up a level every 10 lines and gets faster', () => {
    expect(levelFor(0)).toBe(1)
    expect(levelFor(9)).toBe(1)
    expect(levelFor(10)).toBe(2)
    expect(dropInterval(2)).toBeLessThan(dropInterval(1))
    expect(dropInterval(50)).toBe(120)
  })

  it('gives stars for cleared lines', () => {
    expect(starsForLines(4)).toBe(0)
    expect(starsForLines(5)).toBe(1)
    expect(starsForLines(20)).toBe(2)
    expect(starsForLines(40)).toBe(3)
  })
})

describe('reduce', () => {
  it('moves sideways until the wall', () => {
    let state = gameWith('O')
    for (let i = 0; i < 20; i++) state = reduce(state, 'left')
    expect(state.piece.x).toBe(0)
  })

  it('kicks a piece off the wall when it turns', () => {
    let state = reduce(gameWith('I'), 'rotate')
    for (let i = 0; i < 20; i++) state = reduce(state, 'right')
    // Upright against the right wall; turning back flat must push it left.
    state = reduce(state, 'rotate')
    expect(state.piece.rotation).toBe(2)
    expect(collides(state.board, state.piece)).toBe(false)
  })

  it('hard drop lands the piece, scores 2 per row and brings the next one', () => {
    const start = gameWith('O')
    const next = start.queue[0]
    const state = reduce(start, 'hardDrop')
    expect(state.board[ROWS - 1].filter(Boolean)).toHaveLength(2)
    expect(state.board[ROWS - 2].filter(Boolean)).toHaveLength(2)
    expect(state.score).toBe((ROWS - 2) * 2)
    expect(state.locks).toBe(1)
    expect(state.piece.type).toBe(next)
  })

  it('clears a line and scores it', () => {
    const board = emptyBoard()
    // Bottom row full except the four middle cells where a flat I lands.
    board[ROWS - 1] = fullRow().map((c, x) => (x >= 3 && x <= 6 ? null : c))
    const state = reduce(gameWith('I', board), 'hardDrop')
    expect(state.lastCleared).toBe(1)
    expect(state.lines).toBe(1)
    expect(state.score).toBe((ROWS - 1) * 2 + 100)
    expect(state.board.flat().every((c) => c === null)).toBe(true)
  })

  it('a tick moves down, and locks a piece that is already resting', () => {
    let state = gameWith('O')
    state = reduce(state, 'tick')
    expect(state.piece.y).toBe(1)
    expect(state.score).toBe(0)
    state = { ...state, piece: { ...state.piece, y: ROWS - 2 } }
    expect(reduce(state, 'tick').locks).toBe(1)
  })

  it('ends the game when the stack reaches the top', () => {
    const board = emptyBoard().map((_, y) => (y === 0 ? Array(COLS).fill(null) : fullRow().map((c, x) => (x === 0 ? null : c))))
    const state = reduce(gameWith('O', board), 'hardDrop')
    expect(state.over).toBe(true)
    expect(reduce(state, 'left')).toBe(state)
  })

  it('deals all seven pieces in every bag', () => {
    let state = newGame(42)
    const seen = [state.piece.type]
    for (let i = 0; i < 6; i++) {
      state = { ...state, board: emptyBoard() }
      state = reduce(state, 'hardDrop')
      seen.push(state.piece.type)
    }
    expect(new Set(seen).size).toBe(7)
  })
})

describe('recordGame', () => {
  it('keeps the best score and stars', () => {
    const first = recordGame(emptyProgress(), { score: 1200, lines: 22 })
    expect(first.newBestScore).toBe(true)
    expect(first.progress.bestScore).toBe(1200)
    expect(first.progress.stars[0]).toBe(2)
    const second = recordGame(first.progress, { score: 300, lines: 3 })
    expect(second.newBestScore).toBe(false)
    expect(second.progress.bestScore).toBe(1200)
    expect(second.progress.stars[0]).toBe(2)
    expect(second.progress.totalPoints).toBe(0)
  })
})
