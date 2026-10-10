import { useEffect, useRef, useState, type FormEvent } from 'react'
import { NumPad } from '../../components/NumPad'
import type { Question } from './logic'
import type { Operation } from './operations'

type Status = 'idle' | 'correct' | 'wrong'

interface Props {
  op: Operation
  question: Question
  /** Called right when the answer is checked (sounds, streak, score). */
  onAnswer: (correct: boolean) => void
  /** Called after the feedback has been shown; the parent moves on. */
  onNext: (correct: boolean) => void
  correctDelayMs?: number
  wrongDelayMs?: number
}

const MAX_DIGITS = 3

/** Shows `a ∘ b = ?` and collects a typed answer. Remount (via `key`) for each new question. */
export function QuestionCard({ op, question, onAnswer, onNext, correctDelayMs = 600, wrongDelayMs = 1800 }: Props) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<Status>('idle')
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
    const correct = Number(value) === question.answer
    setStatus(correct ? 'correct' : 'wrong')
    onAnswer(correct)
    timer.current = window.setTimeout(() => onNextRef.current(correct), correct ? correctDelayMs : wrongDelayMs)
  }

  const append = (digit: string) => {
    if (!locked) setValue((v) => (v.length < MAX_DIGITS ? (v === '0' ? digit : v + digit) : v))
  }

  const box = {
    idle: 'border-violet-300 bg-violet-50 text-violet-700',
    correct: 'border-emerald-400 bg-emerald-100 text-emerald-700 animate-pop',
    wrong: 'border-rose-400 bg-rose-100 text-rose-600 animate-shake',
  }[status]

  return (
    <div className="flex flex-col items-center gap-6">
      <form
        onSubmit={submit}
        className={`flex items-center gap-3 font-black tabular-nums sm:text-7xl ${question.left >= 100 ? 'text-5xl' : 'text-6xl'}`}
      >
        <span>{question.left}</span>
        <span className={op.style.symbol}>{op.symbol}</span>
        <span>{question.right}</span>
        <span className="text-slate-400">=</span>
        <input
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(e) => !locked && setValue(e.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS))}
          onBlur={() => !locked && inputRef.current?.focus()}
          inputMode="numeric"
          autoComplete="off"
          placeholder="?"
          aria-label="Odpověď"
          readOnly={locked}
          className={`w-[3.2ch] rounded-2xl border-4 text-center outline-none transition placeholder:text-violet-300 ${box}`}
        />
      </form>

      <div className="h-8 text-xl font-bold" aria-live="polite">
        {status === 'correct' && <span className="text-emerald-600">Správně! ✅</span>}
        {status === 'wrong' && (
          <span className="text-rose-600">
            Skoro! Správně je {question.left} {op.symbol} {question.right} = <b>{question.answer}</b>
          </span>
        )}
      </div>

      <NumPad
        disabled={locked}
        onDigit={append}
        onBackspace={() => !locked && setValue((v) => v.slice(0, -1))}
        onSubmit={() => submit()}
      />
    </div>
  )
}
