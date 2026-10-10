import type { PanelInfo } from '../components/GamePanel'
import type { GameId } from '../lib/storage'
import { OPERATIONS } from './arithmetic/operations'
import { TOPICS } from './english/topics'

export interface GameInfo extends PanelInfo {
  id: GameId
}

export interface Subject extends PanelInfo {
  id: 'math' | 'english'
  path: string
  games: GameInfo[]
}

/**
 * Subjects on the home page, each with its game panels. Add a game to its
 * subject here and register its routes in App.tsx.
 */
export const SUBJECTS = {
  math: {
    id: 'math',
    title: 'Matematika',
    description: 'Násobilka, sčítání, odčítání a dělení',
    icon: '🔢',
    gradient: 'from-violet-500 to-fuchsia-500',
    path: '/matika',
    games: [
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
    ],
  },
  english: {
    id: 'english',
    title: 'Angličtina',
    description: 'Barvy a čísla: poznej je, poslechni si je a napiš je',
    icon: '🇬🇧',
    gradient: 'from-sky-500 to-indigo-500',
    path: '/anglictina',
    games: [
      {
        id: 'colors',
        title: TOPICS.colors.title,
        description: 'Red, blue, green… Vyber a napiš barvy anglicky',
        icon: TOPICS.colors.icon,
        gradient: 'from-pink-500 to-rose-500',
        path: TOPICS.colors.path,
      },
      {
        id: 'numbers',
        title: TOPICS.numbers.title,
        description: 'One, two, three… Vyber a napiš čísla anglicky',
        icon: TOPICS.numbers.icon,
        gradient: 'from-cyan-500 to-sky-600',
        path: TOPICS.numbers.path,
      },
    ],
  },
} satisfies Record<Subject['id'], Subject>

export const SUBJECT_LIST: Subject[] = Object.values(SUBJECTS)
