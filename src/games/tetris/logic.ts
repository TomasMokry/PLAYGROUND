import type { GameProgress, Stars } from '../../lib/storage'
import { mergeStars, shuffle } from '../shared/rules'
import { seeded } from '../shared/seeded'

/** Tetris rules: the board, pieces, moves, line clears, scoring and levels. */

export const COLS = 10
export const ROWS = 20

export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const
export type PieceType = (typeof PIECE_TYPES)[number]

/** A board cell: empty, or the type of the piece that left a block there. */
export type Cell = PieceType | null
/** Rows from top to bottom. */
export type Board = Cell[][]

export interface Piece {
  type: PieceType
  /** Quarter turns clockwise, 0–3. */
  rotation: number
  /** Top-left corner of the piece's box on the board (y may be negative above the top). */
  x: number
  y: number
}

type Point = readonly [x: number, y: number]

/** Each piece in its spawn rotation, as cells inside a size × size box. */
const SHAPES: Record<PieceType, { size: number; cells: Point[] }> = {
  I: { size: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  O: { size: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  T: { size: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { size: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { size: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  J: { size: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  L: { size: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
}

/** Cells of a piece type inside its own box, turned clockwise `rotation` times. */
export function shapeCells(type: PieceType, rotation = 0): Point[] {
  const { size, cells } = SHAPES[type]
  let result = cells
  for (let r = 0; r < ((rotation % 4) + 4) % 4; r++) {
    result = result.map(([x, y]) => [size - 1 - y, x] as const)
  }
  return result
}

/** Board coordinates of a piece's cells. */
export function pieceCells(piece: Piece): Point[] {
  return shapeCells(piece.type, piece.rotation).map(([x, y]) => [piece.x + x, piece.y + y] as const)
}

export const emptyBoard = (): Board => Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null))

/** A new piece at the top middle of the board. */
export function spawn(type: PieceType): Piece {
  // The I piece sits in the second row of its box; lift it so it starts in the top row.
  return { type, rotation: 0, x: Math.floor((COLS - SHAPES[type].size) / 2), y: type === 'I' ? -1 : 0 }
}

/** Whether the piece pokes out of the walls or floor, or overlaps a block. Above the top is fine. */
export function collides(board: Board, piece: Piece): boolean {
  return pieceCells(piece).some(([x, y]) => x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y][x] !== null))
}

/** Removes full rows and adds empty rows on top. */
export function clearLines(board: Board): { board: Board; cleared: number } {
  const kept = board.filter((row) => row.some((cell) => cell === null))
  const cleared = ROWS - kept.length
  return { board: [...emptyBoard().slice(0, cleared), ...kept], cleared }
}

const LINE_POINTS = [0, 100, 300, 500, 800]

/** Points for clearing lines at once; more lines at once and higher levels pay more. */
export const lineScore = (cleared: number, level: number): number => LINE_POINTS[cleared] * level

export const LINES_PER_LEVEL = 10

/** Levels start at 1 and go up every 10 lines. */
export const levelFor = (lines: number): number => 1 + Math.floor(lines / LINES_PER_LEVEL)

/** Milliseconds between automatic drops. Starts slow for kids and speeds up per level. */
export const dropInterval = (level: number): number => Math.max(120, 900 - (level - 1) * 80)

/** Lines cleared in one game: 5 = ★, 20 = ★★, 40 = ★★★. */
export function starsForLines(lines: number): Stars {
  if (lines >= 40) return 3
  if (lines >= 20) return 2
  if (lines >= 5) return 1
  return 0
}

export interface GameState {
  board: Board
  piece: Piece
  /** Upcoming pieces; the first one is shown as "next". */
  queue: PieceType[]
  /** Seed for the next shuffled bag, so the rules stay pure and repeatable. */
  seed: number
  score: number
  lines: number
  level: number
  /** Counts locked pieces, so the screen can react to each lock. */
  locks: number
  /** Lines cleared by the most recent lock. */
  lastCleared: number
  over: boolean
}

/**
 * Takes the next piece from the queue. Pieces come in shuffled bags of all seven,
 * so no piece is missing for long.
 */
function takeNext(queue: readonly PieceType[], seed: number): { type: PieceType; queue: PieceType[]; seed: number } {
  let upcoming = [...queue]
  let nextSeed = seed
  // Keep at least one piece left over for the "next" preview.
  while (upcoming.length < 2) {
    const rng = seeded(nextSeed)
    upcoming = [...upcoming, ...shuffle(PIECE_TYPES, rng)]
    nextSeed = Math.floor(rng() * 4294967296)
  }
  const [type, ...rest] = upcoming
  return { type, queue: rest, seed: nextSeed }
}

export function newGame(seed: number = Math.floor(Math.random() * 4294967296)): GameState {
  const first = takeNext([], seed)
  return {
    board: emptyBoard(),
    piece: spawn(first.type),
    queue: first.queue,
    seed: first.seed,
    score: 0,
    lines: 0,
    level: 1,
    locks: 0,
    lastCleared: 0,
    over: false,
  }
}

/** Where the piece would land if dropped straight down (also drawn as the ghost piece). */
export function dropPosition(board: Board, piece: Piece): Piece {
  let landed = piece
  while (!collides(board, { ...landed, y: landed.y + 1 })) landed = { ...landed, y: landed.y + 1 }
  return landed
}

/** Sideways (and one up) nudges tried when a turn would hit a wall or a block. */
const KICKS: Point[] = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]]

function rotate(board: Board, piece: Piece): Piece {
  const turned = { ...piece, rotation: (piece.rotation + 1) % 4 }
  for (const [dx, dy] of KICKS) {
    const kicked = { ...turned, x: turned.x + dx, y: turned.y + dy }
    if (!collides(board, kicked)) return kicked
  }
  return piece
}

/** Merges the piece into the board, clears lines, scores and brings in the next piece. */
function lock(state: GameState, piece: Piece, dropPoints: number): GameState {
  const cells = pieceCells(piece)
  // A piece that lands sticking out above the top ends the game.
  if (cells.some(([, y]) => y < 0)) return { ...state, piece, score: state.score + dropPoints, over: true }
  const merged = state.board.map((row) => [...row])
  for (const [x, y] of cells) merged[y][x] = piece.type
  const { board, cleared } = clearLines(merged)
  const lines = state.lines + cleared
  const next = takeNext(state.queue, state.seed)
  const nextPiece = spawn(next.type)
  return {
    board,
    piece: nextPiece,
    queue: next.queue,
    seed: next.seed,
    score: state.score + dropPoints + lineScore(cleared, state.level),
    lines,
    level: levelFor(lines),
    locks: state.locks + 1,
    lastCleared: cleared,
    // No room for the next piece: game over.
    over: collides(board, nextPiece),
  }
}

export type Action = 'left' | 'right' | 'rotate' | 'softDrop' | 'hardDrop' | 'tick'

/** One step of the game. Soft drop scores 1 per row, hard drop 2 per row. */
export function reduce(state: GameState, action: Action): GameState {
  if (state.over) return state
  const { board, piece } = state
  const tryPiece = (moved: Piece) => (collides(board, moved) ? state : { ...state, piece: moved })
  switch (action) {
    case 'left':
      return tryPiece({ ...piece, x: piece.x - 1 })
    case 'right':
      return tryPiece({ ...piece, x: piece.x + 1 })
    case 'rotate': {
      const turned = rotate(board, piece)
      return turned === piece ? state : { ...state, piece: turned }
    }
    case 'softDrop':
    case 'tick': {
      const down = { ...piece, y: piece.y + 1 }
      if (collides(board, down)) return lock(state, piece, 0)
      return { ...state, piece: down, score: state.score + (action === 'softDrop' ? 1 : 0) }
    }
    case 'hardDrop': {
      const landed = dropPosition(board, piece)
      return lock(state, landed, (landed.y - piece.y) * 2)
    }
  }
}

export interface GameOutcome {
  score: number
  lines: number
}

/** Folds a finished game into the saved progress (best score and best stars). */
export function recordGame(progress: GameProgress, outcome: GameOutcome): { progress: GameProgress; newBestScore: boolean } {
  return {
    newBestScore: outcome.score > progress.bestScore,
    progress: {
      ...progress,
      stars: mergeStars(progress.stars, new Map([[0, starsForLines(outcome.lines)]])),
      bestScore: Math.max(progress.bestScore, outcome.score),
    },
  }
}
