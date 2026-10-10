import { useEffect, useRef, useState } from 'react'
import { speak } from '../../lib/sound'
import type { ChoiceQuestion } from './logic'
import { SpeakButton } from './SpeakButton'
import type { Topic, Word } from './topics'
import { WordPicture } from './WordPicture'

interface Props {
  topic: Topic
  question: ChoiceQuestion
  /** Called right when an option is picked (sounds, streak, score). */
  onAnswer: (correct: boolean) => void
  /** Called after the feedback has been shown; the parent moves on. */
  onNext: (correct: boolean, helped: boolean) => void
}

const CORRECT_DELAY_MS = 900
const WRONG_DELAY_MS = 2200

/** Picture → pick the word, or word → pick the picture. Remount (via `key`) for each new question. */
export function ChoiceCard({ topic, question, onAnswer, onNext }: Props) {
  const { word, direction, options } = question
  const [picked, setPicked] = useState<Word | null>(null)
  const timer = useRef<number | undefined>(undefined)
  // The parent re-renders after onAnswer (new points/streak); call the latest onNext, not a stale one.
  const onNextRef = useRef(onNext)

  useEffect(() => {
    onNextRef.current = onNext
  })
  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    if (direction === 'fromEnglish') speak(word.en)
  }, [direction, word])

  function choose(option: Word) {
    if (picked) return
    const correct = option === word
    setPicked(option)
    onAnswer(correct)
    speak(word.en)
    timer.current = window.setTimeout(() => onNextRef.current(correct, false), correct ? CORRECT_DELAY_MS : WRONG_DELAY_MS)
  }

  function optionStyle(option: Word) {
    if (!picked) return 'border-transparent bg-white hover:-translate-y-1 hover:shadow-lg'
    if (option === word) return 'border-emerald-400 bg-emerald-50 animate-pop'
    if (option === picked) return 'border-rose-400 bg-rose-50 animate-shake'
    return 'border-transparent bg-white opacity-40'
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {direction === 'toEnglish' ? (
        <>
          <p className="text-2xl font-bold text-slate-500">Jak se to řekne anglicky?</p>
          <WordPicture word={word} size="lg" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-slate-500">{topic.text.whichIs}</p>
          <div className="flex items-center gap-3">
            <span className="text-6xl font-black text-violet-600">{word.en}</span>
            <SpeakButton text={word.en} />
          </div>
        </>
      )}

      <div className="grid w-full max-w-lg grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.en}
            type="button"
            disabled={picked !== null}
            onClick={() => choose(option)}
            className={`grid min-h-28 place-items-center rounded-3xl border-4 p-4 shadow-sm transition ${optionStyle(option)}`}
          >
            {direction === 'toEnglish' ? (
              <span className="text-3xl font-black">{option.en}</span>
            ) : (
              <WordPicture word={option} size="md" />
            )}
          </button>
        ))}
      </div>

      <div className="h-8 text-xl font-bold" aria-live="polite">
        {picked === word && (
          <span className="text-emerald-600">
            Správně! ✅ {word.en} = {word.cs}
          </span>
        )}
        {picked && picked !== word && (
          <span className="text-rose-600">
            Skoro! Správně je <b>{word.en}</b> ({word.cs})
          </span>
        )}
      </div>
    </div>
  )
}
