import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** Small "← Matematika" link back to the parent screen. */
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="mt-2 inline-block rounded-full bg-white px-4 py-1.5 font-bold text-slate-600 shadow-sm transition hover:scale-105">
      ← {children}
    </Link>
  )
}
