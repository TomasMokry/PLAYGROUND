export type Stars = 0 | 1 | 2 | 3

export interface MultiplicationProgress {
  /** Best stars earned per table (1–10). Missing key = 0 stars. */
  stars: Partial<Record<number, Stars>>
  bestStreak: number
  timeAttackBest: number
  totalPoints: number
}

export interface Profile {
  id: string
  name: string
  avatar: string
  muted: boolean
  multiplication: MultiplicationProgress
}

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

export const emptyMultiplication = (): MultiplicationProgress => ({
  stars: {},
  bestStreak: 0,
  timeAttackBest: 0,
  totalPoints: 0,
})

export function createProfile(name: string, avatar: string): Profile {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    avatar,
    muted: false,
    multiplication: emptyMultiplication(),
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as AppData
    if (parsed?.version !== 1 || !Array.isArray(parsed.profiles)) return emptyData()
    // Fill in any fields added after the profile was first saved.
    parsed.profiles = parsed.profiles.map((p) => ({
      ...p,
      multiplication: { ...emptyMultiplication(), ...p.multiplication },
    }))
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

export function totalStars(profile: Profile): number {
  return Object.values(profile.multiplication.stars).reduce<number>((sum, s) => sum + (s ?? 0), 0)
}
