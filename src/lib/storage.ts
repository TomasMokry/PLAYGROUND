export type Stars = 0 | 1 | 2 | 3

export const OPERATION_IDS = ['multiplication', 'addition', 'subtraction', 'division'] as const
export type OperationId = (typeof OPERATION_IDS)[number]

export interface OperationProgress {
  /** Best stars earned per group (multiplication table, difficulty level…). Missing key = 0 stars. */
  stars: Partial<Record<number, Stars>>
  bestStreak: number
  timeAttackBest: number
  totalPoints: number
}

export type Profile = {
  id: string
  name: string
  avatar: string
  muted: boolean
} & Record<OperationId, OperationProgress>

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

export const emptyProgress = (): OperationProgress => ({
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
    multiplication: emptyProgress(),
    addition: emptyProgress(),
    subtraction: emptyProgress(),
    division: emptyProgress(),
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
      for (const id of OPERATION_IDS) filled[id] = { ...emptyProgress(), ...p[id] }
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

export function totalStars(profile: Profile): number {
  return OPERATION_IDS.reduce(
    (sum, id) => sum + Object.values(profile[id].stars).reduce<number>((s, stars) => s + (stars ?? 0), 0),
    0,
  )
}

export function totalPoints(profile: Profile): number {
  return OPERATION_IDS.reduce((sum, id) => sum + profile[id].totalPoints, 0)
}

export function bestStreak(profile: Profile): number {
  return Math.max(...OPERATION_IDS.map((id) => profile[id].bestStreak))
}
