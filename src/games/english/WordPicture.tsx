import type { Word } from './topics'

const SWATCH = { sm: 'size-12 rounded-xl border-2', md: 'size-24 rounded-2xl border-4', lg: 'size-40 rounded-3xl border-4' } as const
const DIGIT = { sm: 'text-3xl', md: 'text-6xl', lg: 'text-9xl' } as const

/** The thing a word names: a color swatch, or a number (with dots to count on the big one). */
export function WordPicture({ word, size }: { word: Word; size: keyof typeof SWATCH }) {
  if (word.kind === 'color') {
    return <span className={`block border-slate-200 shadow-inner ${SWATCH[size]}`} style={{ backgroundColor: word.hex }} />
  }
  return (
    <span className="flex flex-col items-center gap-2">
      <span className={`font-black leading-none tabular-nums text-sky-600 ${DIGIT[size]}`}>{word.value}</span>
      {size === 'lg' && (
        <span className="grid grid-cols-5 gap-1.5" aria-hidden>
          {Array.from({ length: word.value }, (_, i) => (
            <span key={i} className="size-4 rounded-full bg-amber-400" />
          ))}
        </span>
      )}
    </span>
  )
}
