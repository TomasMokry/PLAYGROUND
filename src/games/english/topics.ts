import type { TopicId } from '../../lib/storage'

interface BaseWord {
  /** The English word as taught at school (British spelling). */
  en: string
  /** Other spellings that also count as correct, e.g. "gray". */
  alt?: readonly string[]
  /** Czech translation, shown as a hint. */
  cs: string
}

export interface ColorWord extends BaseWord {
  kind: 'color'
  /** Swatch color, used as an inline style. */
  hex: string
}

export interface NumberWord extends BaseWord {
  kind: 'number'
  value: number
}

export type Word = ColorWord | NumberWord

/**
 * Game modes of a topic. Stars are saved per mode id, so ids never change.
 * `choose`: see the picture, pick the English word ("Jak se to řekne?").
 * `find`: see and hear the English word, pick the picture ("Najdi barvu").
 * `write`: see the picture, type the English word ("Napiš").
 */
export const MODES = { choose: 1, write: 2, find: 3 } as const
export type ModeId = (typeof MODES)[keyof typeof MODES]

export interface Topic {
  id: TopicId
  path: string
  title: string
  icon: string
  words: readonly Word[]
  text: {
    /** Mode card descriptions. */
    choose: string
    find: string
    write: string
    /** Title of the `find` mode, e.g. "Najdi barvu". */
    findTitle: string
    /** "Která barva je" + word: the question in the `find` mode. */
    whichIs: string
  }
}

const COLORS: ColorWord[] = [
  { kind: 'color', en: 'red', cs: 'červená', hex: '#ef4444' },
  { kind: 'color', en: 'blue', cs: 'modrá', hex: '#3b82f6' },
  { kind: 'color', en: 'green', cs: 'zelená', hex: '#22c55e' },
  { kind: 'color', en: 'yellow', cs: 'žlutá', hex: '#facc15' },
  { kind: 'color', en: 'orange', cs: 'oranžová', hex: '#f97316' },
  { kind: 'color', en: 'purple', cs: 'fialová', hex: '#9333ea' },
  { kind: 'color', en: 'pink', cs: 'růžová', hex: '#f472b6' },
  { kind: 'color', en: 'brown', cs: 'hnědá', hex: '#92400e' },
  { kind: 'color', en: 'black', cs: 'černá', hex: '#111827' },
  { kind: 'color', en: 'white', cs: 'bílá', hex: '#ffffff' },
  { kind: 'color', en: 'grey', alt: ['gray'], cs: 'šedá', hex: '#9ca3af' },
]

const NUMBERS: NumberWord[] = (
  [
    ['one', 'jedna'],
    ['two', 'dva'],
    ['three', 'tři'],
    ['four', 'čtyři'],
    ['five', 'pět'],
    ['six', 'šest'],
    ['seven', 'sedm'],
    ['eight', 'osm'],
    ['nine', 'devět'],
    ['ten', 'deset'],
  ] as const
).map(([en, cs], i) => ({ kind: 'number', en, cs, value: i + 1 }))

export const TOPICS: Record<TopicId, Topic> = {
  colors: {
    id: 'colors',
    path: '/anglictina/barvy',
    title: 'Barvy',
    icon: '🎨',
    words: COLORS,
    text: {
      choose: 'Podívej se na barvu a vyber, jak se řekne anglicky.',
      find: 'Poslechni si anglické slovo a najdi správnou barvu.',
      write: 'Podívej se na barvu a napiš ji anglicky.',
      findTitle: 'Najdi barvu',
      whichIs: 'Která barva je',
    },
  },
  numbers: {
    id: 'numbers',
    path: '/anglictina/cisla',
    title: 'Čísla 1–10',
    icon: '🔢',
    words: NUMBERS,
    text: {
      choose: 'Podívej se na číslo a vyber, jak se řekne anglicky.',
      find: 'Poslechni si anglické slovo a najdi správné číslo.',
      write: 'Podívej se na číslo a napiš ho anglicky.',
      findTitle: 'Najdi číslo',
      whichIs: 'Které číslo je',
    },
  },
}

export const TOPIC_LIST = Object.values(TOPICS)

export const CHOOSE_TITLE = 'Jak se to řekne?'
export const WRITE_TITLE = 'Napiš'

export function modeTitle(topic: Topic, mode: ModeId): string {
  if (mode === MODES.choose) return CHOOSE_TITLE
  if (mode === MODES.find) return topic.text.findTitle
  return WRITE_TITLE
}
