import { createContext, useContext } from 'react'
import type { AppData, Profile } from '../lib/storage'

export interface ProfileContextValue {
  data: AppData
  activeProfile: Profile | null
  addProfile: (name: string, avatar: string) => void
  removeProfile: (id: string) => void
  selectProfile: (id: string | null) => void
  /** Apply an immutable update to the active profile and persist it. */
  updateActiveProfile: (update: (profile: Profile) => Profile) => void
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)

export function useProfiles(): ProfileContextValue {
  const value = useContext(ProfileContext)
  if (!value) throw new Error('useProfiles must be used inside <ProfileProvider>')
  return value
}

/** For screens that are only reachable with an active profile (guarded in App). */
export function useActiveProfile(): Profile {
  const { activeProfile } = useProfiles()
  if (!activeProfile) throw new Error('No active profile')
  return activeProfile
}
