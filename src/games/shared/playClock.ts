import { createContext, useContext, useEffect } from 'react'

/** Set by PlayTimeGate: tells it whether the fun game inside is paused. */
export const PauseContext = createContext<(paused: boolean) => void>(() => {})

/** Lets a fun game stop the play clock, e.g. on its start, pause or game-over screen. */
export function usePausePlayClock(paused: boolean) {
  const setPaused = useContext(PauseContext)
  useEffect(() => {
    setPaused(paused)
    return () => setPaused(false)
  }, [paused, setPaused])
}
