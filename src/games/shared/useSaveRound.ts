import type { GameId } from '../../lib/storage'
import { useProfiles } from '../../profiles/ProfileContext'
import { applyRound, type RoundOutcome, type RoundUpdate } from './progress'

/** Saves a finished round to the active profile and returns which records were broken. */
export function useSaveRound(game: GameId) {
  const { activeProfile, updateActiveProfile } = useProfiles()
  return (outcome: RoundOutcome): RoundUpdate | null => {
    if (!activeProfile) return null
    const update = applyRound(activeProfile[game], outcome)
    updateActiveProfile((p) => ({ ...p, [game]: applyRound(p[game], outcome).progress }))
    return update
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
