import { useNavigate } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { Header } from '../../components/Header'
import { ModeCard } from '../../components/ModeCard'
import { canSpeak, speak } from '../../lib/sound'
import type { Stars } from '../../lib/storage'
import { useActiveProfile } from '../../profiles/ProfileContext'
import { SUBJECTS } from '../registry'
import { ROUND_COUNT } from './logic'
import { CHOOSE_TITLE, MODES, WRITE_TITLE, type Topic } from './topics'
import { WordPicture } from './WordPicture'

const starText = (stars: Stars) => '★'.repeat(stars) + '☆'.repeat(3 - stars)

export default function TopicHome({ topic }: { topic: Topic }) {
  const progress = useActiveProfile()[topic.id]
  const navigate = useNavigate()
  const speaks = canSpeak()

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 pb-12">
        <BackLink to={SUBJECTS.english.path}>{SUBJECTS.english.title}</BackLink>
        <h1 className="mt-4 text-4xl font-black">
          {topic.title} {topic.icon}
        </h1>
        <p className="mt-1 text-lg font-semibold text-slate-500">
          Nejdelší série 🔥 {progress.bestStreak} · Body ⭐ {progress.totalPoints}
        </p>

        <h2 className="mt-8 text-xl font-extrabold">Vyber hru</h2>
        <section className="mt-4 grid gap-5 md:grid-cols-3">
          <ModeCard
            icon="🎯"
            title={CHOOSE_TITLE}
            description={`${topic.text.choose} ${ROUND_COUNT} otázek.`}
            color="from-sky-500 to-blue-600"
            extra={starText(progress.stars[MODES.choose] ?? 0)}
            onPlay={() => navigate(`${topic.path}/vyber`)}
          />
          <ModeCard
            icon="👂"
            title={topic.text.findTitle}
            description={`${topic.text.find} ${ROUND_COUNT} otázek.`}
            color="from-emerald-500 to-teal-600"
            extra={starText(progress.stars[MODES.find] ?? 0)}
            onPlay={() => navigate(`${topic.path}/najdi`)}
          />
          <ModeCard
            icon="✍️"
            title={WRITE_TITLE}
            description={`${topic.text.write} ${ROUND_COUNT} slov.`}
            color="from-pink-500 to-rose-500"
            extra={starText(progress.stars[MODES.write] ?? 0)}
            onPlay={() => navigate(`${topic.path}/napis`)}
          />
        </section>

        <section className="mt-10 rounded-3xl bg-white/70 p-6 shadow-sm">
          <h2 className="text-xl font-extrabold">📖 Slovníček</h2>
          <p className="mt-1 font-semibold text-slate-500">
            {speaks ? 'Klikni na slovo a poslechni si, jak se vyslovuje.' : 'Než začneš hrát, projdi si slovíčka.'}
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {topic.words.map((word) => (
              <li key={word.en}>
                <button
                  type="button"
                  disabled={!speaks}
                  onClick={() => speak(word.en)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-md"
                >
                  <WordPicture word={word} size="sm" />
                  <span className="min-w-0">
                    <span className="block text-xl font-black">{word.en}</span>
                    <span className="block text-sm font-semibold text-slate-400">{word.cs}</span>
                  </span>
                  {speaks && <span className="ml-auto text-lg opacity-50">🔊</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  )
}
