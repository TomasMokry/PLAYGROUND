import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router'
import { playTick } from '../../lib/sound'
import { useProfiles } from '../../profiles/ProfileContext'
import { PauseContext } from './playClock'
import { spendPlayTime } from './reward'
import { formatDuration } from './useSaveRound'

const TICK_MS = 250
/**
 * How often spent time is written to the profile (and on leaving). Kept short because a
 * game opened right after another reads the bank before the previous one saved its last bit.
 */
const SAVE_EVERY_MS = 1000
const WARN_AT_MS = 60_000
/** How long the "one minute left" toast stays. */
const WARN_TOAST_MS = 6000

/**
 * Wraps a fun game: lets the child in only with play time in the bank, counts it
 * down while the game runs (not while hidden or paused), and ends the game when it runs out.
 */
export function PlayTimeGate({ children }: { children: ReactNode }) {
  const { activeProfile, updateActiveProfile } = useProfiles()
  const bankMs = activeProfile?.reward.bankMs ?? 0
  // Decided once on entry; the bank shrinks while playing.
  const [allowed] = useState(bankMs > 0)
  const [left, setLeft] = useState(bankMs)
  const leftRef = useRef(bankMs)
  const pausedRef = useRef(false)
  const unsavedRef = useRef(0)

  const setPaused = useCallback((paused: boolean) => {
    pausedRef.current = paused
  }, [])

  useEffect(() => {
    if (!allowed) return
    const save = () => {
      const ms = unsavedRef.current
      if (ms <= 0) return
      unsavedRef.current = 0
      updateActiveProfile((p) => ({ ...p, reward: spendPlayTime(p.reward, ms) }))
    }
    let last = performance.now()
    let sinceSave = 0
    const id = window.setInterval(() => {
      const now = performance.now()
      const dt = now - last
      last = now
      if (pausedRef.current || document.hidden || leftRef.current <= 0) return
      const before = leftRef.current
      leftRef.current = Math.max(0, before - dt)
      unsavedRef.current += dt
      sinceSave += dt
      if (before > WARN_AT_MS && leftRef.current <= WARN_AT_MS) playTick()
      if (sinceSave >= SAVE_EVERY_MS || leftRef.current === 0) {
        sinceSave = 0
        save()
      }
      setLeft(leftRef.current)
    }, TICK_MS)
    return () => {
      window.clearInterval(id)
      save()
    }
  }, [allowed, updateActiveProfile])

  if (!allowed) return <Navigate to="/zabava" replace />
  if (left <= 0) return <TimeUp />

  const warn = left <= WARN_AT_MS
  return (
    <PauseContext value={setPaused}>
      {children}
      {warn && left > WARN_AT_MS - WARN_TOAST_MS && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-30 flex justify-center">
          <div className="animate-pop rounded-full bg-gradient-to-r from-orange-400 to-rose-500 px-6 py-3 text-xl font-black text-white shadow-lg">
            Ještě 1 minuta! ⏰
          </div>
        </div>
      )}
      <div
        className={`pointer-events-none fixed bottom-4 right-4 z-30 rounded-full px-4 py-2 text-lg font-extrabold tabular-nums shadow-lg ${
          warn ? 'animate-pulse bg-rose-500 text-white' : 'bg-white text-slate-700'
        }`}
        title="Zbývající čas na hraní"
      >
        🎮 {formatDuration(left)}
      </div>
    </PauseContext>
  )
}

function TimeUp() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-6 py-10">
      <div className="flex w-full animate-pop flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-xl">
        <span className="text-7xl">⏰</span>
        <h1 className="text-3xl font-black">Čas na hraní vypršel</h1>
        <p className="font-semibold text-slate-500">
          Dokonči cvičení z matematiky nebo angličtiny bez jediné chyby a získáš další minuty.
        </p>
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link to="/matika" className="flex-1 rounded-2xl bg-violet-600 py-4 text-lg font-extrabold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700">
            🔢 Matematika
          </Link>
          <Link to="/anglictina" className="flex-1 rounded-2xl bg-sky-500 py-4 text-lg font-extrabold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600">
            🇬🇧 Angličtina
          </Link>
        </div>
        <Link to="/" className="font-bold text-slate-400 hover:text-slate-600">
          Domů
        </Link>
      </div>
    </div>
  )
}
