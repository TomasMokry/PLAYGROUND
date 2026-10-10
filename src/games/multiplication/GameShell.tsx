import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { MuteButton } from '../../components/MuteButton'
import { ProgressBar } from '../../components/ProgressBar'
import { streakMultiplier } from './logic'
import type { Flash } from './useRound'

interface Props {
  title: string
  backTo: string
  progress: number
  progressLabel: string
  progressColor?: string
  streak: number
  points: number
  gain: Flash | null
  praise: Flash | null
  children: ReactNode
}

/** Top bar (back, progress, streak, points) plus the praise toast around a game screen. */
export function GameShell({ title, backTo, progress, progressLabel, progressColor, streak, points, gain, praise, children }: Props) {
  const multiplier = streakMultiplier(streak)
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-5">
      <div className="flex items-center gap-3">
        <Link to={backTo} className="rounded-full bg-white px-4 py-2 font-bold shadow-sm transition hover:scale-105">
          ← Zpět
        </Link>
        <h1 className="flex-1 text-xl font-extrabold text-slate-700">{title}</h1>
        <MuteButton />
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="flex-1">
          <ProgressBar value={progress} color={progressColor} />
        </div>
        <span className="min-w-16 text-right font-bold tabular-nums text-slate-500">{progressLabel}</span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div
          key={streak}
          className={`flex items-center gap-2 rounded-full px-4 py-2 font-extrabold shadow-sm transition ${
            streak > 0 ? 'animate-pop bg-orange-100 text-orange-600' : 'bg-white text-slate-400'
          }`}
        >
          🔥 {streak}
          {multiplier > 1 && <span className="rounded-full bg-orange-500 px-2 text-sm text-white">×{multiplier}</span>}
        </div>
        <div className="relative rounded-full bg-white px-4 py-2 font-extrabold shadow-sm">
          <span className="text-amber-400">⭐</span> <span className="tabular-nums">{points}</span>
          {gain && <FloatingText key={gain.id} text={gain.text} />}
        </div>
      </div>

      <main className="relative flex flex-1 flex-col items-center justify-center py-6">
        {praise && <PraiseToast key={praise.id} text={praise.text} />}
        {children}
      </main>
    </div>
  )
}

function FloatingText({ text }: { text: string }) {
  return (
    <span className="pointer-events-none absolute -top-6 right-2 animate-float-up font-black text-emerald-500">
      {text}
    </span>
  )
}

function PraiseToast({ text }: { text: string }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(false), 1800)
    return () => window.clearTimeout(t)
  }, [])
  if (!visible) return null
  return (
    <div className="absolute top-0 z-10 animate-pop rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-xl font-black text-white shadow-lg">
      {text}
    </div>
  )
}
