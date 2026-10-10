import confetti from 'canvas-confetti'

const COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#3b82f6']

/** Small burst, e.g. for a streak milestone. */
export function smallBurst() {
  void confetti({ particleCount: 40, spread: 60, startVelocity: 35, origin: { y: 0.7 }, colors: COLORS })
}

/** Big celebration from both sides, e.g. for 3 stars or a new record. */
export function celebrate() {
  const end = Date.now() + 1200
  const frame = () => {
    void confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: COLORS })
    void confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: COLORS })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
