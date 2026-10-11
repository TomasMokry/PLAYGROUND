import { useEffect, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { playTick } from '../../lib/sound'
import type { Stars } from '../../lib/storage'
import { useActiveProfile } from '../../profiles/ProfileContext'
import { GameShell } from '../shared/GameShell'
import { parseGroups, randomQuestion, TIME_ATTACK_SECONDS, timeAttackStars } from './logic'
import { groupLabels, type Operation } from './operations'
import { QuestionCard } from './QuestionCard'
import { ResultScreen, type Stat } from '../shared/ResultScreen'
import { exerciseKey, isPerfectTimeAttack, type RewardOutcome } from '../shared/reward'
import { recordBadges, useSaveRound } from '../shared/useSaveRound'
import { useRound } from '../shared/useRound'

export default function TimeAttackMode({ op }: { op: Operation }) {
  const groups = parseGroups(op, useSearchParams()[0].get('g'))
  const [round, setRound] = useState(0)
  if (groups.length === 0) return <Navigate to={op.path} replace />
  return <TimeAttackGame key={round} op={op} groups={groups} onAgain={() => setRound((r) => r + 1)} />
}

const DURATION_MS = TIME_ATTACK_SECONDS * 1000
const COUNTDOWN_FROM = 3

type Phase = 'countdown' | 'playing' | 'done'

interface Result {
  stars: Stars
  stats: Stat[]
  badges: string[]
  reward?: RewardOutcome | 'notPerfect'
}

function TimeAttackGame({ op, groups, onAgain }: { op: Operation; groups: number[]; onAgain: () => void }) {
  const profile = useActiveProfile()
  const [phase, setPhase] = useState<Phase>('countdown')
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM)
  const [endsAt, setEndsAt] = useState(0)
  const [remaining, setRemaining] = useState(DURATION_MS)
  const [question, setQuestion] = useState(() => randomQuestion(op, groups))
  const [turn, setTurn] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const round = useRound()
  const saveRound = useSaveRound(op.id)

  // 3, 2, 1, Start! … then start the clock.
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown > 0) playTick()
    const t = window.setTimeout(() => {
      if (countdown > 0) {
        setCountdown(countdown - 1)
      } else {
        setEndsAt(Date.now() + DURATION_MS)
        setPhase('playing')
      }
    }, 800)
    return () => window.clearTimeout(t)
  }, [phase, countdown])

  function finish() {
    setPhase('done')
    const update = saveRound({
      points: round.points,
      bestStreak: round.bestStreak,
      timeAttackScore: correct,
      rewardKey: isPerfectTimeAttack(correct, wrong) ? exerciseKey(op.id, 'timeattack', groups) : undefined,
    })
    setResult({
      stars: timeAttackStars(correct),
      badges: recordBadges(update),
      reward: update?.reward,
      stats: [
        { label: 'Správně', value: `✅ ${correct}` },
        { label: 'Chyby', value: `❌ ${wrong}` },
        { label: 'Body', value: round.points },
        { label: 'Nejdelší série', value: `🔥 ${round.bestStreak}` },
      ],
    })
  }

  // The interval outlives renders, so it calls the latest finish() through a ref.
  const finishRef = useRef(finish)
  useEffect(() => {
    finishRef.current = finish
  })

  useEffect(() => {
    if (phase !== 'playing') return
    let lastSecond = TIME_ATTACK_SECONDS
    const id = window.setInterval(() => {
      const left = Math.max(0, endsAt - Date.now())
      setRemaining(left)
      if (left === 0) {
        window.clearInterval(id)
        finishRef.current()
        return
      }
      const second = Math.ceil(left / 1000)
      if (second < lastSecond) {
        lastSecond = second
        if (second <= 5) playTick()
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [phase, endsAt])

  function answer(isCorrect: boolean) {
    round.register(isCorrect)
    if (isCorrect) setCorrect((c) => c + 1)
    else setWrong((w) => w + 1)
  }

  function next() {
    setQuestion((q) => randomQuestion(op, groups, q))
    setTurn((t) => t + 1)
  }

  const seconds = Math.ceil(remaining / 1000)
  return (
    <GameShell
      title={`Závod s časem: ${groupLabels(op, groups)}`}
      backTo={op.path}
      progress={remaining / DURATION_MS}
      progressLabel={`${seconds} s`}
      progressColor={seconds <= 10 ? 'bg-rose-500' : 'bg-amber-400'}
      streak={round.streak}
      points={round.points}
      gain={round.gain}
      praise={round.praise}
    >
      {result ? (
        <ResultScreen {...result} onAgain={onAgain} backTo={op.path} />
      ) : phase === 'countdown' ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-2xl font-bold text-slate-500">Připrav se!</p>
          <div key={countdown} className="animate-pop text-9xl font-black text-amber-500">
            {countdown || 'Start!'}
          </div>
          <p className="font-semibold text-slate-400">Tvůj rekord: {profile[op.id].timeAttackBest}</p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-6 text-lg font-extrabold">
            <span className={`text-4xl tabular-nums ${seconds <= 10 ? 'animate-pulse text-rose-500' : 'text-amber-500'}`}>⏱️ {seconds}</span>
            <span className="text-emerald-600">✅ {correct}</span>
            <span className="text-slate-400">Rekord: {profile[op.id].timeAttackBest}</span>
          </div>
          <QuestionCard key={turn} op={op} question={question} onAnswer={answer} onNext={next} correctDelayMs={350} wrongDelayMs={1200} />
        </>
      )}
    </GameShell>
  )
}
