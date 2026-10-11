import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { MuteButton } from '../../components/MuteButton'
import { smallBurst } from '../../lib/confetti'
import { playCorrect, playStreak, playWrong } from '../../lib/sound'
import { useProfiles } from '../../profiles/ProfileContext'
import { ResultScreen, type Stat } from '../shared/ResultScreen'
import {
  type Action,
  type Cell,
  COLS,
  dropInterval,
  dropPosition,
  levelFor,
  newGame,
  type PieceType,
  pieceCells,
  recordGame,
  reduce,
  shapeCells,
  starsForLines,
} from './logic'

const BACK_TO = '/zabava'

export default function TetrisMode() {
  const [round, setRound] = useState(0)
  return <TetrisGame key={round} onAgain={() => setRound((r) => r + 1)} />
}

const COLORS: Record<PieceType, string> = {
  I: 'bg-cyan-400',
  O: 'bg-yellow-300',
  T: 'bg-purple-500',
  S: 'bg-green-500',
  Z: 'bg-red-500',
  J: 'bg-blue-500',
  L: 'bg-orange-400',
}

const BLOCK = 'rounded-[3px] shadow-[inset_0_-3px_0_rgba(0,0,0,0.25),inset_0_2px_0_rgba(255,255,255,0.35)]'

const KEYS: Record<string, Action> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'rotate',
  x: 'rotate',
  ArrowDown: 'softDrop',
  ' ': 'hardDrop',
}

type Phase = 'ready' | 'playing' | 'paused'

interface Result {
  stars: ReturnType<typeof starsForLines>
  stats: Stat[]
  badges: string[]
}

function TetrisGame({ onAgain }: { onAgain: () => void }) {
  const { activeProfile, updateActiveProfile } = useProfiles()
  const [state, dispatch] = useReducer(reduce, undefined, () => newGame())
  const [phase, setPhase] = useState<Phase>('ready')
  const [result, setResult] = useState<Result | null>(null)
  const best = activeProfile?.tetris.bestScore ?? 0
  const playing = phase === 'playing' && !state.over

  // Gravity: the piece falls one row per interval, faster on higher levels.
  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => dispatch('tick'), dropInterval(state.level))
    return () => window.clearInterval(id)
  }, [playing, state.level])

  useEffect(() => {
    if (phase === 'ready' || state.over) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'p' || e.key === 'Escape') {
        e.preventDefault()
        setPhase((p) => (p === 'paused' ? 'playing' : 'paused'))
        return
      }
      const action = KEYS[e.key]
      if (!action || phase !== 'playing') return
      e.preventDefault()
      dispatch(action)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, state.over])

  // Pause when the child switches to another tab or app.
  useEffect(() => {
    const onHide = () => document.hidden && setPhase((p) => (p === 'playing' ? 'paused' : p))
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  // Sounds for cleared lines; a Tetris (4 lines at once) gets confetti too.
  useEffect(() => {
    if (state.locks === 0 || state.over || state.lastCleared === 0) return
    if (state.lastCleared === 4) {
      playStreak()
      smallBurst()
    } else {
      playCorrect()
    }
  }, [state.locks, state.lastCleared, state.over])
  const leveledUp = state.lastCleared > 0 && levelFor(state.lines - state.lastCleared) < state.level
  const toast = state.over ? null : state.lastCleared === 4 ? 'TETRIS! 🎉' : leveledUp ? `Úroveň ${state.level}! 🚀` : null

  // Game over: save once and show the results.
  const saved = useRef(false)
  useEffect(() => {
    if (!state.over || saved.current || !activeProfile) return
    saved.current = true
    const outcome = { score: state.score, lines: state.lines }
    const { newBestScore } = recordGame(activeProfile.tetris, outcome)
    updateActiveProfile((p) => ({ ...p, tetris: recordGame(p.tetris, outcome).progress }))
    const stars = starsForLines(state.lines)
    if (stars === 0 && !newBestScore) playWrong()
    setResult({
      stars,
      badges: newBestScore ? ['🏅 Nový rekord!'] : [],
      stats: [
        { label: 'Skóre', value: `⭐ ${state.score}` },
        { label: 'Řady', value: `🧱 ${state.lines}` },
        { label: 'Úroveň', value: `🚀 ${state.level}` },
        { label: 'Rekord', value: `🏅 ${Math.max(best, state.score)}` },
      ],
    })
  }, [state.over, state.score, state.lines, state.level, activeProfile, updateActiveProfile, best])

  // What to draw: the settled blocks, the ghost where the piece will land, and the piece itself.
  const cells: (Cell | 'ghost')[][] = state.board.map((row) => [...row])
  if (!state.over) {
    for (const [x, y] of pieceCells(dropPosition(state.board, state.piece))) if (y >= 0) cells[y][x] = 'ghost'
  }
  for (const [x, y] of pieceCells(state.piece)) if (y >= 0) cells[y][x] = state.piece.type

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-5">
      <div className="flex items-center gap-3">
        <Link to={BACK_TO} className="rounded-full bg-white px-4 py-2 font-bold shadow-sm transition hover:scale-105">
          ← Zpět
        </Link>
        <h1 className="flex-1 text-xl font-extrabold text-slate-700">Tetris 🧱</h1>
        <MuteButton />
      </div>

      <main className="relative flex flex-1 flex-col items-center justify-center py-4">
        {toast && <Toast key={state.locks} text={toast} />}
        {result ? (
          <ResultScreen {...result} onAgain={onAgain} backTo={BACK_TO} />
        ) : (
          <>
            <div className="flex items-start gap-4">
              <div className="relative rounded-2xl bg-slate-800 p-1.5 shadow-xl">
                <div className="grid aspect-[1/2] w-[min(18rem,calc(50dvh-8rem))] min-w-40 grid-cols-10 gap-px">
                  {cells.flatMap((row, y) =>
                    row.map((cell, x) => (
                      <div
                        key={y * COLS + x}
                        className={
                          cell === 'ghost'
                            ? 'rounded-[3px] bg-white/10 ring-1 ring-inset ring-white/40'
                            : cell
                              ? `${COLORS[cell]} ${BLOCK}`
                              : 'rounded-[2px] bg-slate-700/60'
                        }
                      />
                    )),
                  )}
                </div>
                {phase !== 'playing' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-slate-900/70 p-4 text-center text-white">
                    {phase === 'ready' ? (
                      <>
                        <p className="text-2xl font-black">Skládej kostky!</p>
                        <p className="text-sm font-semibold text-white/80">Zaplň celou řadu a zmizí.</p>
                      </>
                    ) : (
                      <p className="text-3xl font-black">Pauza ⏸️</p>
                    )}
                    <button
                      type="button"
                      autoFocus
                      onClick={() => setPhase('playing')}
                      className="rounded-2xl bg-violet-600 px-8 py-3 text-lg font-extrabold shadow-lg transition hover:bg-violet-700 active:scale-95"
                    >
                      {phase === 'ready' ? 'Hrát ▶' : 'Pokračovat ▶'}
                    </button>
                  </div>
                )}
              </div>

              <aside className="flex w-28 flex-col gap-3 sm:w-36">
                <SidePanel label="Další">
                  <NextPiece type={state.queue[0]} />
                </SidePanel>
                <SidePanel label="Skóre">
                  <span className="text-2xl font-black tabular-nums">{state.score}</span>
                </SidePanel>
                <SidePanel label="Řady">
                  <span className="text-2xl font-black tabular-nums">{state.lines}</span>
                </SidePanel>
                <SidePanel label="Úroveň">
                  <span key={state.level} className="animate-pop text-2xl font-black tabular-nums">{state.level}</span>
                </SidePanel>
                <SidePanel label="Rekord">
                  <span className="text-xl font-black tabular-nums text-slate-500">{best}</span>
                </SidePanel>
                {phase !== 'ready' && (
                  <button
                    type="button"
                    onClick={() => setPhase((p) => (p === 'paused' ? 'playing' : 'paused'))}
                    className="rounded-2xl bg-white py-2 font-extrabold shadow-sm transition hover:bg-slate-50 active:scale-95"
                  >
                    {phase === 'paused' ? '▶ Hrát' : '⏸️ Pauza'}
                  </button>
                )}
              </aside>
            </div>

            <div className="mt-4 flex gap-2 select-none" aria-label="Ovládání">
              <ControlButton label="Doleva" onPress={() => dispatch('left')} disabled={!playing}>⬅️</ControlButton>
              <ControlButton label="Otočit" onPress={() => dispatch('rotate')} disabled={!playing}>🔄</ControlButton>
              <ControlButton label="Doprava" onPress={() => dispatch('right')} disabled={!playing}>➡️</ControlButton>
              <ControlButton label="Dolů" onPress={() => dispatch('softDrop')} disabled={!playing}>⬇️</ControlButton>
              <ControlButton label="Shodit" onPress={() => dispatch('hardDrop')} disabled={!playing}>⏬</ControlButton>
            </div>
            <p className="mt-3 hidden text-sm font-semibold text-slate-400 sm:block">
              Šipky ← → posun · ↑ otočit · ↓ dolů · mezerník shodit · P pauza
            </p>
          </>
        )}
      </main>
    </div>
  )
}

function SidePanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function NextPiece({ type }: { type: PieceType }) {
  const cells = shapeCells(type)
  const minX = Math.min(...cells.map(([x]) => x))
  const minY = Math.min(...cells.map(([, y]) => y))
  const filled = new Set(cells.map(([x, y]) => `${x - minX},${y - minY}`))
  return (
    <div className="mx-auto grid w-16 grid-cols-4 gap-px">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className={`aspect-square ${filled.has(`${i % 4},${Math.floor(i / 4)}`) ? `${COLORS[type]} ${BLOCK}` : ''}`} />
      ))}
    </div>
  )
}

/** Big touch button. Reacts on pointer down so taps feel instant. */
function ControlButton({ label, onPress, disabled, children }: { label: string; onPress: () => void; disabled: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault()
        onPress()
      }}
      className="grid size-14 touch-none place-items-center rounded-2xl bg-white text-2xl shadow-sm transition active:scale-90 disabled:opacity-40 sm:size-16"
    >
      {children}
    </button>
  )
}

function Toast({ text }: { text: string }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(false), 1500)
    return () => window.clearTimeout(t)
  }, [])
  if (!visible) return null
  return (
    <div className="pointer-events-none absolute top-0 z-10 animate-pop rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-xl font-black text-white shadow-lg">
      {text}
    </div>
  )
}
