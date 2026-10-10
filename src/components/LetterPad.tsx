import type { MouseEvent } from 'react'

interface Props {
  onLetter: (letter: string) => void
  onBackspace: () => void
  onSubmit: () => void
  disabled?: boolean
}

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
const KEY = 'h-12 min-w-0 flex-1 rounded-xl text-xl font-extrabold shadow-sm transition active:scale-95 disabled:opacity-40 sm:h-14'

/** On-screen QWERTY keyboard for typing English words (the NumPad's sibling). */
export function LetterPad({ onLetter, onBackspace, onSubmit, disabled }: Props) {
  // preventDefault on mousedown keeps keyboard focus in the answer input.
  const keep = (e: MouseEvent) => e.preventDefault()
  const letter = (l: string) => (
    <button key={l} type="button" disabled={disabled} onMouseDown={keep} onClick={() => onLetter(l)} className={`${KEY} bg-white hover:bg-violet-50`}>
      {l}
    </button>
  )
  return (
    <div className="flex w-full max-w-xl flex-col gap-1.5">
      <div className="flex gap-1.5">{[...ROWS[0]].map(letter)}</div>
      <div className="flex gap-1.5 px-[5%]">{[...ROWS[1]].map(letter)}</div>
      <div className="flex gap-1.5">
        <button type="button" disabled={disabled} onMouseDown={keep} onClick={onBackspace} className={`${KEY} grow-[1.5] bg-slate-100 hover:bg-slate-200`} aria-label="Smazat">
          ⌫
        </button>
        {[...ROWS[2]].map(letter)}
        <button type="button" disabled={disabled} onMouseDown={keep} onClick={onSubmit} className={`${KEY} grow-[1.5] bg-emerald-500 text-white hover:bg-emerald-600`}>
          OK
        </button>
      </div>
    </div>
  )
}
