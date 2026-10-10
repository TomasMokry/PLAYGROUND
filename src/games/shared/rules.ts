import type { Stars } from '../../lib/storage'

/** Rules shared by every game: points, streaks, stars and random helpers. */

export const BASE_POINTS = 10

export type Rng = () => number

export const pick = <T>(items: readonly T[], rng: Rng = Math.random): T => items[Math.floor(rng() * items.length)]

/** A shuffled copy (Fisher–Yates). */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Moves the current (wrongly answered) question to the end of the queue. */
export function requeue<T>(queue: readonly T[]): T[] {
  if (queue.length <= 1) return [...queue]
  return [...queue.slice(1), queue[0]]
}

/** Points multiplier for a streak (the streak includes the current answer). */
export function streakMultiplier(streak: number): 1 | 2 | 3 {
  if (streak >= 10) return 3
  if (streak >= 5) return 2
  return 1
}

export function pointsFor(streak: number): number {
  return BASE_POINTS * streakMultiplier(streak)
}

export function starsFor(firstTryCorrect: number, total: number): Stars {
  if (total <= 0) return 0
  if (firstTryCorrect >= total) return 3
  const ratio = firstTryCorrect / total
  if (ratio >= 0.8) return 2
  if (ratio >= 0.6) return 1
  return 0
}

/** Keeps the better of the stored and newly earned stars. */
export function mergeStars(
  stored: Partial<Record<number, Stars>>,
  earned: Map<number, Stars>,
): Partial<Record<number, Stars>> {
  const merged = { ...stored }
  for (const [group, stars] of earned) {
    merged[group] = Math.max(merged[group] ?? 0, stars) as Stars
  }
  return merged
}

const PRAISE = ['Skvělé!', 'Jsi hvězda!', 'Paráda!', 'Výborně!', 'Super!', 'Bomba!', 'Neuvěřitelné!', 'Jen tak dál!']

export function randomPraise(rng: Rng = Math.random): string {
  return pick(PRAISE, rng)
}
