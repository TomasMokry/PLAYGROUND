import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Header } from '../../components/Header'
import { StarRating } from '../../components/StarRating'
import { useActiveProfile } from '../../profiles/ProfileContext'
import { PRACTICE_COUNT, TABLES, TIME_ATTACK_SECONDS } from './logic'

const SELECTION_KEY = 'mathkids:selectedTables'

function loadSelection(): number[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SELECTION_KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter((n) => TABLES.includes(n)) : []
  } catch {
    return []
  }
}

export default function MultiplicationHome() {
  const profile = useActiveProfile()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<number[]>(loadSelection)

  function changeSelection(next: number[]) {
    const sorted = [...next].sort((a, b) => a - b)
    setSelected(sorted)
    try {
      sessionStorage.setItem(SELECTION_KEY, JSON.stringify(sorted))
    } catch {
      // Not critical: the selection just won't be remembered.
    }
  }

  const toggle = (t: number) => changeSelection(selected.includes(t) ? selected.filter((s) => s !== t) : [...selected, t])
  const allSelected = selected.length === TABLES.length
  const query = `?t=${selected.join(',')}`
  const m = profile.multiplication

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 pb-12">
        <h1 className="mt-4 text-4xl font-black">Násobilka ✖️</h1>
        <p className="mt-1 text-lg font-semibold text-slate-500">
          Nejdelší série 🔥 {m.bestStreak} · Rekord v závodě ⏱️ {m.timeAttackBest} · Body ⭐ {m.totalPoints}
        </p>

        <section className="mt-8 rounded-3xl bg-white/70 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold">1. Vyber násobilky</h2>
            <button
              type="button"
              onClick={() => changeSelection(allSelected ? [] : [...TABLES])}
              className="rounded-full bg-violet-100 px-4 py-1.5 font-bold text-violet-700 transition hover:bg-violet-200"
            >
              {allSelected ? 'Zrušit výběr' : 'Vybrat vše'}
            </button>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-3">
            {TABLES.map((t) => {
              const on = selected.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(t)}
                  aria-pressed={on}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-4 py-3 transition hover:-translate-y-0.5 active:scale-95 ${
                    on ? 'border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-200' : 'border-transparent bg-white shadow-sm'
                  }`}
                >
                  <span className="text-3xl font-black">×{t}</span>
                  <StarRating stars={m.stars[t] ?? 0} size="sm" />
                </button>
              )
            })}
          </div>
        </section>

        <h2 className="mt-8 text-xl font-extrabold">2. Vyber hru</h2>
        <section className="mt-4 grid gap-5 md:grid-cols-3">
          <ModeCard
            icon="🪜"
            title="Řada"
            description="Projdi násobilku od 1× do 10× a sleduj, jak čísla rostou."
            color="from-violet-500 to-purple-600"
            disabledHint={selected.length === 1 ? undefined : 'Vyber právě jednu násobilku'}
            onPlay={() => navigate(`/nasobilka/rada/${selected[0]}`)}
          />
          <ModeCard
            icon="🎯"
            title="Trénink"
            description={`${PRACTICE_COUNT} příkladů napřeskáčku. Chyby se vrátí na konec.`}
            color="from-sky-500 to-blue-600"
            disabledHint={selected.length > 0 ? undefined : 'Vyber aspoň jednu násobilku'}
            onPlay={() => navigate(`/nasobilka/trenink${query}`)}
          />
          <ModeCard
            icon="⏱️"
            title="Závod s časem"
            description={`${TIME_ATTACK_SECONDS} sekund. Kolik příkladů stihneš?`}
            color="from-amber-400 to-orange-500"
            extra={`Rekord: ${m.timeAttackBest}`}
            disabledHint={selected.length > 0 ? undefined : 'Vyber aspoň jednu násobilku'}
            onPlay={() => navigate(`/nasobilka/zavod${query}`)}
          />
        </section>
      </main>
    </>
  )
}

interface ModeCardProps {
  icon: string
  title: string
  description: string
  color: string
  extra?: string
  disabledHint?: string
  onPlay: () => void
}

function ModeCard({ icon, title, description, color, extra, disabledHint, onPlay }: ModeCardProps) {
  const disabled = disabledHint !== undefined
  return (
    <button
      type="button"
      onClick={onPlay}
      disabled={disabled}
      className={`flex flex-col items-start rounded-3xl bg-gradient-to-br p-6 text-left text-white shadow-lg transition ${color} ${
        disabled ? 'cursor-not-allowed opacity-45 grayscale-[40%]' : 'hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]'
      }`}
    >
      <span className="text-4xl">{icon}</span>
      <span className="mt-3 text-2xl font-black">{title}</span>
      <span className="mt-1 font-semibold text-white/85">{description}</span>
      <span className="mt-4 rounded-full bg-white/25 px-4 py-1.5 font-extrabold">
        {disabled ? disabledHint : extra ? `Hrát → · ${extra}` : 'Hrát →'}
      </span>
    </button>
  )
}
