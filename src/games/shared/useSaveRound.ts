import type { GameId } from '../../lib/storage'
import { useProfiles } from '../../profiles/ProfileContext'
import { applyRound, type RoundOutcome, type RoundUpdate } from './progress'
import { earnReward, localDay, type RewardOutcome } from './reward'

export interface SavedRound extends RoundUpdate {
  /** Play time earned by a round without a mistake, or 'notPerfect'. */
  reward: RewardOutcome | 'notPerfect'
}

/** Saves a finished round to the active profile and returns which records were broken and what play time it earned. */
export function useSaveRound(game: GameId) {
  const { activeProfile, updateActiveProfile } = useProfiles()
  return (outcome: RoundOutcome): SavedRound | null => {
    if (!activeProfile) return null
    const today = localDay(new Date())
    const { rewardKey } = outcome
    const update = applyRound(activeProfile[game], outcome)
    updateActiveProfile((p) => ({
      ...p,
      [game]: applyRound(p[game], outcome).progress,
      reward: rewardKey ? earnReward(p.reward, rewardKey, today).reward : p.reward,
    }))
    return { ...update, reward: rewardKey ? earnReward(activeProfile.reward, rewardKey, today).outcome : 'notPerfect' }
  }
}

export function recordBadges(update: RoundUpdate | null): string[] {
  const badges: string[] = []
  if (update?.newTimeAttackBest) badges.push('🏅 Nový rekord!')
  if (update?.newBestStreak) badges.push('🔥 Nejdelší série!')
  return badges
}

export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
