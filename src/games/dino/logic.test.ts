import { describe, expect, it } from 'vitest'
import { emptyProgress } from '../../lib/storage'
import { DINO_X, type Input, newRun, type Obstacle, recordRun, type RunState, scoreOf, starsForScore, step } from './logic'

const FRAME = 1 / 60
const idle: Input = { jump: false, duck: false }

/** A run with one obstacle placed right in front of the dino and no more coming. */
function runWith(obstacle: Omit<Obstacle, 'x'>, distanceAhead = 120): RunState {
  return { ...newRun(1), obstacles: [{ ...obstacle, x: DINO_X + distanceAhead }], nextSpawn: Infinity }
}

/** Plays frames until the obstacle has passed the dino or the game ends. */
function play(state: RunState, input: (s: RunState, frame: number) => Input): RunState {
  for (let frame = 0; frame < 120 && !state.over; frame++) state = step(state, FRAME, input(state, frame))
  return state
}

const cactus = { kind: 'cactus', count: 1, w: 20, h: 38, bottom: 0 } as const
const midBird = { kind: 'bird', count: 1, w: 36, h: 26, bottom: 32 } as const

describe('step', () => {
  it('runs into a cactus without jumping', () => {
    expect(play(runWith(cactus), () => idle).over).toBe(true)
  })

  it('clears a cactus with a jump', () => {
    const end = play(runWith(cactus), (_, frame) => ({ jump: frame === 0, duck: false }))
    expect(end.over).toBe(false)
    expect(end.jumps).toBe(1)
  })

  it('ducks under a middle bird, but standing hits it', () => {
    expect(play(runWith(midBird), () => ({ jump: false, duck: true })).over).toBe(false)
    expect(play(runWith(midBird), () => idle).over).toBe(true)
  })

  it('remembers a jump pressed just before landing', () => {
    let state = step(newRun(1), FRAME, { jump: true, duck: false })
    while (state.y > 30 || state.vy > 0) state = step(state, FRAME, idle)
    // Still in the air: press jump now, it fires on landing.
    state = step(state, FRAME, { jump: true, duck: false })
    for (let i = 0; i < 10; i++) state = step(state, FRAME, idle)
    expect(state.jumps).toBe(2)
  })

  it('speeds up over time up to a limit', () => {
    let state = { ...newRun(1), nextSpawn: Infinity }
    const start = state.speed
    for (let i = 0; i < 600; i++) state = step(state, FRAME, idle)
    expect(state.speed).toBeGreaterThan(start)
    state = step({ ...state, time: 10_000 }, FRAME, idle)
    expect(state.speed).toBe(780)
  })

  it('cuts long frames so nothing is skipped', () => {
    const state = step({ ...newRun(1), nextSpawn: Infinity }, 5, idle)
    expect(state.time).toBeCloseTo(0.05)
  })

  it('a simple player that jumps and ducks in time survives two minutes', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      let state = newRun(seed)
      let duckLeft = 0
      for (let frame = 0; frame < 60 * 120 && !state.over; frame++) {
        const next = state.obstacles.find((o) => o.x + o.w > DINO_X)
        const gap = next ? next.x - (DINO_X + 40) : Infinity
        // Jump when the obstacle is about a fifth of a second away (less when it is wide).
        const jumpAt = state.speed * 0.2
        const duck = next?.bottom === 32 && gap < state.speed * 0.3
        if (duck) duckLeft = 0.4
        duckLeft -= FRAME
        state = step(state, FRAME, { jump: !duck && duckLeft <= 0 && gap > 0 && gap < jumpAt, duck: duckLeft > 0 })
      }
      expect(state.over, `seed ${seed} at score ${scoreOf(state)}`).toBe(false)
    }
  })
})

describe('score and progress', () => {
  it('scores by distance', () => {
    expect(scoreOf({ ...newRun(1), distance: 4000 })).toBe(100)
  })

  it('gives stars for the score', () => {
    expect(starsForScore(99)).toBe(0)
    expect(starsForScore(100)).toBe(1)
    expect(starsForScore(300)).toBe(2)
    expect(starsForScore(600)).toBe(3)
  })

  it('keeps the best score and stars', () => {
    const first = recordRun(emptyProgress(), 350)
    expect(first.newBestScore).toBe(true)
    const second = recordRun(first.progress, 120)
    expect(second.newBestScore).toBe(false)
    expect(second.progress.bestScore).toBe(350)
    expect(second.progress.stars[0]).toBe(2)
  })
})
