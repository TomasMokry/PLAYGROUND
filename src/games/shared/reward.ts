import type { RewardState } from '../../lib/storage'

/**
 * Play time for the fun games, earned by learning rounds without a mistake.
 * It goes into a per-profile bank (capped) and is spent only while a fun game runs.
 * Each exercise (game + mode + tables/levels) pays once a day, so repeating the easiest one doesn't help.
 */

export const REWARD_MS = 3 * 60_000
export const BANK_CAP_MS = 30 * 60_000
/** A time-attack round needs at least this many answers (and no mistake) to count as perfect. */
export const TIME_ATTACK_MIN_CORRECT = 20

export const isPerfect = (firstTry: number, total: number): boolean => total > 0 && firstTry === total

export const isPerfectTimeAttack = (correct: number, wrong: number): boolean => wrong === 0 && correct >= TIME_ATTACK_MIN_CORRECT

/** Identifies one exercise, e.g. "multiplication:practice:3,6,7" or "colors:write". */
export function exerciseKey(game: string, mode: string | number, groups: readonly number[] = []): string {
  const sorted = [...groups].sort((a, b) => a - b)
  return [game, mode, ...(sorted.length ? [sorted.join(',')] : [])].join(':')
}

/** The local calendar day as YYYY-MM-DD. */
export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export type RewardOutcome =
  | { kind: 'earned'; ms: number; bankMs: number }
  /** This exercise already paid today. */
  | { kind: 'already' }
  /** The bank is full. */
  | { kind: 'full' }

/** Adds play time for a perfect round of `key` (if it hasn't paid today and the bank has room). */
export function earnReward(reward: RewardState, key: string, today: string): { reward: RewardState; outcome: RewardOutcome } {
  if (reward.claimed[key] === today) return { reward, outcome: { kind: 'already' } }
  if (reward.bankMs >= BANK_CAP_MS) return { reward, outcome: { kind: 'full' } }
  const ms = Math.min(REWARD_MS, BANK_CAP_MS - reward.bankMs)
  // Claims from other days no longer matter, so they are dropped to keep the save small.
  const claimed = Object.fromEntries(Object.entries(reward.claimed).filter(([, day]) => day === today))
  const bankMs = reward.bankMs + ms
  return { reward: { bankMs, claimed: { ...claimed, [key]: today } }, outcome: { kind: 'earned', ms, bankMs } }
}

export function spendPlayTime(reward: RewardState, ms: number): RewardState {
  return { ...reward, bankMs: Math.max(0, reward.bankMs - ms) }
}

/** Whole minutes for display, rounded up so "0:30 left" still reads as 1 min. */
export const minutesOf = (ms: number): number => Math.ceil(ms / 60_000)

/** Czech plural of "minuta" in the accusative: 1 minutu, 2–4 minuty, 5+ minut. */
export function minutesWord(n: number): string {
  if (n === 1) return 'minutu'
  if (n >= 2 && n <= 4) return 'minuty'
  return 'minut'
}
