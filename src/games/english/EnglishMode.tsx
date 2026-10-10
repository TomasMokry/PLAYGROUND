import { useState } from 'react'
import type { Stars } from '../../lib/storage'
import { GameShell } from '../shared/GameShell'
import { ResultScreen, type Stat } from '../shared/ResultScreen'
import { requeue, starsFor } from '../shared/rules'
import { useRound } from '../shared/useRound'
import { formatDuration, recordBadges, useSaveRound } from '../shared/useSaveRound'
import { ChoiceCard } from './ChoiceCard'
import { choiceRound, roundWords, ROUND_COUNT, type ChoiceQuestion } from './logic'
import { SpellingCard } from './SpellingCard'
import { MODES, type ModeId, type Topic, type Word } from './topics'

export default function EnglishMode({ topic, mode }: { topic: Topic; mode: ModeId }) {
  const [round, setRound] = useState(0)
  return <EnglishGame key={round} topic={topic} mode={mode} onAgain={() => setRound((r) => r + 1)} />
}

interface QueueItem {
  word: Word
  /** Only in the "Vyber" mode. */
  choice?: ChoiceQuestion
  missed: boolean
}

interface Result {
  stars: Stars
  stats: Stat[]
  badges: string[]
}

function newQueue(topic: Topic, mode: ModeId): QueueItem[] {
  return mode === MODES.choose
    ? choiceRound(topic.words).map((choice) => ({ word: choice.word, choice, missed: false }))
    : roundWords(topic.words, ROUND_COUNT).map((word) => ({ word, missed: false }))
}

function EnglishGame({ topic, mode, onAgain }: { topic: Topic; mode: ModeId; onAgain: () => void }) {
  const [queue, setQueue] = useState(() => newQueue(topic, mode))
  const [done, setDone] = useState(0)
  const [firstTry, setFirstTry] = useState(0)
  const [turn, setTurn] = useState(0)
  const [startedAt] = useState(() => Date.now())
  const [result, setResult] = useState<Result | null>(null)
  const round = useRound()
  const saveRound = useSaveRound(topic.id)

  function next(correct: boolean, helped: boolean) {
    setTurn((t) => t + 1)
    const [current, ...rest] = queue
    if (!correct) {
      // Wrong answers come back at the end of the round.
      setQueue(requeue([{ ...current, missed: true }, ...rest]))
      return
    }
    const finished = done + 1
    const right = firstTry + (current.missed || helped ? 0 : 1)
    setDone(finished)
    setFirstTry(right)
    setQueue(rest)
    if (rest.length > 0) return

    const stars = starsFor(right, finished)
    const update = saveRound({ points: round.points, bestStreak: round.bestStreak, earnedStars: new Map([[mode, stars]]) })
    setResult({
      stars,
      badges: recordBadges(update),
      stats: [
        { label: 'Napoprvé správně', value: `${right} / ${finished}` },
        { label: 'Body', value: round.points },
        { label: 'Nejdelší série', value: `🔥 ${round.bestStreak}` },
        { label: 'Čas', value: formatDuration(Date.now() - startedAt) },
      ],
    })
  }

  const current = queue[0]
  return (
    <GameShell
      title={`${topic.title}: ${mode === MODES.choose ? 'Vyber' : 'Napiš'}`}
      backTo={topic.path}
      progress={done / ROUND_COUNT}
      progressLabel={`${done} / ${ROUND_COUNT}`}
      progressColor={mode === MODES.choose ? 'bg-sky-500' : 'bg-pink-500'}
      streak={round.streak}
      points={round.points}
      gain={round.gain}
      praise={round.praise}
    >
      {result ? (
        <ResultScreen {...result} onAgain={onAgain} backTo={topic.path} />
      ) : (
        <>
          {current.missed && <p className="mb-4 font-bold text-amber-600">🔁 Tohle se vrátilo. Zvládneš to teď?</p>}
          {current.choice ? (
            <ChoiceCard key={turn} topic={topic} question={current.choice} onAnswer={round.register} onNext={next} />
          ) : (
            <SpellingCard key={turn} word={current.word} onAnswer={round.register} onNext={next} />
          )}
        </>
      )}
    </GameShell>
  )
}
