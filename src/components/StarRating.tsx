import type { Stars } from '../lib/storage'

const SIZES = {
  sm: 'text-sm gap-0',
  md: 'text-2xl gap-0.5',
  lg: 'text-6xl gap-2',
} as const

interface Props {
  stars: Stars
  size?: keyof typeof SIZES
  /** Pop the earned stars in one after another. */
  animated?: boolean
}

export function StarRating({ stars, size = 'md', animated = false }: Props) {
  return (
    <div className={`flex justify-center ${SIZES[size]}`} aria-label={`${stars} ze 3 hvězd`}>
      {[1, 2, 3].map((n) => {
        const earned = n <= stars
        return (
          <span
            key={n}
            className={`${earned ? 'text-amber-400 drop-shadow-sm' : 'text-slate-300'} ${earned && animated ? 'animate-star' : ''}`}
            style={animated ? { animationDelay: `${n * 0.25}s` } : undefined}
          >
            ★
          </span>
        )
      })}
    </div>
  )
}
