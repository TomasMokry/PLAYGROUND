import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { MuteButton } from '../../components/MuteButton'
import { StarRating } from '../../components/StarRating'
import { celebrate } from '../../lib/confetti'
import { playCorrect, playJump, playWin, playWrong } from '../../lib/sound'
import type { Stars } from '../../lib/storage'
import { useProfiles } from '../../profiles/ProfileContext'
import { DINO_SIZE, DINO_X, type Input, newRun, recordRun, type RunState, scoreOf, starsForScore, step, WIDTH } from './logic'

const BACK_TO = '/zabava'
const HEIGHT = 170
/** Screen y of the ground line; game heights are measured up from here. */
const GROUND_Y = 145
/** After a crash, ignore restarts for a moment so a held key doesn't start a new run at once. */
const RESTART_DELAY_MS = 500
const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'

type Phase = 'ready' | 'playing' | 'paused' | 'over'

interface Result {
  score: number
  stars: Stars
  newBest: boolean
}

export default function DinoGame() {
  const { activeProfile, updateActiveProfile } = useProfiles()
  const best = activeProfile?.dino.bestScore ?? 0
  const [phase, setPhase] = useState<Phase>('ready')
  const [result, setResult] = useState<Result | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // The run changes every frame, so it lives in refs and is drawn on the canvas, not rendered by React.
  const runRef = useRef<RunState>(newRun())
  const inputRef = useRef<Input>({ jump: false, duck: false })
  const overAtRef = useRef(0)

  function start() {
    if (phase === 'over') {
      if (Date.now() - overAtRef.current < RESTART_DELAY_MS) return
      runRef.current = newRun()
      setResult(null)
    }
    inputRef.current = { jump: false, duck: false }
    setPhase('playing')
  }

  function jump() {
    if (phase === 'playing') inputRef.current.jump = true
    else start()
  }

  function finish(run: RunState) {
    overAtRef.current = Date.now()
    const score = scoreOf(run)
    const newBest = score > best
    updateActiveProfile((p) => ({ ...p, dino: recordRun(p.dino, score).progress }))
    // The first run of all is always a record, so only later records are celebrated.
    if (newBest && best > 0) {
      playWin()
      celebrate()
    } else {
      playWrong()
    }
    setResult({ score, stars: starsForScore(score), newBest })
    setPhase('over')
  }

  // The animation loop and key handlers outlive renders, so they call the latest functions through refs.
  const latest = useRef({ finish, jump, start, best, phase })
  useEffect(() => {
    latest.current = { finish, jump, start, best, phase }
  })

  // Animation loop: step the run and draw it every frame while playing.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = WIDTH * dpr
    canvas.height = HEIGHT * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    draw(ctx, runRef.current, latest.current.best, phase)
    if (phase !== 'playing') return

    let last = performance.now()
    let raf = requestAnimationFrame(function frame(now) {
      const prev = runRef.current
      const next = step(prev, (now - last) / 1000, inputRef.current)
      last = now
      inputRef.current.jump = false
      runRef.current = next
      if (next.jumps > prev.jumps) playJump()
      if (Math.floor(scoreOf(next) / 100) > Math.floor(scoreOf(prev) / 100)) playCorrect()
      draw(ctx, next, latest.current.best, 'playing')
      if (next.over) latest.current.finish(next)
      else raf = requestAnimationFrame(frame)
    })
    return () => cancelAnimationFrame(raf)
  }, [phase])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (!e.repeat || latest.current.phase === 'playing') latest.current.jump()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        inputRef.current.duck = true
      } else if (e.key === 'p' || e.key === 'Escape') {
        setPhase((p) => (p === 'playing' ? 'paused' : p === 'paused' ? 'playing' : p))
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') inputRef.current.duck = false
    }
    // Pause when the child switches to another tab or app.
    function onHide() {
      if (document.hidden) setPhase((p) => (p === 'playing' ? 'paused' : p))
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  const setDuck = (duck: boolean) => {
    inputRef.current.duck = duck
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-5">
      <div className="flex items-center gap-3">
        <Link to={BACK_TO} className="rounded-full bg-white px-4 py-2 font-bold shadow-sm transition hover:scale-105">
          ← Zpět
        </Link>
        <h1 className="flex-1 text-xl font-extrabold text-slate-700">Dino 🦖</h1>
        {phase === 'playing' || phase === 'paused' ? (
          <button
            type="button"
            onClick={() => setPhase((p) => (p === 'paused' ? 'playing' : 'paused'))}
            className="rounded-full bg-white px-4 py-2 font-bold shadow-sm transition hover:scale-105"
          >
            {phase === 'paused' ? '▶ Hrát' : '⏸️ Pauza'}
          </button>
        ) : null}
        <MuteButton />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center gap-5 py-6">
        <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 to-white shadow-lg">
          <canvas
            ref={canvasRef}
            className="block aspect-[600/170] w-full touch-none select-none"
            onPointerDown={(e) => {
              e.preventDefault()
              jump()
            }}
            aria-label="Herní plocha: ťukni pro skok"
          />
          {phase !== 'playing' && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
              {phase === 'ready' && (
                <>
                  <p className="text-2xl font-black text-slate-700">Přeskakuj kaktusy! 🌵</p>
                  <p className="font-bold text-slate-500">Mezerník nebo ťuknutí = skok</p>
                </>
              )}
              {phase === 'paused' && <p className="text-3xl font-black text-slate-700">Pauza ⏸️</p>}
              {phase === 'over' && <p className="animate-pop text-3xl font-black text-rose-500">Au! 💥</p>}
            </div>
          )}
        </div>

        {result && (
          <div className="flex animate-pop flex-col items-center gap-3 rounded-3xl bg-white px-8 py-5 text-center shadow-lg">
            <StarRating stars={result.stars} size="lg" animated />
            <p className="text-2xl font-black">
              Skóre: <span className="tabular-nums">{result.score}</span>
            </p>
            {result.newBest && (
              <span className="rounded-full bg-amber-100 px-4 py-1 font-extrabold text-amber-700">🏅 Nový rekord!</span>
            )}
          </div>
        )}

        <div className="flex gap-3 select-none">
          <BigButton onDown={jump}>{phase === 'playing' ? 'Skok ⬆️' : phase === 'over' ? 'Znovu 🔄' : 'Hrát ▶'}</BigButton>
          <BigButton onDown={() => setDuck(true)} onUp={() => setDuck(false)} disabled={phase !== 'playing'}>
            Skrčit ⬇️
          </BigButton>
        </div>
        <p className="hidden text-sm font-semibold text-slate-400 sm:block">
          Mezerník / ↑ skok · ↓ skrčit se (pod ptáky) · P pauza · 100 = ★, 300 = ★★, 600 = ★★★ · Rekord: {best}
        </p>
      </main>
    </div>
  )
}

/** Touch button that reacts on press (and release), so taps feel instant. */
function BigButton({ onDown, onUp, disabled = false, children }: { onDown: () => void; onUp?: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault()
        onDown()
      }}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onPointerCancel={onUp}
      className="min-w-36 touch-none rounded-2xl bg-violet-600 px-6 py-4 text-lg font-extrabold text-white shadow-lg shadow-violet-200 transition active:scale-95 disabled:opacity-40"
    >
      {children}
    </button>
  )
}

/** Draws an emoji centered on a point, optionally scaled (negative x flips it to face the other way). */
function emoji(ctx: CanvasRenderingContext2D, char: string, cx: number, cy: number, size: number, sx = 1, sy = 1) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(sx, sy)
  ctx.font = `${size}px ${EMOJI_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char, 0, 0)
  ctx.restore()
}

/** Screen x of something that scrolls by at a fraction of the run's speed, wrapping around. */
const scrolled = (offset: number, distance: number, factor: number, span = WIDTH + 80) =>
  ((((offset - distance * factor) % span) + span) % span) - 40

function draw(ctx: CanvasRenderingContext2D, run: RunState, best: number, phase: Phase) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)

  // Clouds drift slowly behind everything.
  ctx.globalAlpha = 0.7
  for (const [offset, y] of [[80, 30], [330, 18], [520, 42]]) emoji(ctx, '☁️', scrolled(offset, run.distance, 0.15), y, 28)
  ctx.globalAlpha = 1

  // Ground line with pebbles moving at the run's speed.
  ctx.fillStyle = '#94a3b8'
  ctx.fillRect(0, GROUND_Y, WIDTH, 2)
  for (let i = 0; i < 24; i++) {
    const x = scrolled(i * 53 + (i % 3) * 17, run.distance, 1, WIDTH + 80)
    ctx.fillRect(x, GROUND_Y + 6 + (i % 4) * 4, 3 + (i % 3) * 2, 2)
  }

  for (const o of run.obstacles) {
    const top = GROUND_Y - o.bottom - o.h
    if (o.kind === 'bird') {
      // Flap up and down a little.
      const flap = Math.floor(run.distance / 30) % 2 ? -2 : 2
      emoji(ctx, '🐦', o.x + o.w / 2, top + o.h / 2 + flap, 32)
    } else {
      const each = o.w / o.count
      for (let i = 0; i < o.count; i++) emoji(ctx, '🌵', o.x + each * (i + 0.5), top + o.h / 2 + 2, o.h + 6)
    }
  }

  // The dino emoji faces left, so it is flipped to run to the right. Ducking squashes it.
  const size = run.ducking ? DINO_SIZE.ducking : DINO_SIZE.standing
  const bob = run.y === 0 && phase === 'playing' && Math.floor(run.distance / 25) % 2 ? -2 : 0
  const cx = DINO_X + size.w / 2
  const cy = GROUND_Y - run.y - size.h / 2 + bob
  if (run.ducking) emoji(ctx, '🦖', cx, cy + 2, 46, -1.25, 0.6)
  else emoji(ctx, '🦖', cx, cy + 2, 46, -1, 1)
  if (run.over) emoji(ctx, '💥', cx + 22, cy - 14, 26)

  // Score in the corner, like the original.
  ctx.font = `800 16px Nunito, ui-rounded, system-ui, sans-serif`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#94a3b8'
  ctx.fillText(`REKORD ${String(best).padStart(5, '0')}`, WIDTH - 110, 10)
  ctx.fillStyle = '#334155'
  ctx.fillText(String(scoreOf(run)).padStart(5, '0'), WIDTH - 14, 10)
}
