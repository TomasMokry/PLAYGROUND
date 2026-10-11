import type { GameProgress, Stars } from '../../lib/storage'
import { mergeStars, type Rng, shuffle } from '../shared/rules'

/**
 * Pexeso (memory) rules: turn over two cards, keep them if they match.
 * With two players a match earns another turn, a miss passes the turn on.
 */

export interface Theme {
  id: 'animals' | 'food' | 'vehicles'
  title: string
  icon: string
  faces: readonly string[]
}

export const THEMES: readonly Theme[] = [
  { id: 'animals', title: 'Zvířátka', icon: '🐶', faces: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧'] },
  { id: 'food', title: 'Jídlo', icon: '🍎', faces: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍒', '🍍', '🥝', '🥕', '🌽', '🍕', '🍔', '🍩', '🍪', '🧁', '🍦'] },
  { id: 'vehicles', title: 'Doprava', icon: '🚗', faces: ['🚗', '🚕', '🚌', '🚑', '🚒', '🚓', '🚜', '🚲', '🛴', '🚂', '✈️', '🚀', '🚁', '⛵', '🚢', '🛸'] },
]

export interface Size {
  /** Also the group under which stars are saved. */
  id: 1 | 2 | 3
  title: string
  pairs: number
}

export const SIZES: readonly Size[] = [
  { id: 1, title: 'Malé', pairs: 6 },
  { id: 2, title: 'Střední', pairs: 8 },
  { id: 3, title: 'Velké', pairs: 12 },
]

export type Player = 0 | 1

export interface Card {
  id: number
  face: string
}

export interface MemoryState {
  cards: Card[]
  /** Indexes of the face-up cards of the current turn (0–2). */
  open: number[]
  /** Indexes of cards already paired. */
  matched: number[]
  /** Pairs of cards turned over so far. */
  moves: number
  player: Player
  /** Pairs found by each player. */
  pairs: [number, number]
  twoPlayers: boolean
}

/** A shuffled deck with `pairs` pairs picked at random from the theme. */
export function deal(theme: Theme, pairs: number, rng: Rng = Math.random): Card[] {
  const faces = shuffle(theme.faces, rng).slice(0, pairs)
  return shuffle([...faces, ...faces], rng).map((face, id) => ({ id, face }))
}

export function newGame(cards: Card[], twoPlayers = false): MemoryState {
  return { cards, open: [], matched: [], moves: 0, player: 0, pairs: [0, 0], twoPlayers }
}

/** Two different cards are face up and wait to be turned back. */
export const isMismatch = (state: MemoryState): boolean => state.open.length === 2

export const isDone = (state: MemoryState): boolean => state.matched.length === state.cards.length

/** Turns a card over. Ignored for paired or open cards and while a miss is still showing. */
export function flip(state: MemoryState, index: number): MemoryState {
  if (isMismatch(state) || state.open.includes(index) || state.matched.includes(index) || !state.cards[index]) return state
  if (state.open.length === 0) return { ...state, open: [index] }
  const first = state.open[0]
  const moves = state.moves + 1
  if (state.cards[first].face === state.cards[index].face) {
    const pairs: [number, number] = [...state.pairs]
    pairs[state.player]++
    return { ...state, open: [], matched: [...state.matched, first, index], moves, pairs }
  }
  return { ...state, open: [first, index], moves }
}

/** Turns a missed pair back face down and, with two players, passes the turn. */
export function hide(state: MemoryState): MemoryState {
  if (!isMismatch(state)) return state
  return { ...state, open: [], player: state.twoPlayers ? ((1 - state.player) as Player) : state.player }
}

/**
 * Stars for one player by moves per pair. A perfect memory still needs some
 * guessing, so about 1.75 moves per pair is excellent.
 */
export function starsForMoves(moves: number, pairs: number): Stars {
  const ratio = moves / pairs
  if (ratio <= 1.75) return 3
  if (ratio <= 2.5) return 2
  if (ratio <= 3.5) return 1
  return 0
}

/** Folds a finished one-player game into the saved progress (best stars per size). */
export function recordGame(progress: GameProgress, size: Size['id'], stars: Stars): GameProgress {
  return { ...progress, stars: mergeStars(progress.stars, new Map([[size, stars]])) }
}
