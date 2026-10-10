import { describe, expect, it } from 'vitest'
import { seeded } from '../shared/seeded'
import {
  choiceOptions,
  choiceRound,
  cleanTyping,
  isCorrectSpelling,
  lettersLabel,
  MAX_LETTERS,
  nextHint,
  OPTION_COUNT,
  ROUND_COUNT,
  roundWords,
} from './logic'
import { TOPICS } from './topics'

const colors = TOPICS.colors.words
const numbers = TOPICS.numbers.words
const red = colors.find((w) => w.en === 'red')!
const grey = colors.find((w) => w.en === 'grey')!

describe('roundWords', () => {
  it('uses each word once before repeating', () => {
    const words = roundWords(colors, colors.length, seeded(1))
    expect(new Set(words).size).toBe(colors.length)
  })

  it('never shows the same word twice in a row, even across passes', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const words = roundWords(numbers, 35, seeded(seed))
      expect(words).toHaveLength(35)
      for (let i = 1; i < words.length; i++) expect(words[i]).not.toBe(words[i - 1])
    }
  })

  it('rejects an empty word list', () => {
    expect(() => roundWords([], 3)).toThrow()
  })
})

describe('choice questions', () => {
  it('offers the right word plus different wrong ones', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const options = choiceOptions(colors, red, OPTION_COUNT, seeded(seed))
      expect(options).toHaveLength(OPTION_COUNT)
      expect(options).toContain(red)
      expect(new Set(options).size).toBe(OPTION_COUNT)
      expect(options.every((o) => colors.includes(o))).toBe(true)
    }
  })

  it('a round mixes both directions and every question has its answer among the options', () => {
    const round = choiceRound(numbers, ROUND_COUNT, seeded(3))
    expect(round).toHaveLength(ROUND_COUNT)
    expect(new Set(round.map((q) => q.direction))).toEqual(new Set(['toEnglish', 'fromEnglish']))
    for (const q of round) expect(q.options).toContain(q.word)
  })
})

describe('spelling', () => {
  it('ignores case, spaces and other characters', () => {
    expect(isCorrectSpelling(red, 'red')).toBe(true)
    expect(isCorrectSpelling(red, ' Red ')).toBe(true)
    expect(isCorrectSpelling(red, 'RED!')).toBe(true)
    expect(isCorrectSpelling(red, 'rad')).toBe(false)
    expect(isCorrectSpelling(red, 'reds')).toBe(false)
    expect(isCorrectSpelling(red, '')).toBe(false)
  })

  it('accepts the American spelling where there is one', () => {
    expect(isCorrectSpelling(grey, 'grey')).toBe(true)
    expect(isCorrectSpelling(grey, 'gray')).toBe(true)
  })

  it('cleanTyping keeps lowercase letters up to the limit', () => {
    expect(cleanTyping('Ye1l-low')).toBe('yellow')
    expect(cleanTyping('a'.repeat(30))).toHaveLength(MAX_LETTERS)
  })

  it('a hint keeps the correct start and adds the next letter', () => {
    const seven = numbers[6]
    expect(nextHint(seven, '')).toBe('s')
    expect(nextHint(seven, 'se')).toBe('sev')
    // A typo is cut off at the first wrong letter.
    expect(nextHint(seven, 'sav')).toBe('se')
    expect(nextHint(seven, 'seven')).toBe('seven')
  })

  it('says the letter count in proper Czech', () => {
    expect(lettersLabel(1)).toBe('1 písmeno')
    expect(lettersLabel(3)).toBe('3 písmena')
    expect(lettersLabel(4)).toBe('4 písmena')
    expect(lettersLabel(5)).toBe('5 písmen')
  })
})
