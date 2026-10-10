// All sounds are synthesized with the Web Audio API, so there are no audio files.

let ctx: AudioContext | null = null
let muted = false

export function setMuted(value: boolean) {
  muted = value
}

function audio(): AudioContext | null {
  if (muted) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

interface Note {
  freq: number
  /** Start offset in seconds. */
  at: number
  duration: number
  type?: OscillatorType
  volume?: number
}

function play(notes: Note[]) {
  const ac = audio()
  if (!ac) return
  const now = ac.currentTime
  for (const n of notes) {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = n.type ?? 'triangle'
    osc.frequency.value = n.freq
    const start = now + n.at
    const vol = n.volume ?? 0.2
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(vol, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, start + n.duration)
    osc.connect(gain).connect(ac.destination)
    osc.start(start)
    osc.stop(start + n.duration + 0.05)
  }
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5

export function playCorrect() {
  play([
    { freq: C6, at: 0, duration: 0.12 },
    { freq: E6, at: 0.08, duration: 0.2 },
  ])
}

export function playWrong() {
  play([
    { freq: 220, at: 0, duration: 0.18, type: 'sine', volume: 0.25 },
    { freq: 165, at: 0.14, duration: 0.3, type: 'sine', volume: 0.25 },
  ])
}

export function playStreak() {
  play([C5, E5, G5, C6].map((freq, i) => ({ freq, at: i * 0.06, duration: 0.15 })))
}

export function playWin() {
  play([
    { freq: C5, at: 0, duration: 0.15 },
    { freq: E5, at: 0.12, duration: 0.15 },
    { freq: G5, at: 0.24, duration: 0.15 },
    { freq: C6, at: 0.36, duration: 0.5, volume: 0.25 },
    { freq: G5, at: 0.36, duration: 0.5, volume: 0.15 },
  ])
}

export function playTick() {
  play([{ freq: 880, at: 0, duration: 0.05, type: 'square', volume: 0.05 }])
}
