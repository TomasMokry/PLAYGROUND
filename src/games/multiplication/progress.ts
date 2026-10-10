import type { MultiplicationProgress, Stars } from '../../lib/storage'
import { mergeStars } from './logic'

export interface RoundOutcome {
  points: number
  bestStreak: number
  /** Stars earned per table in this round (not used by time attack). */
  earnedStars?: Map<number, Stars>
  /** Correct answers in a time-attack round. */
  timeAttackScore?: number
}

export interface RoundUpdate {
  progress: MultiplicationProgress
  newBestStreak: boolean
  newTimeAttackBest: boolean
}

/** Folds one finished round into the saved progress and reports any new records. */
export function applyRound(progress: MultiplicationProgress, outcome: RoundOutcome): RoundUpdate {
  const newBestStreak = outcome.bestStreak > progress.bestStreak
  const newTimeAttackBest = outcome.timeAttackScore !== undefined && outcome.timeAttackScore > progress.timeAttackBest
  return {
    newBestStreak,
    newTimeAttackBest,
    progress: {
      stars: outcome.earnedStars ? mergeStars(progress.stars, outcome.earnedStars) : progress.stars,
      bestStreak: Math.max(progress.bestStreak, outcome.bestStreak),
      timeAttackBest: Math.max(progress.timeAttackBest, outcome.timeAttackScore ?? 0),
      totalPoints: progress.totalPoints + outcome.points,
    },
  }
}
