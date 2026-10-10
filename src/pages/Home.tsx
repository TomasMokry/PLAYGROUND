import { GamePanel } from '../components/GamePanel'
import { Header } from '../components/Header'
import { SUBJECT_LIST } from '../games/registry'
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
          {SUBJECT_LIST.map((subject) => (
            <GamePanel key={subject.id} game={subject} />
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
