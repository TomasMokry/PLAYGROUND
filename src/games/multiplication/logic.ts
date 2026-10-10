import type { Stars } from '../../lib/storage'

export const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
export const PRACTICE_COUNT = 15
export const TIME_ATTACK_SECONDS = 60
export const BASE_POINTS = 10

/** `factor × table = answer`, e.g. 3 × 6 = 18 in the 6-table. */
export interface Question {
  factor: number
  table: number
  answer: number
}

/** One finished question: was it answered correctly on the first try? */
export interface QuestionResult {
  question: Question
  firstTry: boolean
}

type Rng = () => number

export function makeQuestion(factor: number, table: number): Question {
  return { factor, table, answer: factor * table }
}

const sameQuestion = (a: Question, b: Question) => a.factor === b.factor && a.table === b.table

/** 1 × t, 2 × t, … 10 × t, in order. */
export function sequenceQuestions(table: number): Question[] {
  return TABLES.map((factor) => makeQuestion(factor, table))
}

/** A random question from the given tables that differs from `previous`. */
export function randomQuestion(tables: readonly number[], previous?: Question, rng: Rng = Math.random): Question {
  if (tables.length === 0) throw new Error('At least one table is required')
  for (;;) {
    const table = tables[Math.floor(rng() * tables.length)]
    const factor = TABLES[Math.floor(rng() * TABLES.length)]
    const q = makeQuestion(factor, table)
    if (!previous || !sameQuestion(q, previous)) return q
  }
}

/**
 * `count` random questions from the given tables. Avoids repeats until every
 * possible question has been used, and never repeats the same question twice in a row.
 */
export function randomQuestions(tables: readonly number[], count: number, rng: Rng = Math.random): Question[] {
  if (tables.length === 0) throw new Error('At least one table is required')
  const pool = tables.flatMap((t) => TABLES.map((f) => makeQuestion(f, t)))
  const result: Question[] = []
  let bag: Question[] = []
  while (result.length < count) {
    if (bag.length === 0) bag = [...pool]
    const prev = result.at(-1)
    let index = Math.floor(rng() * bag.length)
    if (prev && bag.length > 1 && sameQuestion(bag[index], prev)) index = (index + 1) % bag.length
    result.push(bag.splice(index, 1)[0])
  }
  return result
}

/** Moves the current (wrongly answered) question to the end of the queue. */
export function requeue<T>(queue: readonly T[]): T[] {
  if (queue.length <= 1) return [...queue]
  return [...queue.slice(1), queue[0]]
}

/** Points multiplier for a streak (the streak includes the current answer). */
export function streakMultiplier(streak: number): 1 | 2 | 3 {
  if (streak >= 10) return 3
  if (streak >= 5) return 2
  return 1
}

export function pointsFor(streak: number): number {
  return BASE_POINTS * streakMultiplier(streak)
}

export function starsFor(firstTryCorrect: number, total: number): Stars {
  if (total <= 0) return 0
  if (firstTryCorrect >= total) return 3
  const ratio = firstTryCorrect / total
  if (ratio >= 0.8) return 2
  if (ratio >= 0.6) return 1
  return 0
}

/** Stars for each table that appeared in the round, based on that table's questions only. */
export function starsByTable(results: readonly QuestionResult[]): Map<number, Stars> {
  const perTable = new Map<number, { correct: number; total: number }>()
  for (const { question, firstTry } of results) {
    const entry = perTable.get(question.table) ?? { correct: 0, total: 0 }
    entry.total++
    if (firstTry) entry.correct++
    perTable.set(question.table, entry)
  }
  return new Map([...perTable].map(([table, { correct, total }]) => [table, starsFor(correct, total)]))
}

/** Keeps the better of the stored and newly earned stars. */
export function mergeStars(
  stored: Partial<Record<number, Stars>>,
  earned: Map<number, Stars>,
): Partial<Record<number, Stars>> {
  const merged = { ...stored }
  for (const [table, stars] of earned) {
    merged[table] = Math.max(merged[table] ?? 0, stars) as Stars
  }
  return merged
}

/** Stars for the time-attack result screen (not stored per table). */
export function timeAttackStars(correct: number): Stars {
  if (correct >= 30) return 3
  if (correct >= 20) return 2
  if (correct >= 10) return 1
  return 0
}

const PRAISE = ['Skvělé!', 'Jsi hvězda!', 'Paráda!', 'Výborně!', 'Super!', 'Bomba!', 'Neuvěřitelné!', 'Jen tak dál!']

export function randomPraise(rng: Rng = Math.random): string {
  return PRAISE[Math.floor(rng() * PRAISE.length)]
}

/** Parses `?t=2,6,7` into a sorted list of valid tables. */
export function parseTables(param: string | null): number[] {
  if (!param) return []
  const valid = new Set<number>(TABLES)
  return [...new Set(param.split(',').map(Number))].filter((n) => valid.has(n)).sort((a, b) => a - b)
}
