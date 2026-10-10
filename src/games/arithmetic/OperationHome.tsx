import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { Header } from '../../components/Header'
import { ModeCard } from '../../components/ModeCard'
import { StarRating } from '../../components/StarRating'
import { useActiveProfile } from '../../profiles/ProfileContext'
import { PRACTICE_COUNT, TIME_ATTACK_SECONDS } from './logic'
import { SUBJECTS } from '../registry'
import type { Operation } from './operations'

const selectionKey = (op: Operation) => `mathkids:selectedGroups:${op.id}`

function loadSelection(op: Operation): number[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(selectionKey(op)) ?? '[]')
    const valid = new Set(op.groups.map((g) => g.id))
    return Array.isArray(saved) ? saved.filter((n) => valid.has(n)) : []
  } catch {
    return []
  }
}

export default function OperationHome({ op }: { op: Operation }) {
  const profile = useActiveProfile()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<number[]>(() => loadSelection(op))

  function changeSelection(next: number[]) {
    const sorted = [...next].sort((a, b) => a - b)
    setSelected(sorted)
    try {
      sessionStorage.setItem(selectionKey(op), JSON.stringify(sorted))
    } catch {
      // Not critical: the selection just won't be remembered.
    }
  }

  const toggle = (g: number) => changeSelection(selected.includes(g) ? selected.filter((s) => s !== g) : [...selected, g])
  const allSelected = selected.length === op.groups.length
  const query = `?g=${selected.join(',')}`
  const progress = profile[op.id]
  const { sequence, style, text } = op

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 pb-12">
        <BackLink to={SUBJECTS.math.path}>{SUBJECTS.math.title}</BackLink>
        <h1 className="mt-4 text-4xl font-black">
          {op.title} {op.icon}
        </h1>
        <p className="mt-1 text-lg font-semibold text-slate-500">
          Nejdelší série 🔥 {progress.bestStreak} · Rekord v závodě ⏱️ {progress.timeAttackBest} · Body ⭐ {progress.totalPoints}
        </p>

        <section className="mt-8 rounded-3xl bg-white/70 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold">1. {text.pickGroups}</h2>
            <button
              type="button"
              onClick={() => changeSelection(allSelected ? [] : op.groups.map((g) => g.id))}
              className={`shrink-0 rounded-full px-4 py-1.5 font-bold transition ${style.soft}`}
            >
              {allSelected ? 'Zrušit výběr' : 'Vybrat vše'}
            </button>
          </div>
          <div className={`mt-4 grid gap-3 ${style.chipGrid}`}>
            {op.groups.map((g) => {
              const on = selected.includes(g.id)
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggle(g.id)}
                  aria-pressed={on}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-4 py-3 transition hover:-translate-y-0.5 active:scale-95 ${
                    on ? style.chipOn : 'border-transparent bg-white shadow-sm'
                  }`}
                >
                  <span className={`font-black ${style.chipLabel}`}>{g.label}</span>
                  {g.example && <span className={`text-sm font-bold tabular-nums ${on ? 'text-white/80' : 'text-slate-400'}`}>{g.example}</span>}
                  <StarRating stars={progress.stars[g.id] ?? 0} size="sm" />
                </button>
              )
            })}
          </div>
        </section>

        <h2 className="mt-8 text-xl font-extrabold">2. Vyber hru</h2>
        <section className={`mt-4 grid gap-5 ${sequence ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {sequence && (
            <ModeCard
              icon="🪜"
              title="Řada"
              description={sequence.description}
              color="from-violet-500 to-purple-600"
              disabledHint={selected.length === 1 ? undefined : text.pickOne}
              onPlay={() => navigate(`${op.path}/rada/${selected[0]}`)}
            />
          )}
          <ModeCard
            icon="🎯"
            title="Trénink"
            description={`${PRACTICE_COUNT} příkladů napřeskáčku. Chyby se vrátí na konec.`}
            color="from-sky-500 to-blue-600"
            disabledHint={selected.length > 0 ? undefined : text.pickAny}
            onPlay={() => navigate(`${op.path}/trenink${query}`)}
          />
          <ModeCard
            icon="⏱️"
            title="Závod s časem"
            description={`${TIME_ATTACK_SECONDS} sekund. Kolik příkladů stihneš?`}
            color="from-amber-400 to-orange-500"
            extra={`Rekord: ${progress.timeAttackBest}`}
            disabledHint={selected.length > 0 ? undefined : text.pickAny}
            onPlay={() => navigate(`${op.path}/zavod${query}`)}
          />
        </section>
      </main>
    </>
  )
}
