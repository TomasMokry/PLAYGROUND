export interface GameInfo {
  id: string
  title: string
  description: string
  icon: string
  /** Tailwind gradient classes for the panel (must be literal strings for Tailwind to see them). */
  gradient: string
  /** Route of the game; omitted for games that are not built yet. */
  path?: string
}

/** Panels on the home page. Add a game here and register its routes in App.tsx. */
export const GAMES: GameInfo[] = [
  {
    id: 'multiplication',
    title: 'Násobilka',
    description: 'Řady, trénink a závod s časem',
    icon: '✖️',
    gradient: 'from-violet-500 to-fuchsia-500',
    path: '/nasobilka',
  },
  {
    id: 'addition',
    title: 'Sčítání',
    description: 'Sčítej rychle a přesně',
    icon: '➕',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'subtraction',
    title: 'Odčítání',
    description: 'Kolik zbyde?',
    icon: '➖',
    gradient: 'from-sky-400 to-blue-500',
  },
  {
    id: 'division',
    title: 'Dělení',
    description: 'Rozděl spravedlivě',
    icon: '➗',
    gradient: 'from-amber-400 to-orange-500',
  },
]
