import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { StarRating } from '../../components/StarRating'
import { celebrate } from '../../lib/confetti'
import { playWin } from '../../lib/sound'
import type { Stars } from '../../lib/storage'
import { minutesOf, type RewardOutcome } from './reward'

export interface Stat {
  label: string
  value: string | number
}

interface Props {
  stars: Stars
  stats: Stat[]
  /** Highlights such as "Nový rekord!". */
  badges?: string[]
  onAgain: () => void
  backTo: string
  /** Play time earned by a learning round; leave out for games that don't earn any. */
  reward?: RewardOutcome | 'notPerfect'
}

const HEADLINES: Record<Stars, string> = {
  0: 'Dobrý pokus! Zkus to znovu 💪',
  1: 'Dobrá práce! 👍',
  2: 'Výborně! 🎉',
  3: 'Perfektní! Jsi mistr! 🏆',
}

export function ResultScreen({ stars, stats, badges = [], onAgain, backTo, reward }: Props) {
  const celebrated = useRef(false)

  useEffect(() => {
    if (celebrated.current) return
    celebrated.current = true
    const earned = typeof reward === 'object' && reward.kind === 'earned'
    if (stars > 0 || badges.length > 0 || earned) playWin()
    if (stars === 3 || badges.length > 0 || earned) celebrate()
  }, [stars, badges.length, reward])

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl bg-white p-8 text-center shadow-xl">
      <StarRating stars={stars} size="lg" animated />
      <h2 className="text-3xl font-black">{HEADLINES[stars]}</h2>

      {badges.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {badges.map((b) => (
            <span key={b} className="animate-pop rounded-full bg-amber-100 px-4 py-1 font-extrabold text-amber-700">
              {b}
            </span>
          ))}
        </div>
      )}

      {reward && <RewardBanner reward={reward} />}

      <dl className="grid w-full grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-slate-50 p-3">
            <dt className="text-sm font-semibold text-slate-500">{s.label}</dt>
            <dd className="text-2xl font-black tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex w-full gap-3">
        <Link to={backTo} className="flex-1 rounded-2xl bg-slate-100 py-4 text-lg font-extrabold transition hover:bg-slate-200">
          Zpět
        </Link>
        <button
          type="button"
          autoFocus
          onClick={onAgain}
          className="flex-1 rounded-2xl bg-violet-600 py-4 text-lg font-extrabold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 active:scale-95"
        >
          Znovu 🔄
        </button>
      </div>
    </div>
  )
}

function RewardBanner({ reward }: { reward: RewardOutcome | 'notPerfect' }) {
  if (reward === 'notPerfect') {
    return <p className="font-bold text-slate-500">Bez jediné chyby získáš čas na hraní 🎮</p>
  }
  if (reward.kind === 'earned') {
    return (
      <div className="flex w-full animate-pop flex-col items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-400 to-orange-400 p-4 text-white shadow-lg">
        <p className="text-xl font-black">🎮 Získal jsi {minutesOf(reward.ms)} minut hraní!</p>
        <p className="font-semibold text-white/90">V bance máš {minutesOf(reward.bankMs)} min</p>
        <Link to="/zabava" className="rounded-full bg-white px-5 py-2 font-extrabold text-rose-500 shadow-sm transition hover:scale-105">
          Jít hrát →
        </Link>
      </div>
    )
  }
  return (
    <p className="rounded-2xl bg-sky-50 px-4 py-3 font-bold text-sky-700">
      {reward.kind === 'already'
        ? 'Bez chyby! 👏 Za tohle cvičení už jsi dnes čas na hraní dostal. Zkus jiné! 💡'
        : 'Bez chyby! 👏 Banka hraní je plná. Nejdřív si zahraj 🎮'}
    </p>
  )
}
