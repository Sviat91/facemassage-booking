"use client"
import { useEffect, useState } from 'react'

type Procedure = {
  id: string
  name_pl: string
  duration_min: number
}

export default function ProcedureSelect() {
  const [items, setItems] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch('/api/procedures').then(r => r.json()).then(d => {
      if (mounted) setItems(d.items || [])
    }).catch(() => {}).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  return (
    <label className="block">
      <span className="text-sm text-muted">Service</span>
      <select className="mt-1 w-full rounded-xl border border-border bg-white/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
        defaultValue="">
        <option value="" disabled>{loading ? 'Loading…' : 'Choose a service'}</option>
        {items.map(p => (
          <option key={p.id} value={p.id}>{p.name_pl} · {p.duration_min} min</option>
        ))}
      </select>
    </label>
  )
}

