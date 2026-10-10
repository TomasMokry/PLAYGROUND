import { useEffect, useRef, useState, type FormEvent } from 'react'
import { LetterPad } from '../../components/LetterPad'
import { speak } from '../../lib/sound'
import { cleanTyping, isCorrectSpelling, lettersLabel, MAX_LETTERS, nextHint } from './logic'
import type { Word } from './topics'
import { WordPicture } from './WordPicture'

type Status = 'idle' | 'correct' | 'wrong'

interface Props {
  word: Word
  /** Called right when the answer is checked (sounds, streak, score). */
  onAnswer: (correct: boolean) => void
  /** Called after the feedback has been shown; `helped` = a hint was used. */
  onNext: (correct: boolean, helped: boolean) => void
}

const CORRECT_DELAY_MS = 900
const WRONG_DELAY_MS = 2500

/** Shows a picture and collects the English word for it. Remount (via `key`) for each new word. */
export function SpellingCard({ word, onAnswer, onNext }: Props) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [helped, setHelped] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | undefined>(undefined)
  // The parent re-renders after onAnswer (new points/streak); call the latest onNext, not a stale one.
  const onNextRef = useRef(onNext)

  useEffect(() => {
    onNextRef.current = onNext
  })
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const locked = status !== 'idle'

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (locked || value === '') return
    const correct = isCorrectSpelling(word, value)
    setStatus(correct ? 'correct' : 'wrong')
    onAnswer(correct)
    speak(word.en)
    timer.current = window.setTimeout(() => onNextRef.current(correct, helped), correct ? CORRECT_DELAY_MS : WRONG_DELAY_MS)
  }

  function hint() {
    if (locked) return
    setValue((v) => nextHint(word, v))
    setHelped(true)
  }

  const box = {
    idle: 'border-violet-300 bg-violet-50 text-violet-700',
    correct: 'border-emerald-400 bg-emerald-100 text-emerald-700 animate-pop',
    wrong: 'border-rose-400 bg-rose-100 text-rose-600 animate-shake',
  }[status]

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="text-2xl font-bold text-slate-500">Napiš anglicky:</p>
      <WordPicture word={word} size="lg" />
      <p className="font-bold text-slate-400">česky: {word.cs}</p>

      <form onSubmit={submit} className="flex flex-col items-center gap-3">
        <input
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(e) => !locked && setValue(cleanTyping(e.target.value))}
          onBlur={() => !locked && inputRef.current?.focus()}
          maxLength={MAX_LETTERS}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="?"
          aria-label="Anglické slovo"
          readOnly={locked}
          className={`w-[8ch] rounded-2xl border-4 px-3 py-1 text-center text-5xl font-black tracking-wider outline-none transition placeholder:text-violet-300 ${box}`}
        />
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white px-3 py-1 font-bold text-slate-500 shadow-sm">🔤 {lettersLabel(word.en.length)}</span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={hint}
            disabled={locked || value === word.en}
            className="rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-700 transition hover:bg-amber-200 disabled:opacity-40"
          >
            💡 Nápověda
          </button>
        </div>
      </form>

      <div className="h-8 text-xl font-bold" aria-live="polite">
        {status === 'correct' && <span className="text-emerald-600">Správně! ✅</span>}
        {status === 'wrong' && (
          <span className="text-rose-600">
            Skoro! Správně je <b>{word.en}</b>
          </span>
        )}
      </div>

      <LetterPad
        disabled={locked}
        onLetter={(l) => !locked && setValue((v) => cleanTyping(v + l))}
        onBackspace={() => !locked && setValue((v) => v.slice(0, -1))}
        onSubmit={() => submit()}
      />
    </div>
  )
}
