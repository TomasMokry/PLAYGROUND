import { Link } from 'react-router'
import { BackLink } from '../components/BackLink'
import { GamePanel } from '../components/GamePanel'
import { Header } from '../components/Header'
import type { Subject } from '../games/registry'
import { minutesOf, minutesWord, REWARD_MS } from '../games/shared/reward'
import { totalStars } from '../lib/storage'
import { useActiveProfile } from '../profiles/ProfileContext'

/** The game panels of one subject (Matematika, Angličtina). */
export default function SubjectHome({ subject }: { subject: Subject }) {
  const profile = useActiveProfile()
  const stars = totalStars(
    profile,
    subject.games.map((g) => g.id),
  )
  const locked = subject.rewardGated === true && profile.reward.bankMs <= 0
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 pb-12">
        <BackLink to="/">Domů</BackLink>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-black">
            {subject.title} {subject.icon}
          </h1>
          <div className="rounded-full bg-white px-4 py-2 font-bold shadow-sm" title="Hvězdy v tomto předmětu">
            <span className="text-amber-400">★</span> {stars}
          </div>
        </div>
        {subject.rewardGated && <PlayTimeBanner bankMs={profile.reward.bankMs} />}
        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          {subject.games.map((game) => (
            <GamePanel key={game.id} game={game} locked={locked} />
          ))}
        </section>
      </main>
    </>
  )
}

/** How much play time is left, or how to earn some. */
function PlayTimeBanner({ bankMs }: { bankMs: number }) {
  if (bankMs > 0) {
    return (
      <p className="mt-6 rounded-3xl bg-white p-5 text-lg font-bold shadow-sm">
        🎮 Máš <span className="text-rose-500">{minutesOf(bankMs)} min</span> hraní. Čas běží, jen když hraješ.
      </p>
    )
  }
  return (
    <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-lg font-bold">
        🔒 Hry jsou zamčené. Dokonči cvičení z matematiky nebo angličtiny <span className="text-rose-500">bez jediné chyby</span> a získáš{' '}
        {minutesOf(REWARD_MS)} {minutesWord(minutesOf(REWARD_MS))} hraní.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/matika" className="rounded-full bg-violet-600 px-5 py-2 font-extrabold text-white shadow-sm transition hover:bg-violet-700">
          🔢 Matematika
        </Link>
        <Link to="/anglictina" className="rounded-full bg-sky-500 px-5 py-2 font-extrabold text-white shadow-sm transition hover:bg-sky-600">
          🇬🇧 Angličtina
        </Link>
      </div>
    </div>
  )
}
