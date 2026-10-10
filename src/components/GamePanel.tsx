import { Link } from 'react-router'

export interface PanelInfo {
  id: string
  title: string
  description: string
  icon: string
  /** Tailwind gradient classes for the panel (must be literal strings for Tailwind to see them). */
  gradient: string
  /** Where the panel leads; omitted for games that are not built yet. */
  path?: string
}

/** A big clickable card for a subject or a game. */
export function GamePanel({ game }: { game: PanelInfo }) {
  const body = (
    <>
      <span className="absolute -right-6 -top-6 text-[9rem] leading-none opacity-20 transition group-hover:rotate-12 group-hover:scale-110">
        {game.icon}
      </span>
      <span className="text-5xl">{game.icon}</span>
      <h2 className="mt-6 text-3xl font-black">{game.title}</h2>
      <p className="mt-1 font-semibold text-white/85">{game.description}</p>
      {game.path ? (
        <span className="mt-6 inline-block rounded-full bg-white/25 px-5 py-2 font-extrabold backdrop-blur-sm">Hrát →</span>
      ) : (
        <span className="mt-6 inline-block rounded-full bg-black/15 px-5 py-2 font-extrabold">Již brzy 🔒</span>
      )}
    </>
  )
  const base = `group relative overflow-hidden rounded-3xl bg-gradient-to-br p-8 text-white shadow-lg ${game.gradient}`
  return game.path ? (
    <Link to={game.path} className={`${base} transition hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]`}>
      {body}
    </Link>
  ) : (
    <div className={`${base} cursor-not-allowed opacity-50 grayscale-[30%]`} aria-disabled>
      {body}
    </div>
  )
}
