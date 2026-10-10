import { OPERATIONS } from './arithmetic/operations'

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
    title: OPERATIONS.multiplication.title,
    description: 'Řady, trénink a závod s časem',
    icon: OPERATIONS.multiplication.icon,
    gradient: 'from-violet-500 to-fuchsia-500',
    path: OPERATIONS.multiplication.path,
  },
  {
    id: 'addition',
    title: OPERATIONS.addition.title,
    description: 'Do 20, do 100 i do 1000',
    icon: OPERATIONS.addition.icon,
    gradient: 'from-emerald-400 to-teal-500',
    path: OPERATIONS.addition.path,
  },
  {
    id: 'subtraction',
    title: OPERATIONS.subtraction.title,
    description: 'Kolik zbyde? Do 20, do 100 i do 1000',
    icon: OPERATIONS.subtraction.icon,
    gradient: 'from-sky-400 to-blue-500',
    path: OPERATIONS.subtraction.path,
  },
  {
    id: 'division',
    title: OPERATIONS.division.title,
    description: 'Rozděl spravedlivě: násobilka pozpátku',
    icon: OPERATIONS.division.icon,
    gradient: 'from-amber-400 to-orange-500',
    path: OPERATIONS.division.path,
  },
]
