"use client"
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

type Procedure = { id: string; name_pl: string; duration_min: number }

export default function ProcedureSelect() {
  const { data, isLoading } = useQuery({
    queryKey: ['procedures'],
    queryFn: () => fetch('/api/procedures').then(r => r.json()),
  })
  const items: Procedure[] = data?.items || []
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Procedure | null>(null)

  return (
    <div className="relative">
      <label className="block text-sm text-muted">Service</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="mt-1 w-full rounded-xl border border-border bg-white/80 px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {selected ? (
          <span className="block whitespace-normal break-words">
            {selected.name_pl} · {selected.duration_min} min
          </span>
        ) : (
          <span className="text-muted">{isLoading ? 'Loading…' : 'Choose a service'}</span>
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${open ? 'max-h-72 opacity-100 mt-2' : 'max-h-0 opacity-0'} bg-white/90 border border-border rounded-xl`}
      >
        <ul className="max-h-72 overflow-auto p-1">
          {items.map(p => (
            <li key={p.id}>
              <button
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/60 focus:bg-primary/60 focus:outline-none whitespace-normal break-words"
                onClick={() => { setSelected(p); setOpen(false) }}
              >
                {p.name_pl} · {p.duration_min} min
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
