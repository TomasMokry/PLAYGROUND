import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createProfile, loadData, saveData, type AppData } from '../lib/storage'
import { setMuted } from '../lib/sound'
import { ProfileContext, type ProfileContextValue } from './ProfileContext'

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData)

  useEffect(() => saveData(data), [data])

  const activeProfile = data.profiles.find((p) => p.id === data.activeProfileId) ?? null

  useEffect(() => setMuted(activeProfile?.muted ?? false), [activeProfile?.muted])

  const addProfile = useCallback((name: string, avatar: string) => {
    const profile = createProfile(name, avatar)
    setData((d) => ({ ...d, profiles: [...d.profiles, profile], activeProfileId: profile.id }))
  }, [])

  const removeProfile = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      profiles: d.profiles.filter((p) => p.id !== id),
      activeProfileId: d.activeProfileId === id ? null : d.activeProfileId,
    }))
  }, [])

  const selectProfile = useCallback((id: string | null) => {
    setData((d) => ({ ...d, activeProfileId: id }))
  }, [])

  const updateActiveProfile = useCallback<ProfileContextValue['updateActiveProfile']>((update) => {
    setData((d) => ({
      ...d,
      profiles: d.profiles.map((p) => (p.id === d.activeProfileId ? update(p) : p)),
    }))
  }, [])

  const value = useMemo(
    () => ({ data, activeProfile, addProfile, removeProfile, selectProfile, updateActiveProfile }),
    [data, activeProfile, addProfile, removeProfile, selectProfile, updateActiveProfile],
  )

  return <ProfileContext value={value}>{children}</ProfileContext>
}
