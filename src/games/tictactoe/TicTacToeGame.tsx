import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { Header } from '../../components/Header'
import { ModeCard } from '../../components/ModeCard'
import { MuteButton } from '../../components/MuteButton'
import { StarRating } from '../../components/StarRating'
import { celebrate } from '../../lib/confetti'
import { playTick, playWin, playWrong } from '../../lib/sound'
import type { Stars } from '../../lib/storage'
import { useActiveProfile, useProfiles } from '../../profiles/ProfileContext'
import { computerMove, emptyBoard, type Level, type Mark, other, outcomeOf, place, recordGame, starsFor } from './logic'

const BACK_TO = '/zabava'
const COMPUTER_DELAY_MS = 600

/** Against the computer at a level, or two players taking turns on one device. */
type Opponent = Level | 'friend'

const LEVELS: { level: Level; icon: string; title: string; description: string; color: string; extra: string }[] = [
  { level: 1, icon: '🐣', title: 'Lehká', description: 'Počítač hraje náhodně', color: 'from-emerald-400 to-teal-500', extra: 'výhra ★' },
  { level: 2, icon: '🦊', title: 'Střední', description: 'Počítač si dává pozor', color: 'from-amber-400 to-orange-500', extra: 'výhra ★★' },
  { level: 3, icon: '🤖', title: 'Těžká', description: 'Počítač neudělá chybu. Zvládneš remízu?', color: 'from-rose-500 to-pink-600', extra: 'remíza ★★★' },
]

export default function TicTacToeMode() {
  const [opponent, setOpponent] = useState<Opponent | null>(null)
  return opponent === null ? (
    <OpponentPicker onPick={setOpponent} />
  ) : (
    <TicTacToeGame key={opponent} opponent={opponent} onChangeOpponent={() => setOpponent(null)} />
  )
}

function OpponentPicker({ onPick }: { onPick: (opponent: Opponent) => void }) {
  const profile = useActiveProfile()
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 pb-12">
        <BackLink to={BACK_TO}>Zábava</BackLink>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-black">Piškvorky ⭕</h1>
          <StarRating stars={profile.tictactoe.stars[0] ?? 0} />
        </div>
        <p className="mt-2 text-lg font-semibold text-slate-500">Tři stejné značky v řadě vyhrávají. S kým budeš hrát?</p>
        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          {LEVELS.map((l) => (
            <ModeCard key={l.level} icon={l.icon} title={l.title} description={l.description} color={l.color} extra={l.extra} onPlay={() => onPick(l.level)} />
          ))}
          <ModeCard icon="👫" title="Dva hráči" description="Hrajte spolu na jednom zařízení" color="from-sky-500 to-indigo-500" onPlay={() => onPick('friend')} />
        </section>
      </main>
    </>
  )
}

const MARK_COLORS: Record<Mark, string> = {
  X: 'text-sky-500',
  O: 'text-rose-500',
}

const MARK_ICONS: Record<Mark, string> = { X: '✖', O: '◯' }

function TicTacToeGame({ opponent, onChangeOpponent }: { opponent: Opponent; onChangeOpponent: () => void }) {
  const { activeProfile, updateActiveProfile } = useProfiles()
  const vsComputer = opponent !== 'friend'
  // Against the computer the child is always X and the computer O.
  const names: Record<Mark, string> = vsComputer ? { X: 'Ty', O: 'Počítač' } : { X: 'Hráč ✖', O: 'Hráč ◯' }

  const [board, setBoard] = useState(emptyBoard)
  // Who starts takes turns from game to game.
  const [starter, setStarter] = useState<Mark>('X')
  const [score, setScore] = useState({ X: 0, O: 0, draws: 0 })
  const [newStars, setNewStars] = useState<Stars>(0)

  const outcome = outcomeOf(board)
  const marks = board.filter(Boolean).length
  const toMove: Mark = marks % 2 === 0 ? starter : other(starter)
  const computerTurn = vsComputer && toMove === 'O' && !outcome

  function play(index: number) {
    const next = place(board, index, toMove)
    if (next === board) return
    setBoard(next)
    const result = outcomeOf(next)
    if (!result) {
      playTick()
      return
    }
    if (result.kind === 'draw') {
      setScore((s) => ({ ...s, draws: s.draws + 1 }))
    } else {
      const winner = result.win.mark
      setScore((s) => ({ ...s, [winner]: s[winner] + 1 }))
    }
    const childLost = vsComputer && result.kind === 'win' && result.win.mark === 'O'
    if (childLost) playWrong()
    else playWin()
    if (result.kind === 'win' && !childLost) celebrate()
    if (vsComputer && activeProfile) {
      const stars = starsFor(opponent, result.kind === 'draw' ? 'draw' : childLost ? 'loss' : 'win')
      if (stars > (activeProfile.tictactoe.stars[0] ?? 0)) setNewStars(stars)
      updateActiveProfile((p) => ({ ...p, tictactoe: recordGame(p.tictactoe, stars) }))
    }
  }

  // The computer's move comes from a timer, so it calls the latest play() through a ref.
  const playRef = useRef(play)
  useEffect(() => {
    playRef.current = play
  })

  useEffect(() => {
    if (!computerTurn || !vsComputer) return
    const t = window.setTimeout(() => playRef.current(computerMove(board, 'O', opponent)), COMPUTER_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [computerTurn, vsComputer, board, opponent])

  function again() {
    setBoard(emptyBoard())
    setStarter((s) => other(s))
    setNewStars(0)
  }

  const winLine: readonly number[] = outcome?.kind === 'win' ? outcome.win.line : []
  let status: string
  if (!outcome) status = computerTurn ? 'Počítač přemýšlí… 🤔' : vsComputer ? 'Jsi na tahu!' : `Na tahu: ${names[toMove]}`
  else if (outcome.kind === 'draw') status = 'Remíza 🤝'
  else if (!vsComputer) status = `Vyhrál ${names[outcome.win.mark]}! 🎉`
  else status = outcome.win.mark === 'X' ? 'Vyhrál jsi! 🎉' : 'Počítač vyhrál 🤖'

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-5">
      <div className="flex items-center gap-3">
        <Link to={BACK_TO} className="rounded-full bg-white px-4 py-2 font-bold shadow-sm transition hover:scale-105">
          ← Zpět
        </Link>
        <h1 className="flex-1 text-xl font-extrabold text-slate-700">
          Piškvorky: {vsComputer ? LEVELS[opponent - 1].title : 'Dva hráči'}
        </h1>
        <MuteButton />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
        <div className="flex items-stretch gap-3">
          <ScoreBox label={names.X} value={score.X} color={MARK_COLORS.X} active={!outcome && toMove === 'X'} />
          <ScoreBox label="Remízy" value={score.draws} color="text-slate-500" active={false} />
          <ScoreBox label={names.O} value={score.O} color={MARK_COLORS.O} active={!outcome && toMove === 'O'} />
        </div>

        <p key={status} className="animate-pop text-2xl font-black" aria-live="polite">
          {status}
        </p>

        <div className="grid w-[min(22rem,85vw)] grid-cols-3 gap-3">
          {board.map((cell, i) => {
            const winning = winLine.includes(i)
            return (
              <button
                key={i}
                type="button"
                aria-label={cell ? `Pole ${i + 1}: ${names[cell]}` : `Pole ${i + 1}`}
                disabled={cell !== null || outcome !== null || computerTurn}
                onClick={() => play(i)}
                className={`grid aspect-square place-items-center rounded-3xl text-6xl font-black shadow-sm transition sm:text-7xl ${
                  winning ? 'animate-pop bg-amber-100 ring-4 ring-amber-300' : 'bg-white'
                } ${cell === null && !outcome && !computerTurn ? 'hover:scale-105 hover:bg-violet-50 active:scale-95' : ''}`}
              >
                {cell && <span className={`animate-pop ${MARK_COLORS[cell]}`}>{MARK_ICONS[cell]}</span>}
              </button>
            )
          })}
        </div>

        {outcome && (
          <div className="flex flex-col items-center gap-4">
            {newStars > 0 && (
              <div className="flex flex-col items-center gap-1">
                <StarRating stars={newStars} size="lg" animated />
                <span className="animate-pop rounded-full bg-amber-100 px-4 py-1 font-extrabold text-amber-700">Nové hvězdy!</span>
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onChangeOpponent}
                className="rounded-2xl bg-slate-100 px-6 py-4 text-lg font-extrabold transition hover:bg-slate-200"
              >
                Změnit soupeře
              </button>
              <button
                type="button"
                autoFocus
                onClick={again}
                className="rounded-2xl bg-violet-600 px-6 py-4 text-lg font-extrabold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 active:scale-95"
              >
                Hrát znovu 🔄
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function ScoreBox({ label, value, color, active }: { label: string; value: number; color: string; active: boolean }) {
  return (
    <div className={`min-w-24 rounded-2xl bg-white px-4 py-2 text-center shadow-sm transition ${active ? 'ring-4 ring-violet-300' : ''}`}>
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`text-3xl font-black tabular-nums ${color}`}>{value}</div>
    </div>
  )
}
