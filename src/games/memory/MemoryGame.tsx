import { type MouseEvent, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { Header } from '../../components/Header'
import { MuteButton } from '../../components/MuteButton'
import { StarRating } from '../../components/StarRating'
import { celebrate, smallBurst } from '../../lib/confetti'
import { playCorrect, playTick, playWin } from '../../lib/sound'
import { useActiveProfile, useProfiles } from '../../profiles/ProfileContext'
import { ResultScreen, type Stat } from '../shared/ResultScreen'
import { formatDuration } from '../shared/useSaveRound'
import { deal, flip, hide, isDone, isMismatch, newGame, recordGame, type Size, SIZES, starsForMoves, type Theme, THEMES } from './logic'

const BACK_TO = '/zabava'
/** How long a missed pair stays face up so the child can remember it. */
const MISS_SHOW_MS = 1000

interface Settings {
  theme: Theme
  size: Size
  twoPlayers: boolean
}

export default function MemoryMode() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [round, setRound] = useState(0)
  return settings ? (
    <MemoryGame key={round} settings={settings} onAgain={() => setRound((r) => r + 1)} onChangeSettings={() => setSettings(null)} />
  ) : (
    <SetupScreen onStart={setSettings} />
  )
}

const SIZE_COLORS: Record<Size['id'], string> = {
  1: 'from-emerald-400 to-teal-500',
  2: 'from-amber-400 to-orange-500',
  3: 'from-rose-500 to-pink-600',
}

function SetupScreen({ onStart }: { onStart: (settings: Settings) => void }) {
  const profile = useActiveProfile()
  const [theme, setTheme] = useState(THEMES[0])
  const [twoPlayers, setTwoPlayers] = useState(false)
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 pb-12">
        <BackLink to={BACK_TO}>Zábava</BackLink>
        <h1 className="mt-4 text-4xl font-black">Pexeso 🃏</h1>
        <p className="mt-2 text-lg font-semibold text-slate-500">Otáčej kartičky a hledej dvojice. Zapamatuješ si, kde co je?</p>

        <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-slate-400">Obrázky</h2>
        <div className="mt-2 flex flex-wrap gap-3">
          {THEMES.map((t) => (
            <Chip key={t.id} selected={t.id === theme.id} onClick={() => setTheme(t)}>
              {t.icon} {t.title}
            </Chip>
          ))}
        </div>

        <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-400">Hráči</h2>
        <div className="mt-2 flex flex-wrap gap-3">
          <Chip selected={!twoPlayers} onClick={() => setTwoPlayers(false)}>🙂 Sám</Chip>
          <Chip selected={twoPlayers} onClick={() => setTwoPlayers(true)}>👫 Dva hráči</Chip>
        </div>

        <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-400">Velikost</h2>
        <section className="mt-2 grid gap-6 sm:grid-cols-3">
          {SIZES.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => onStart({ theme, size, twoPlayers })}
              className={`flex flex-col items-start rounded-3xl bg-gradient-to-br p-6 text-left text-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] ${SIZE_COLORS[size.id]}`}
            >
              <span className="text-2xl font-black">{size.title}</span>
              <span className="mt-1 font-semibold text-white/85">
                {size.pairs} dvojic · {size.pairs * 2} kartiček
              </span>
              {!twoPlayers && (
                <span className="mt-3 rounded-full bg-white/25 px-3 py-1">
                  <StarRating stars={profile.memory.stars[size.id] ?? 0} size="sm" />
                </span>
              )}
              <span className="mt-4 rounded-full bg-white/25 px-4 py-1.5 font-extrabold">Hrát →</span>
            </button>
          ))}
        </section>
      </main>
    </>
  )
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full px-5 py-2.5 text-lg font-extrabold shadow-sm transition active:scale-95 ${
        selected ? 'bg-violet-600 text-white shadow-violet-200' : 'bg-white text-slate-600 hover:bg-violet-50'
      }`}
    >
      {children}
    </button>
  )
}

const BOARD_CLASSES: Record<Size['id'], string> = {
  1: 'max-w-md grid-cols-4',
  2: 'max-w-md grid-cols-4',
  3: 'max-w-md grid-cols-4 sm:max-w-2xl sm:grid-cols-6',
}

const PLAYER_NAMES = ['Hráč 1', 'Hráč 2'] as const

interface Result {
  stars: ReturnType<typeof starsForMoves>
  stats: Stat[]
}

function MemoryGame({ settings, onAgain, onChangeSettings }: { settings: Settings; onAgain: () => void; onChangeSettings: () => void }) {
  const { theme, size, twoPlayers } = settings
  const { activeProfile, updateActiveProfile } = useProfiles()
  const [game, setGame] = useState(() => newGame(deal(theme, size.pairs), twoPlayers))
  const [startedAt, setStartedAt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const done = isDone(game)

  // A missed pair stays visible for a moment, then turns back.
  const mismatch = isMismatch(game)
  useEffect(() => {
    if (!mismatch) return
    const t = window.setTimeout(() => setGame((g) => hide(g)), MISS_SHOW_MS)
    return () => window.clearTimeout(t)
  }, [mismatch])

  /** `now` is the click's time stamp, used to time the game. */
  function onCard(index: number, now: number) {
    const next = flip(game, index)
    if (next === game) return
    if (!startedAt) setStartedAt(now)
    setGame(next)
    if (next.matched.length === game.matched.length) {
      playTick()
      return
    }
    playCorrect()
    if (!isDone(next)) return
    if (twoPlayers) {
      playWin()
      celebrate()
      return
    }
    const stars = starsForMoves(next.moves, size.pairs)
    const duration = formatDuration(now - startedAt)
    if (activeProfile) updateActiveProfile((p) => ({ ...p, memory: recordGame(p.memory, size.id, stars) }))
    // Let the last pair show before the results.
    smallBurst()
    window.setTimeout(() => {
      setResult({
        stars,
        stats: [
          { label: 'Tahy', value: `🔄 ${next.moves}` },
          { label: 'Čas', value: `⏱️ ${duration}` },
        ],
      })
    }, 700)
  }

  const [p1, p2] = game.pairs
  const winner = p1 === p2 ? null : p1 > p2 ? 0 : 1

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-5">
      <div className="flex items-center gap-3">
        <Link to={BACK_TO} className="rounded-full bg-white px-4 py-2 font-bold shadow-sm transition hover:scale-105">
          ← Zpět
        </Link>
        <h1 className="flex-1 text-xl font-extrabold text-slate-700">
          Pexeso: {theme.title} {theme.icon}
        </h1>
        <MuteButton />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center gap-5 py-6">
        {result ? (
          <ResultScreen stars={result.stars} stats={result.stats} onAgain={onAgain} backTo={BACK_TO} />
        ) : (
          <>
            {twoPlayers ? (
              <div className="flex gap-3">
                {PLAYER_NAMES.map((name, i) => (
                  <div
                    key={name}
                    className={`min-w-28 rounded-2xl bg-white px-4 py-2 text-center shadow-sm transition ${!done && game.player === i ? 'scale-105 ring-4 ring-violet-300' : ''}`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{name}</div>
                    <div key={game.pairs[i]} className="animate-pop text-3xl font-black tabular-nums">{game.pairs[i]}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-3 font-extrabold">
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">🔄 Tahy: <span className="tabular-nums">{game.moves}</span></span>
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                  🃏 Dvojice: <span className="tabular-nums">{game.matched.length / 2} / {size.pairs}</span>
                </span>
              </div>
            )}

            {twoPlayers && done ? (
              <p className="animate-pop text-3xl font-black">{winner === null ? 'Remíza! 🤝' : `Vyhrál ${PLAYER_NAMES[winner]}! 🏆`}</p>
            ) : twoPlayers ? (
              <p className="text-xl font-black text-slate-600">Na tahu: {PLAYER_NAMES[game.player]}</p>
            ) : null}

            <div className={`grid w-full gap-2 sm:gap-3 ${BOARD_CLASSES[size.id]}`}>
              {game.cards.map((card, i) => (
                <MemoryCard
                  key={card.id}
                  face={card.face}
                  faceUp={game.open.includes(i) || game.matched.includes(i)}
                  matched={game.matched.includes(i)}
                  onClick={(e) => onCard(i, e.timeStamp)}
                />
              ))}
            </div>

            {twoPlayers && done && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onChangeSettings}
                  className="rounded-2xl bg-slate-100 px-6 py-4 text-lg font-extrabold transition hover:bg-slate-200"
                >
                  Změnit nastavení
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={onAgain}
                  className="rounded-2xl bg-violet-600 px-6 py-4 text-lg font-extrabold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 active:scale-95"
                >
                  Hrát znovu 🔄
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

/** A card that flips in 3D: the back shows a question mark, the front the picture. */
function MemoryCard({ face, faceUp, matched, onClick }: { face: string; faceUp: boolean; matched: boolean; onClick: (e: MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={faceUp}
      aria-label={faceUp ? face : 'Otočit kartičku'}
      className="group aspect-square perspective-normal"
    >
      <div className={`relative size-full transition-transform duration-500 transform-3d ${faceUp ? 'rotate-y-180' : ''}`}>
        <div className="absolute inset-0 grid place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-3xl font-black text-white/80 shadow-md backface-hidden transition group-hover:brightness-110 group-active:scale-95 sm:text-4xl">
          ?
        </div>
        <div
          className={`absolute inset-0 grid rotate-y-180 place-items-center rounded-2xl bg-white text-4xl shadow-md backface-hidden sm:text-5xl ${
            matched ? 'ring-4 ring-emerald-300' : 'ring-4 ring-violet-200'
          }`}
        >
          <span className={matched ? 'animate-pop' : ''}>{face}</span>
        </div>
      </div>
    </button>
  )
}
