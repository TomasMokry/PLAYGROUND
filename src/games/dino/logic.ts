import type { GameProgress, Stars } from '../../lib/storage'
import { mergeStars } from '../shared/rules'

/**
 * Dino run rules (like Chrome's offline dinosaur): the dino runs on its own,
 * the child jumps over cacti and ducks under birds, and the game speeds up.
 * Heights are measured in pixels above the ground; time in seconds.
 */

export const WIDTH = 600
export const DINO_X = 40

const START_SPEED = 360
const MAX_SPEED = 780
/** Speed gained per second of running. */
const ACCEL = 4
const GRAVITY = 2600
const JUMP_VELOCITY = 760
/** Holding duck in the air pulls the dino down faster. */
const FAST_FALL = 3
/** A jump pressed slightly before landing still counts. */
const JUMP_BUFFER = 0.12
/** Long frames (a hiccup, a hidden tab) are cut so nothing jumps through obstacles. */
const MAX_DT = 0.05
/** The dino's hitbox is a bit smaller than its picture, to be fair to kids. */
const HIT_PADDING = 6

export const DINO_SIZE = { standing: { w: 40, h: 44 }, ducking: { w: 54, h: 26 } }

/** Scores from which birds and groups of three cacti appear. */
const BIRDS_FROM = 150
const BIG_GROUPS_FROM = 100

export interface Box {
  x: number
  w: number
  /** Height of the bottom edge above the ground. */
  bottom: number
  h: number
}

export interface Obstacle extends Box {
  kind: 'cactus' | 'bird'
  /** Cacti side by side (1–3); 1 for birds. */
  count: number
}

export interface RunState {
  time: number
  distance: number
  speed: number
  /** Dino height above the ground and vertical speed (up is positive). */
  y: number
  vy: number
  ducking: boolean
  jumpBuffer: number
  /** Counts jumps, so the screen can play a sound for each. */
  jumps: number
  obstacles: Obstacle[]
  /** Distance at which the next obstacle appears. */
  nextSpawn: number
  /** Seed for the next random number, so the rules stay pure and repeatable. */
  seed: number
  over: boolean
}

export interface Input {
  /** Jump pressed this frame. */
  jump: boolean
  /** Duck held. */
  duck: boolean
}

/** One step of a linear congruential generator: a number in [0, 1) and the next seed. */
function random(seed: number): [number, number] {
  const next = (seed * 1664525 + 1013904223) % 4294967296
  return [next / 4294967296, next]
}

export function newRun(seed: number = Math.floor(Math.random() * 4294967296)): RunState {
  return {
    time: 0,
    distance: 0,
    speed: START_SPEED,
    y: 0,
    vy: 0,
    ducking: false,
    jumpBuffer: 0,
    jumps: 0,
    obstacles: [],
    nextSpawn: 300,
    seed,
    over: false,
  }
}

/** Score grows with distance, about 9 points a second at the start. */
export const scoreOf = (state: RunState): number => Math.floor(state.distance * 0.025)

export function dinoBox(state: Pick<RunState, 'y' | 'ducking'>): Box {
  const { w, h } = state.ducking ? DINO_SIZE.ducking : DINO_SIZE.standing
  return { x: DINO_X, w, bottom: state.y, h }
}

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.bottom < b.bottom + b.h && b.bottom < a.bottom + a.h
}

function hits(dino: Box, obstacle: Obstacle): boolean {
  const p = HIT_PADDING
  return overlaps({ x: dino.x + p, w: dino.w - 2 * p, bottom: dino.bottom, h: dino.h - p }, obstacle)
}

/** A random obstacle for the current score. Low birds are jumped over, middle ones ducked under. */
export function makeObstacle(r: number, r2: number, score: number): Obstacle {
  if (score >= BIRDS_FROM && r < 0.25) {
    return { kind: 'bird', count: 1, x: WIDTH + 10, w: 36, h: 26, bottom: r2 < 0.5 ? 8 : 32 }
  }
  const options: Omit<Obstacle, 'x'>[] = [
    { kind: 'cactus', count: 1, w: 20, h: 38, bottom: 0 },
    { kind: 'cactus', count: 1, w: 28, h: 50, bottom: 0 },
    { kind: 'cactus', count: 2, w: 40, h: 38, bottom: 0 },
  ]
  if (score >= BIG_GROUPS_FROM) options.push({ kind: 'cactus', count: 3, w: 60, h: 38, bottom: 0 })
  return { ...options[Math.floor(r2 * options.length)], x: WIDTH + 10 }
}

/** One frame of the run. */
export function step(state: RunState, dt: number, input: Input): RunState {
  if (state.over) return state
  dt = Math.min(dt, MAX_DT)
  const time = state.time + dt
  const speed = Math.min(MAX_SPEED, START_SPEED + ACCEL * time)
  const dx = speed * dt
  const distance = state.distance + dx

  let { y, vy, jumps } = state
  let jumpBuffer = input.jump ? JUMP_BUFFER : Math.max(0, state.jumpBuffer - dt)
  if (y === 0 && jumpBuffer > 0) {
    vy = JUMP_VELOCITY
    jumpBuffer = 0
    jumps++
  }
  if (y > 0 || vy > 0) {
    vy -= GRAVITY * (input.duck ? FAST_FALL : 1) * dt
    y = Math.max(0, y + vy * dt)
    if (y === 0) vy = 0
  }
  const ducking = input.duck && y === 0

  const obstacles = state.obstacles.map((o) => ({ ...o, x: o.x - dx })).filter((o) => o.x + o.w > -20)
  let { seed, nextSpawn } = state
  if (distance >= nextSpawn) {
    let r: number, r2: number, r3: number
    ;[r, seed] = random(seed)
    ;[r2, seed] = random(seed)
    ;[r3, seed] = random(seed)
    const obstacle = makeObstacle(r, r2, Math.floor(distance * 0.025))
    obstacles.push(obstacle)
    // Gaps scale with speed, so there is always time to land and jump again.
    nextSpawn = distance + obstacle.w + speed * (0.9 + r3 * 0.9)
  }

  const dino = dinoBox({ y, ducking })
  return {
    time,
    distance,
    speed,
    y,
    vy,
    ducking,
    jumpBuffer,
    jumps,
    obstacles,
    nextSpawn,
    seed,
    over: obstacles.some((o) => hits(dino, o)),
  }
}

/** Score in one run: 100 = ★, 300 = ★★, 600 = ★★★. */
export function starsForScore(score: number): Stars {
  if (score >= 600) return 3
  if (score >= 300) return 2
  if (score >= 100) return 1
  return 0
}

/** Folds a finished run into the saved progress (best score and best stars). */
export function recordRun(progress: GameProgress, score: number): { progress: GameProgress; newBestScore: boolean } {
  return {
    newBestScore: score > progress.bestScore,
    progress: {
      ...progress,
      stars: mergeStars(progress.stars, new Map([[0, starsForScore(score)]])),
      bestScore: Math.max(progress.bestScore, score),
    },
  }
}
