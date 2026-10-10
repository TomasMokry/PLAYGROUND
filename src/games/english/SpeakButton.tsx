import type { MouseEvent } from 'react'
import { canSpeak, speak } from '../../lib/sound'

/** 🔊 button that reads an English word out loud. Hidden where the browser can't speak. */
export function SpeakButton({ text }: { text: string }) {
  if (!canSpeak()) return null
  // Don't steal focus from an answer input.
  const keep = (e: MouseEvent) => e.preventDefault()
  return (
    <button
      type="button"
      onMouseDown={keep}
      onClick={() => speak(text)}
      className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-2xl shadow-sm transition hover:scale-110 active:scale-95"
      title="Poslechni si"
      aria-label={`Poslechni si: ${text}`}
    >
      🔊
    </button>
  )
}
