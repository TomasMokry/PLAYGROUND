interface ModeCardProps {
  icon: string
  title: string
  description: string
  color: string
  extra?: string
  disabledHint?: string
  onPlay: () => void
}

/** A big gradient button that starts a game mode. Pass `disabledHint` to disable it with a reason. */
export function ModeCard({ icon, title, description, color, extra, disabledHint, onPlay }: ModeCardProps) {
  const disabled = disabledHint !== undefined
  return (
    <button
      type="button"
      onClick={onPlay}
      disabled={disabled}
      className={`flex flex-col items-start rounded-3xl bg-gradient-to-br p-6 text-left text-white shadow-lg transition ${color} ${
        disabled ? 'cursor-not-allowed opacity-45 grayscale-[40%]' : 'hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]'
      }`}
    >
      <span className="text-4xl">{icon}</span>
      <span className="mt-3 text-2xl font-black">{title}</span>
      <span className="mt-1 font-semibold text-white/85">{description}</span>
      <span className="mt-4 rounded-full bg-white/25 px-4 py-1.5 font-extrabold">
        {disabled ? disabledHint : extra ? `Hrát → · ${extra}` : 'Hrát →'}
      </span>
    </button>
  )
}
