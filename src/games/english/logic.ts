import { shuffle, type Rng } from '../shared/rules'
import type { Word } from './topics'

/** Questions in one round of either mode. */
export const ROUND_COUNT = 10
export const OPTION_COUNT = 4
/** Longest answer the spelling input accepts. */
export const MAX_LETTERS = 12

/**
 * `toEnglish`: show the picture, pick the English word.
 * `fromEnglish`: show (and say) the English word, pick the picture.
 */
export type Direction = 'toEnglish' | 'fromEnglish'

export interface ChoiceQuestion {
  word: Word
  direction: Direction
  /** Includes `word`, in random order. */
  options: Word[]
}

/**
 * `count` words for a round. Every word is used before any repeats, and the
 * same word never comes twice in a row.
 */
export function roundWords(words: readonly Word[], count: number, rng: Rng = Math.random): Word[] {
  if (words.length === 0) throw new Error('At least one word is required')
  const result: Word[] = []
  while (result.length < count) {
    const bag = shuffle(words, rng)
    // Don't start a new pass with the word the previous one ended on.
    if (bag.length > 1 && bag[0] === result.at(-1)) bag.push(bag.shift()!)
    result.push(...bag.slice(0, count - result.length))
  }
  return result
}

/** The right word plus `count - 1` different wrong ones, shuffled. */
export function choiceOptions(words: readonly Word[], target: Word, count = OPTION_COUNT, rng: Rng = Math.random): Word[] {
  const others = shuffle(
    words.filter((w) => w !== target),
    rng,
  ).slice(0, count - 1)
  return shuffle([target, ...others], rng)
}

export function choiceRound(words: readonly Word[], count = ROUND_COUNT, rng: Rng = Math.random): ChoiceQuestion[] {
  return roundWords(words, count, rng).map((word) => ({
    word,
    direction: rng() < 0.5 ? 'toEnglish' : 'fromEnglish',
    options: choiceOptions(words, word, OPTION_COUNT, rng),
  }))
}

/** Lowercase letters only, as typed into the spelling input. */
export function cleanTyping(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, MAX_LETTERS)
}

export function isCorrectSpelling(word: Word, typed: string): boolean {
  const answer = cleanTyping(typed)
  return answer === word.en || (word.alt?.includes(answer) ?? false)
}

/** Keeps the correctly typed start of the word and adds the next letter. */
export function nextHint(word: Word, typed: string): string {
  const answer = cleanTyping(typed)
  let correct = 0
  while (correct < answer.length && answer[correct] === word.en[correct]) correct++
  return word.en.slice(0, Math.min(correct + 1, word.en.length))
}

/** "3 písmena", "5 písmen": Czech plural for the letter count hint. */
export function lettersLabel(count: number): string {
  if (count === 1) return '1 písmeno'
  if (count >= 2 && count <= 4) return `${count} písmena`
  return `${count} písmen`
}
