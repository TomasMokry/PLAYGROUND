import { Link } from 'react-router'
import { totalStars } from '../lib/storage'
import { useActiveProfile } from '../profiles/ProfileContext'
import { MuteButton } from './MuteButton'

export function Header() {
  const profile = useActiveProfile()
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-5">
      <Link to="/" className="flex items-center gap-2 text-2xl font-black tracking-tight text-violet-600">
        <span className="grid size-10 place-items-center rounded-xl bg-violet-600 text-xl">✏️</span>
        Škola hrou
      </Link>
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-white px-4 py-2 font-bold shadow-sm" title="Hvězdy">
          <span className="text-amber-400">★</span> {totalStars(profile)}
        </div>
        <MuteButton />
        <Link
          to="/profily"
          className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-4 font-bold shadow-sm transition hover:scale-105"
          title="Změnit hráče"
        >
          <span className="grid size-9 place-items-center rounded-full bg-violet-100 text-xl">{profile.avatar}</span>
          {profile.name}
        </Link>
      </div>
    </header>
  )
}
