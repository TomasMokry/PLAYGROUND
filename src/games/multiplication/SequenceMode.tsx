import { useState } from 'react'
import { Navigate, useParams } from 'react-router'
import type { Stars } from '../../lib/storage'
import { GameShell } from './GameShell'
import { sequenceQuestions, starsByTable, TABLES } from './logic'
import { QuestionCard } from './QuestionCard'
import { ResultScreen, type Stat } from './ResultScreen'
import { formatDuration, recordBadges, useSaveRound } from './useSaveRound'
import { useRound } from './useRound'

export default function SequenceMode() {
  const table = Number(useParams().table)
  const [round, setRound] = useState(0)
  if (!TABLES.includes(table as (typeof TABLES)[number])) return <Navigate to="/nasobilka" replace />
  return <SequenceGame key={round} table={table} onAgain={() => setRound((r) => r + 1)} />
}

interface Result {
  stars: Stars
  stats: Stat[]
  badges: string[]
}

function SequenceGame({ table, onAgain }: { table: number; onAgain: () => void }) {
  const [questions] = useState(() => sequenceQuestions(table))
  const [startedAt] = useState(() => Date.now())
  const [index, setIndex] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [missed, setMissed] = useState<ReadonlySet<number>>(new Set())
  const [result, setResult] = useState<Result | null>(null)
  const round = useRound()
  const saveRound = useSaveRound()

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
    const earnedStars = starsByTable(results)
    const update = saveRound({ points: round.points, bestStreak: round.bestStreak, earnedStars })
    setResult({
      stars: earnedStars.get(table) ?? 0,
      badges: recordBadges(update),
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
      title={`Řada násobilky ${table}`}
      backTo="/nasobilka"
      progress={done ? 1 : index / questions.length}
      progressLabel={`${done ? questions.length : index} / ${questions.length}`}
      streak={round.streak}
      points={round.points}
      gain={round.gain}
      praise={round.praise}
    >
      {result ? (
        <ResultScreen {...result} onAgain={onAgain} backTo="/nasobilka" />
      ) : (
        <div className="grid w-full items-center gap-8 md:grid-cols-[14rem_1fr]">
          <Ladder questions={questions} index={index} missed={missed} />
          <QuestionCard key={`${index}-${attempt}`} question={questions[index]} onAnswer={round.register} onNext={next} />
        </div>
      )}
    </GameShell>
  )
}

/** The growing list 1 × t = t, 2 × t = 2t, … so the pattern of the table is visible. */
function Ladder({ questions, index, missed }: { questions: ReturnType<typeof sequenceQuestions>; index: number; missed: ReadonlySet<number> }) {
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
              {q.factor} × {q.table} =
            </span>
            <span>{i < index ? q.answer : i === index ? '?' : '…'}</span>
          </li>
        )
      })}
    </ol>
  )
}
