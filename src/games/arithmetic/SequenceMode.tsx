import { useState } from 'react'
import { Navigate, useParams } from 'react-router'
import type { Stars } from '../../lib/storage'
import { GameShell } from '../shared/GameShell'
import { starsByGroup, type Question } from './logic'
import { playableGroups, type Operation } from './operations'
import { QuestionCard } from './QuestionCard'
import { ResultScreen, type Stat } from '../shared/ResultScreen'
import { exerciseKey, type RewardOutcome } from '../shared/reward'
import { formatDuration, recordBadges, useSaveRound } from '../shared/useSaveRound'
import { useRound } from '../shared/useRound'

export default function SequenceMode({ op }: { op: Operation }) {
  const group = Number(useParams().group)
  const [round, setRound] = useState(0)
  if (!op.sequence || !playableGroups(op).some((g) => g.id === group)) return <Navigate to={op.path} replace />
  return <SequenceGame key={round} op={op} sequence={op.sequence} group={group} onAgain={() => setRound((r) => r + 1)} />
}

interface Result {
  stars: Stars
  stats: Stat[]
  badges: string[]
  reward?: RewardOutcome | 'notPerfect'
}

interface GameProps {
  op: Operation
  sequence: NonNullable<Operation['sequence']>
  group: number
  onAgain: () => void
}

function SequenceGame({ op, sequence, group, onAgain }: GameProps) {
  const [questions] = useState(() => sequence.questions(group))
  const [startedAt] = useState(() => Date.now())
  const [index, setIndex] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [missed, setMissed] = useState<ReadonlySet<number>>(new Set())
  const [result, setResult] = useState<Result | null>(null)
  const round = useRound()
  const saveRound = useSaveRound(op.id)

  function next(correct: boolean) {
    if (!correct) {
      // Ask the same question again so the right answer gets typed once.
      setMissed((m) => new Set(m).add(index))
      setAttempt((a) => a + 1)
      return
    }
    if (index + 1 < questions.length) {
      setIndex(index + 1)
      setAttempt(0)
      return
    }
    const results = questions.map((question, i) => ({ question, firstTry: !missed.has(i) }))
    const earnedStars = starsByGroup(results)
    const update = saveRound({
      points: round.points,
      bestStreak: round.bestStreak,
      earnedStars,
      rewardKey: missed.size === 0 ? exerciseKey(op.id, 'sequence', [group]) : undefined,
    })
    setResult({
      stars: earnedStars.get(group) ?? 0,
      badges: recordBadges(update),
      reward: update?.reward,
      stats: [
        { label: 'Napoprvé správně', value: `${questions.length - missed.size} / ${questions.length}` },
        { label: 'Body', value: round.points },
        { label: 'Nejdelší série', value: `🔥 ${round.bestStreak}` },
        { label: 'Čas', value: formatDuration(Date.now() - startedAt) },
      ],
    })
  }

  const done = result !== null
  return (
    <GameShell
      title={sequence.title(group)}
      backTo={op.path}
      progress={done ? 1 : index / questions.length}
      progressLabel={`${done ? questions.length : index} / ${questions.length}`}
      streak={round.streak}
      points={round.points}
      gain={round.gain}
      praise={round.praise}
    >
      {result ? (
        <ResultScreen {...result} onAgain={onAgain} backTo={op.path} />
      ) : (
        <div className="grid w-full items-center gap-8 md:grid-cols-[14rem_1fr]">
          <Ladder op={op} questions={questions} index={index} missed={missed} />
          <QuestionCard key={`${index}-${attempt}`} op={op} question={questions[index]} onAnswer={round.register} onNext={next} />
        </div>
      )}
    </GameShell>
  )
}

interface LadderProps {
  op: Operation
  questions: readonly Question[]
  index: number
  missed: ReadonlySet<number>
}

/** The growing list (1 × t, 2 × t … or t : t, 2t : t …) so the pattern of the table is visible. */
function Ladder({ op, questions, index, missed }: LadderProps) {
  return (
    <ol className="flex flex-col gap-1 rounded-3xl bg-white p-4 text-lg font-bold tabular-nums shadow-sm">
      {questions.map((q, i) => {
        const state = i < index ? (missed.has(i) ? 'missed' : 'done') : i === index ? 'current' : 'todo'
        const style = {
          done: 'text-emerald-600',
          missed: 'text-amber-600',
          current: 'bg-violet-100 text-violet-700 scale-105',
          todo: 'text-slate-300',
        }[state]
        return (
          <li key={i} className={`flex justify-between rounded-xl px-3 py-0.5 transition ${style}`}>
            <span>
              {q.left} {op.symbol} {q.right} =
            </span>
            <span>{i < index ? q.answer : i === index ? '?' : '…'}</span>
          </li>
        )
      })}
    </ol>
  )
}
