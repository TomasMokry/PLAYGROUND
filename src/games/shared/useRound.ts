import { useState } from 'react'
import { smallBurst } from '../../lib/confetti'
import { playCorrect, playStreak, playWrong } from '../../lib/sound'
import { pointsFor, randomPraise } from './rules'

export interface Flash {
  id: number
  text: string
}

const STREAK_MILESTONE = 5

/** Streak, points and feedback effects shared by all game modes. */
export function useRound() {
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [points, setPoints] = useState(0)
  const [gain, setGain] = useState<Flash | null>(null)
  const [praise, setPraise] = useState<Flash | null>(null)

  function register(correct: boolean) {
    if (!correct) {
      setStreak(0)
      playWrong()
      return
    }
    const next = streak + 1
    const earned = pointsFor(next)
    setStreak(next)
    setBestStreak((b) => Math.max(b, next))
    setPoints((p) => p + earned)
    setGain({ id: Date.now(), text: `+${earned}` })
    if (next % STREAK_MILESTONE === 0) {
      playStreak()
      smallBurst()
      setPraise({ id: Date.now(), text: `${randomPraise()} ${next} v řadě! 🔥` })
    } else {
      playCorrect()
    }
  }

  return { streak, bestStreak, points, gain, praise, register }
}
