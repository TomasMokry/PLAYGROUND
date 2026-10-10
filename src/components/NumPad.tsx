import type { MouseEvent } from 'react'

interface Props {
  onDigit: (digit: string) => void
  onBackspace: () => void
  onSubmit: () => void
  disabled?: boolean
}

const KEY = 'h-14 rounded-2xl text-2xl font-extrabold shadow-sm transition active:scale-95 disabled:opacity-40'

export function NumPad({ onDigit, onBackspace, onSubmit, disabled }: Props) {
  // preventDefault on mousedown keeps keyboard focus in the answer input.
  const keep = (e: MouseEvent) => e.preventDefault()
  return (
    <div className="grid w-full max-w-xs grid-cols-3 gap-2">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
        <button key={d} type="button" disabled={disabled} onMouseDown={keep} onClick={() => onDigit(d)} className={`${KEY} bg-white hover:bg-violet-50`}>
          {d}
        </button>
      ))}
      <button type="button" disabled={disabled} onMouseDown={keep} onClick={onBackspace} className={`${KEY} bg-slate-100 hover:bg-slate-200`} aria-label="Smazat">
        ⌫
      </button>
      <button type="button" disabled={disabled} onMouseDown={keep} onClick={() => onDigit('0')} className={`${KEY} bg-white hover:bg-violet-50`}>
        0
      </button>
      <button type="button" disabled={disabled} onMouseDown={keep} onClick={onSubmit} className={`${KEY} bg-emerald-500 text-white hover:bg-emerald-600`}>
        OK
      </button>
    </div>
  )
}
