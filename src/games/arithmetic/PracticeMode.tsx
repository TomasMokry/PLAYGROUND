import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { GameShell } from './GameShell'
import { parseGroups, PRACTICE_COUNT, randomQuestions, requeue, starsByGroup, starsFor, type Question, type QuestionResult } from './logic'
import { groupLabels, type Operation } from './operations'
import { QuestionCard } from './QuestionCard'
import { ResultScreen, type Stat } from './ResultScreen'
import type { Stars } from '../../lib/storage'
import { formatDuration, recordBadges, useSaveRound } from './useSaveRound'
import { useRound } from './useRound'

export default function PracticeMode({ op }: { op: Operation }) {
  const groups = parseGroups(op, useSearchParams()[0].get('g'))
  const [round, setRound] = useState(0)
  if (groups.length === 0) return <Navigate to={op.path} replace />
  return <PracticeGame key={round} op={op} groups={groups} onAgain={() => setRound((r) => r + 1)} />
}

interface QueueItem {
  question: Question
  missed: boolean
}

interface Result {
  stars: Stars
  stats: Stat[]
  badges: string[]
}

function PracticeGame({ op, groups, onAgain }: { op: Operation; groups: number[]; onAgain: () => void }) {
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    randomQuestions(op, groups, PRACTICE_COUNT).map((question) => ({ question, missed: false })),
  )
  const [results, setResults] = useState<QuestionResult[]>([])
  const [turn, setTurn] = useState(0)
  const [startedAt] = useState(() => Date.now())
  const [result, setResult] = useState<Result | null>(null)
  const round = useRound()
  const saveRound = useSaveRound(op.id)

  function next(correct: boolean) {
    setTurn((t) => t + 1)
    const [current, ...rest] = queue
    if (!correct) {
      // Wrong answers come back at the end of the round.
      setQueue(requeue([{ ...current, missed: true }, ...rest]))
      return
    }
    const done = [...results, { question: current.question, firstTry: !current.missed }]
    setResults(done)
    setQueue(rest)
    if (rest.length > 0) return

    const firstTry = done.filter((r) => r.firstTry).length
    const update = saveRound({ points: round.points, bestStreak: round.bestStreak, earnedStars: starsByGroup(done) })
    setResult({
      stars: starsFor(firstTry, done.length),
      badges: recordBadges(update),
      stats: [
        { label: 'Napoprvé správně', value: `${firstTry} / ${done.length}` },
        { label: 'Body', value: round.points },
        { label: 'Nejdelší série', value: `🔥 ${round.bestStreak}` },
        { label: 'Čas', value: formatDuration(Date.now() - startedAt) },
      ],
    })
  }

  return (
    <GameShell
      title={`Trénink: ${groupLabels(op, groups)}`}
      backTo={op.path}
      progress={results.length / PRACTICE_COUNT}
      progressLabel={`${results.length} / ${PRACTICE_COUNT}`}
      progressColor="bg-sky-500"
      streak={round.streak}
      points={round.points}
      gain={round.gain}
      praise={round.praise}
    >
      {result ? (
        <ResultScreen {...result} onAgain={onAgain} backTo={op.path} />
      ) : (
        <>
          {queue[0].missed && <p className="mb-4 font-bold text-amber-600">🔁 Tenhle příklad se vrátil. Zvládneš ho teď?</p>}
          <QuestionCard key={turn} op={op} question={queue[0].question} onAnswer={round.register} onNext={next} />
        </>
      )}
    </GameShell>
  )
}
