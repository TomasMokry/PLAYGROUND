interface Props {
  /** 0–1 */
  value: number
  color?: string
}

export function ProgressBar({ value, color = 'bg-violet-500' }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div className="h-4 w-full overflow-hidden rounded-full bg-white shadow-inner" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
