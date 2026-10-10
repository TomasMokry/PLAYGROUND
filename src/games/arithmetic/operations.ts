import type { OperationId } from '../../lib/storage'
import type { Question } from './logic'

/** A selectable table or difficulty level. Stars are saved per group id. */
export interface Group {
  id: number
  /** Short chip text, e.g. "×6" or "do 20". */
  label: string
  /** Sample problem shown under the label, for levels that need one. */
  example?: string
}

export interface Operation {
  id: OperationId
  path: string
  title: string
  icon: string
  /** Operator as shown in equations. Czech schools write division as ":". */
  symbol: string
  groups: readonly Group[]
  /** Every question in a group. */
  pool: (group: number) => readonly Question[]
  /** Questions in order for the "Řada" mode; operations without it don't offer that mode. */
  sequence?: {
    questions: (group: number) => readonly Question[]
    title: (group: number) => string
    description: string
  }
  text: {
    pickGroups: string
    pickOne: string
    pickAny: string
  }
  /** Literal Tailwind classes (Tailwind can't see classes built from strings). */
  style: {
    symbol: string
    soft: string
    chipOn: string
    chipGrid: string
    chipLabel: string
  }
}

const range = (from: number, to: number, step = 1) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step)

const ONE_TO_TEN = range(1, 10)

/** Computes each group's pool once, on first use. */
function cachedPool(build: (group: number) => Question[]) {
  const cache = new Map<number, Question[]>()
  return (group: number) => {
    let pool = cache.get(group)
    if (!pool) {
      pool = build(group)
      cache.set(group, pool)
    }
    return pool
  }
}

/** All `left ∘ right` pairs from the two ranges that satisfy `keep`. */
function pairs(lefts: number[], rights: number[], keep: (a: number, b: number) => boolean, solve: (a: number, b: number) => number, group: number) {
  return lefts.flatMap((left) =>
    rights.filter((right) => keep(left, right)).map((right) => ({ left, right, answer: solve(left, right), group })),
  )
}

const ones = (n: number) => n % 10
const isRound = (n: number) => n % 10 === 0

const TABLE_GROUPS = (symbol: string): Group[] => ONE_TO_TEN.map((t) => ({ id: t, label: `${symbol}${t}` }))

const TABLE_STYLE = { chipGrid: 'grid-cols-5', chipLabel: 'text-3xl' }
const LEVEL_STYLE = { chipGrid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5', chipLabel: 'text-2xl' }

/** `factor × table`, factor 1–10. */
const multiplicationTable = (table: number): Question[] =>
  ONE_TO_TEN.map((factor) => ({ left: factor, right: table, answer: factor * table, group: table }))

/** `(factor × table) : table`, the multiplication table read backwards. */
const divisionTable = (table: number): Question[] =>
  ONE_TO_TEN.map((factor) => ({ left: factor * table, right: table, answer: factor, group: table }))

/** Difficulty levels shared by addition and subtraction. */
export const LEVELS = { upTo20: 1, tens: 2, upTo100: 3, carry: 4, upTo1000: 5 } as const

function additionPool(level: number): Question[] {
  const add = (a: number, b: number) => a + b
  const L = LEVELS
  switch (level) {
    case L.upTo20:
      return pairs(ONE_TO_TEN, ONE_TO_TEN, () => true, add, level)
    case L.tens:
      return pairs(range(10, 90, 10), range(10, 90, 10), (a, b) => a + b <= 100, add, level)
    case L.upTo100:
      // Two-digit + one/two-digit without carrying over a ten (34 + 25).
      return pairs(range(11, 98), range(1, 88), (a, b) => !isRound(a) && !isRound(b) && ones(a) + ones(b) < 10 && a + b < 100, add, level)
    case L.carry:
      // Carrying over a ten (38 + 47).
      return pairs(range(11, 98), range(2, 89), (a, b) => ones(a) + ones(b) >= 10 && a + b <= 100, add, level)
    case L.upTo1000:
      // Round numbers up to 1000 (340 + 250).
      return pairs(range(100, 980, 10), range(10, 890, 10), (a, b) => a + b < 1000, add, level)
    default:
      return []
  }
}

function subtractionPool(level: number): Question[] {
  const sub = (a: number, b: number) => a - b
  const L = LEVELS
  switch (level) {
    case L.upTo20:
      // The small addition table read backwards: (x + y) − y = x.
      return pairs(range(2, 20), ONE_TO_TEN, (a, b) => a - b >= 1 && a - b <= 10, sub, level)
    case L.tens:
      return pairs(range(20, 100, 10), range(10, 90, 10), (a, b) => a > b, sub, level)
    case L.upTo100:
      // No borrowing from the tens (68 − 25).
      return pairs(range(11, 99), range(1, 98), (a, b) => !isRound(a) && !isRound(b) && ones(b) <= ones(a) && a > b, sub, level)
    case L.carry:
      // Borrowing from the tens (63 − 28).
      return pairs(range(11, 100), range(2, 99), (a, b) => ones(b) > ones(a) && a > b, sub, level)
    case L.upTo1000:
      // Round numbers up to 1000 (730 − 250).
      return pairs(range(100, 990, 10), range(10, 980, 10), (a, b) => a > b, sub, level)
    default:
      return []
  }
}

const LEVEL_TEXT = {
  pickGroups: 'Vyber úrovně',
  pickOne: 'Vyber právě jednu úroveň',
  pickAny: 'Vyber aspoň jednu úroveň',
}

export const OPERATIONS: Record<OperationId, Operation> = {
  multiplication: {
    id: 'multiplication',
    path: '/matika/nasobilka',
    title: 'Násobilka',
    icon: '✖️',
    symbol: '×',
    groups: TABLE_GROUPS('×'),
    pool: cachedPool(multiplicationTable),
    sequence: {
      questions: cachedPool(multiplicationTable),
      title: (t) => `Řada násobilky ${t}`,
      description: 'Projdi násobilku od 1× do 10× a sleduj, jak čísla rostou.',
    },
    text: {
      pickGroups: 'Vyber násobilky',
      pickOne: 'Vyber právě jednu násobilku',
      pickAny: 'Vyber aspoň jednu násobilku',
    },
    style: {
      ...TABLE_STYLE,
      symbol: 'text-violet-400',
      soft: 'bg-violet-100 text-violet-700 hover:bg-violet-200',
      chipOn: 'border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-200',
    },
  },
  addition: {
    id: 'addition',
    path: '/matika/scitani',
    title: 'Sčítání',
    icon: '➕',
    symbol: '+',
    groups: [
      { id: LEVELS.upTo20, label: 'do 20', example: '7 + 8' },
      { id: LEVELS.tens, label: 'desítky', example: '30 + 40' },
      { id: LEVELS.upTo100, label: 'do 100', example: '34 + 25' },
      { id: LEVELS.carry, label: 'přes 10', example: '38 + 47' },
      { id: LEVELS.upTo1000, label: 'do 1000', example: '340 + 250' },
    ],
    pool: cachedPool(additionPool),
    text: LEVEL_TEXT,
    style: {
      ...LEVEL_STYLE,
      symbol: 'text-emerald-500',
      soft: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
      chipOn: 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-200',
    },
  },
  subtraction: {
    id: 'subtraction',
    path: '/matika/odcitani',
    title: 'Odčítání',
    icon: '➖',
    symbol: '−',
    groups: [
      { id: LEVELS.upTo20, label: 'do 20', example: '15 − 7' },
      { id: LEVELS.tens, label: 'desítky', example: '90 − 30' },
      { id: LEVELS.upTo100, label: 'do 100', example: '68 − 25' },
      { id: LEVELS.carry, label: 'přes 10', example: '63 − 28' },
      { id: LEVELS.upTo1000, label: 'do 1000', example: '730 − 250' },
    ],
    pool: cachedPool(subtractionPool),
    text: LEVEL_TEXT,
    style: {
      ...LEVEL_STYLE,
      symbol: 'text-sky-500',
      soft: 'bg-sky-100 text-sky-700 hover:bg-sky-200',
      chipOn: 'border-sky-600 bg-sky-600 text-white shadow-lg shadow-sky-200',
    },
  },
  division: {
    id: 'division',
    path: '/matika/deleni',
    title: 'Dělení',
    icon: '➗',
    symbol: ':',
    groups: TABLE_GROUPS(':'),
    pool: cachedPool(divisionTable),
    sequence: {
      questions: cachedPool(divisionTable),
      title: (t) => `Řada dělení ${t}`,
      description: 'Projdi dělení od 1 do 10. Je to násobilka pozpátku!',
    },
    text: {
      pickGroups: 'Vyber, čím budeš dělit',
      pickOne: 'Vyber právě jedno číslo',
      pickAny: 'Vyber aspoň jedno číslo',
    },
    style: {
      ...TABLE_STYLE,
      symbol: 'text-orange-400',
      soft: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
      chipOn: 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-200',
    },
  },
}

export const OPERATION_LIST = Object.values(OPERATIONS)

/** "×3, ×7" or "do 20, do 100" for screen titles. */
export function groupLabels(op: Operation, groups: readonly number[]): string {
  return op.groups.filter((g) => groups.includes(g.id)).map((g) => g.label).join(', ')
}
