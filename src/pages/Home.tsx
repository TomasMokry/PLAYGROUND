import { Link } from 'react-router'
import { Header } from '../components/Header'
import { GAMES, type GameInfo } from '../games/registry'
import { bestStreak, totalPoints, totalStars } from '../lib/storage'
import { useActiveProfile } from '../profiles/ProfileContext'

export default function Home() {
  const profile = useActiveProfile()
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 pb-12">
        <section className="mt-4 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black sm:text-5xl">
              Ahoj, {profile.name}! <span className="inline-block animate-float">{profile.avatar}</span>
            </h1>
            <p className="mt-2 text-lg font-semibold text-slate-500">Co si dnes procvičíme?</p>
          </div>
          <div className="flex gap-3">
            <StatPill icon="★" iconClass="text-amber-400" label="Hvězdy" value={totalStars(profile)} />
            <StatPill icon="⭐" label="Body" value={totalPoints(profile)} />
            <StatPill icon="🔥" label="Série" value={bestStreak(profile)} />
          </div>
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          {GAMES.map((game) => (
            <GamePanel key={game.id} game={game} />
          ))}
        </section>
      </main>
    </>
  )
}

function StatPill({ icon, iconClass = '', label, value }: { icon: string; iconClass?: string; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-3 text-center shadow-sm">
      <div className="text-2xl font-black tabular-nums">
        <span className={iconClass}>{icon}</span> {value}
      </div>
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  )
}

function GamePanel({ game }: { game: GameInfo }) {
  const body = (
    <>
      <span className="absolute -right-6 -top-6 text-[9rem] leading-none opacity-20 transition group-hover:rotate-12 group-hover:scale-110">
        {game.icon}
      </span>
      <span className="text-5xl">{game.icon}</span>
      <h2 className="mt-6 text-3xl font-black">{game.title}</h2>
      <p className="mt-1 font-semibold text-white/85">{game.description}</p>
      {game.path ? (
        <span className="mt-6 inline-block rounded-full bg-white/25 px-5 py-2 font-extrabold backdrop-blur-sm">Hrát →</span>
      ) : (
        <span className="mt-6 inline-block rounded-full bg-black/15 px-5 py-2 font-extrabold">Již brzy 🔒</span>
      )}
    </>
  )
  const base = `group relative overflow-hidden rounded-3xl bg-gradient-to-br p-8 text-white shadow-lg ${game.gradient}`
  return game.path ? (
    <Link to={game.path} className={`${base} transition hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]`}>
      {body}
    </Link>
  ) : (
    <div className={`${base} cursor-not-allowed opacity-50 grayscale-[30%]`} aria-disabled>
      {body}
    </div>
  )
}
