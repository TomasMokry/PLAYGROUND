export type Stars = 0 | 1 | 2 | 3

/** Math games. */
export const OPERATION_IDS = ['multiplication', 'addition', 'subtraction', 'division'] as const
export type OperationId = (typeof OPERATION_IDS)[number]

/** English games. */
export const TOPIC_IDS = ['colors', 'numbers'] as const
export type TopicId = (typeof TOPIC_IDS)[number]

/** Just-for-fun games. */
export const FUN_IDS = ['tetris', 'tictactoe'] as const
export type FunId = (typeof FUN_IDS)[number]

/** Every game that keeps its own progress. */
export const GAME_IDS = [...OPERATION_IDS, ...TOPIC_IDS, ...FUN_IDS] as const
export type GameId = (typeof GAME_IDS)[number]

export interface GameProgress {
  /** Best stars earned per group (multiplication table, difficulty level, English mode…). Missing key = 0 stars. */
  stars: Partial<Record<number, Stars>>
  bestStreak: number
  timeAttackBest: number
  totalPoints: number
  /** Best score of a single game, for games scored freely like Tetris. */
  bestScore: number
}

export type Profile = {
  id: string
  name: string
  avatar: string
  muted: boolean
} & Record<GameId, GameProgress>

export interface AppData {
  version: 1
  activeProfileId: string | null
  profiles: Profile[]
}

const STORAGE_KEY = 'mathkids:v1'

export const emptyData = (): AppData => ({
  version: 1,
  activeProfileId: null,
  profiles: [],
})

export const emptyProgress = (): GameProgress => ({
  stars: {},
  bestStreak: 0,
  timeAttackBest: 0,
  totalPoints: 0,
  bestScore: 0,
})

const emptyGames = () => Object.fromEntries(GAME_IDS.map((id) => [id, emptyProgress()])) as Record<GameId, GameProgress>

export function createProfile(name: string, avatar: string): Profile {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    avatar,
    muted: false,
    ...emptyGames(),
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as AppData
    if (parsed?.version !== 1 || !Array.isArray(parsed.profiles)) return emptyData()
    // Fill in any fields added after the profile was first saved.
    parsed.profiles = parsed.profiles.map((p) => {
      const filled = { ...p }
      for (const id of GAME_IDS) filled[id] = { ...emptyProgress(), ...p[id] }
      return filled
    })
    return parsed
  } catch {
    return emptyData()
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or blocked: progress just won't persist this session.
  }
}

/** Stars across the given games (all of them by default). */
export function totalStars(profile: Profile, games: readonly GameId[] = GAME_IDS): number {
  return games.reduce(
    (sum, id) => sum + Object.values(profile[id].stars).reduce<number>((s, stars) => s + (stars ?? 0), 0),
    0,
  )
}

export function totalPoints(profile: Profile): number {
  return GAME_IDS.reduce((sum, id) => sum + profile[id].totalPoints, 0)
}

export function bestStreak(profile: Profile): number {
  return Math.max(...GAME_IDS.map((id) => profile[id].bestStreak))
}
