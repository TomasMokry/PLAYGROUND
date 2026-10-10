import { BackLink } from '../components/BackLink'
import { GamePanel } from '../components/GamePanel'
import { Header } from '../components/Header'
import type { Subject } from '../games/registry'
import { totalStars } from '../lib/storage'
import { useActiveProfile } from '../profiles/ProfileContext'

/** The game panels of one subject (Matematika, Angličtina). */
export default function SubjectHome({ subject }: { subject: Subject }) {
  const profile = useActiveProfile()
  const stars = totalStars(
    profile,
    subject.games.map((g) => g.id),
  )
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
        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          {subject.games.map((game) => (
            <GamePanel key={game.id} game={game} />
          ))}
        </section>
      </main>
    </>
  )
}
