import type { Stars } from '../../lib/storage'
import { pick, starsFor, type Rng } from '../shared/rules'
import type { Operation } from './operations'

export const PRACTICE_COUNT = 15
export const TIME_ATTACK_SECONDS = 60

/**
 * `left ∘ right = answer`, e.g. 3 × 6 = 18. `group` is the table or level the
 * question belongs to; stars are counted per group.
 */
export interface Question {
  left: number
  right: number
  answer: number
  group: number
}

/** One finished question: was it answered correctly on the first try? */
export interface QuestionResult {
  question: Question
  firstTry: boolean
}

const sameQuestion = (a: Question, b: Question) => a.left === b.left && a.right === b.right && a.group === b.group

/** A random question from the given groups that differs from `previous`. */
export function randomQuestion(op: Operation, groups: readonly number[], previous?: Question, rng: Rng = Math.random): Question {
  if (groups.length === 0) throw new Error('At least one group is required')
  for (;;) {
    const q = pick(op.pool(pick(groups, rng)), rng)
    if (!previous || !sameQuestion(q, previous)) return q
  }
}

/**
 * `count` random questions from the given groups. Groups take turns in random
 * order (so a big level doesn't crowd out a small one), questions within a group
 * don't repeat until all of them have been used, and the same question never
 * comes twice in a row.
 */
export function randomQuestions(op: Operation, groups: readonly number[], count: number, rng: Rng = Math.random): Question[] {
  if (groups.length === 0) throw new Error('At least one group is required')
  const bags = new Map<number, Question[]>()
  const result: Question[] = []
  let groupBag: number[] = []
  while (result.length < count) {
    if (groupBag.length === 0) groupBag = [...groups]
    const group = groupBag.splice(Math.floor(rng() * groupBag.length), 1)[0]
    let bag = bags.get(group)
    if (!bag || bag.length === 0) {
      bag = [...op.pool(group)]
      bags.set(group, bag)
    }
    const prev = result.at(-1)
    let index = Math.floor(rng() * bag.length)
    if (prev && bag.length > 1 && sameQuestion(bag[index], prev)) index = (index + 1) % bag.length
    result.push(bag.splice(index, 1)[0])
  }
  return result
}

/** Stars for each group that appeared in the round, based on that group's questions only. */
export function starsByGroup(results: readonly QuestionResult[]): Map<number, Stars> {
  const perGroup = new Map<number, { correct: number; total: number }>()
  for (const { question, firstTry } of results) {
    const entry = perGroup.get(question.group) ?? { correct: 0, total: 0 }
    entry.total++
    if (firstTry) entry.correct++
    perGroup.set(question.group, entry)
  }
  return new Map([...perGroup].map(([group, { correct, total }]) => [group, starsFor(correct, total)]))
}

/** Stars for the time-attack result screen (not stored per group). */
export function timeAttackStars(correct: number): Stars {
  if (correct >= 30) return 3
  if (correct >= 20) return 2
  if (correct >= 10) return 1
  return 0
}

/** Parses `?g=2,6,7` into a sorted list of the operation's valid groups. */
export function parseGroups(op: Operation, param: string | null): number[] {
  if (!param) return []
  const valid = new Set(op.groups.map((g) => g.id))
  return [...new Set(param.split(',').map(Number))].filter((n) => valid.has(n)).sort((a, b) => a - b)
}
