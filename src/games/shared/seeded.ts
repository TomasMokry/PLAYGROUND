import type { Rng } from './rules'

/** Deterministic pseudo-random generator for repeatable tests. */
export function seeded(seed: number): Rng {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}
