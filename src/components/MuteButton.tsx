import { useProfiles } from '../profiles/ProfileContext'

export function MuteButton() {
  const { activeProfile, updateActiveProfile } = useProfiles()
  if (!activeProfile) return null
  const muted = activeProfile.muted
  return (
    <button
      type="button"
      onClick={() => updateActiveProfile((p) => ({ ...p, muted: !p.muted }))}
      className="grid size-11 place-items-center rounded-full bg-white text-xl shadow-sm transition hover:scale-110 active:scale-95"
      title={muted ? 'Zapnout zvuk' : 'Vypnout zvuk'}
      aria-label={muted ? 'Zapnout zvuk' : 'Vypnout zvuk'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
