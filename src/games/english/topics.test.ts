import { describe, expect, it } from 'vitest'
import { MAX_LETTERS, OPTION_COUNT } from './logic'
import { TOPIC_LIST, TOPICS } from './topics'

describe('every topic', () => {
  for (const topic of TOPIC_LIST) {
    describe(topic.title, () => {
      it('has enough distinct words for a multiple-choice question', () => {
        expect(topic.words.length).toBeGreaterThanOrEqual(OPTION_COUNT)
        expect(new Set(topic.words.map((w) => w.en)).size).toBe(topic.words.length)
      })

      it('only uses lowercase a–z words that fit the spelling input', () => {
        for (const w of topic.words) {
          for (const spelling of [w.en, ...(w.alt ?? [])]) {
            expect(spelling).toMatch(/^[a-z]+$/)
            expect(spelling.length).toBeLessThanOrEqual(MAX_LETTERS)
          }
          expect(w.cs.length).toBeGreaterThan(0)
        }
      })
    })
  }
})

describe('word lists', () => {
  it('numbers go from one to ten in order', () => {
    const words = TOPICS.numbers.words
    expect(words.map((w) => w.en)).toEqual(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'])
    expect(words.map((w) => (w.kind === 'number' ? w.value : 0))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('colors have distinct swatches', () => {
    const hexes = TOPICS.colors.words.map((w) => (w.kind === 'color' ? w.hex : ''))
    expect(hexes.every((h) => /^#[0-9a-f]{6}$/.test(h))).toBe(true)
    expect(new Set(hexes).size).toBe(hexes.length)
  })
})
