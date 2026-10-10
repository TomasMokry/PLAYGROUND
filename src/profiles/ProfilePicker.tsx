import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { StarRating } from '../components/StarRating'
import { totalStars, type Profile } from '../lib/storage'
import { useProfiles } from './ProfileContext'

const AVATARS = ['🦊', '🐼', '🦄', '🚀', '🐯', '🐸', '🐙', '🦖', '🐱', '🐶', '🦁', '🐧']
const MAX_NAME = 16

export default function ProfilePicker() {
  const { data, selectProfile, addProfile, removeProfile } = useProfiles()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(data.profiles.length === 0)

  function pick(id: string) {
    selectProfile(id)
    navigate('/')
  }

  function create(name: string, avatar: string) {
    addProfile(name, avatar)
    navigate('/')
  }

  function remove(profile: Profile) {
    if (window.confirm(`Opravdu smazat hráče ${profile.name}? Smaže se i jeho postup.`)) removeProfile(profile.id)
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-12">
      <div className="mb-3 grid size-16 place-items-center rounded-2xl bg-violet-600 text-4xl font-black text-white shadow-lg shadow-violet-200">×</div>
      <h1 className="text-center text-4xl font-black sm:text-5xl">Kdo dnes počítá?</h1>

      {creating ? (
        <NewProfileForm onCreate={create} onCancel={data.profiles.length > 0 ? () => setCreating(false) : undefined} />
      ) : (
        <div className="mt-10 flex flex-wrap justify-center gap-5">
          {data.profiles.map((p) => (
            <div key={p.id} className="group relative">
              <button
                type="button"
                onClick={() => pick(p.id)}
                className="flex w-40 flex-col items-center gap-2 rounded-3xl bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl active:scale-95"
              >
                <span className="text-6xl transition group-hover:scale-110">{p.avatar}</span>
                <span className="text-xl font-extrabold">{p.name}</span>
                <span className="text-sm font-bold text-slate-400">
                  <span className="text-amber-400">★</span> {totalStars(p)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => remove(p)}
                className="absolute -right-2 -top-2 hidden size-8 place-items-center rounded-full bg-rose-500 text-sm font-bold text-white shadow group-hover:grid"
                title="Smazat hráče"
                aria-label={`Smazat hráče ${p.name}`}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex w-40 flex-col items-center justify-center gap-2 rounded-3xl border-4 border-dashed border-violet-300 p-6 font-extrabold text-violet-500 transition hover:border-violet-500 hover:bg-white/60"
          >
            <span className="text-5xl">+</span>
            Nový hráč
          </button>
        </div>
      )}
    </main>
  )
}

function NewProfileForm({ onCreate, onCancel }: { onCreate: (name: string, avatar: string) => void; onCancel?: () => void }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const valid = name.trim().length > 0

  function submit(e: FormEvent) {
    e.preventDefault()
    if (valid) onCreate(name, avatar)
  }

  return (
    <form onSubmit={submit} className="mt-10 flex w-full max-w-md flex-col gap-6 rounded-3xl bg-white p-8 shadow-xl">
      <div className="flex flex-col items-center gap-2">
        <span className="animate-float text-7xl">{avatar}</span>
        <StarRating stars={0} size="sm" />
      </div>
      <label className="flex flex-col gap-2 font-bold">
        Jak se jmenuješ?
        <input
          autoFocus
          value={name}
          maxLength={MAX_NAME}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tvoje jméno"
          className="rounded-2xl border-4 border-violet-200 px-4 py-3 text-xl outline-none transition focus:border-violet-500"
        />
      </label>
      <fieldset>
        <legend className="mb-2 font-bold">Vyber si zvířátko</legend>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              aria-pressed={a === avatar}
              className={`grid aspect-square place-items-center rounded-2xl text-3xl transition hover:scale-110 ${
                a === avatar ? 'bg-violet-100 ring-4 ring-violet-500' : 'bg-slate-50'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 rounded-2xl bg-slate-100 py-4 text-lg font-extrabold transition hover:bg-slate-200">
            Zpět
          </button>
        )}
        <button
          type="submit"
          disabled={!valid}
          className="flex-1 rounded-2xl bg-violet-600 py-4 text-lg font-extrabold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 active:scale-95 disabled:opacity-40"
        >
          Jdeme na to! 🚀
        </button>
      </div>
    </form>
  )
}
