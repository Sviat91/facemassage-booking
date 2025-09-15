"use client"
import { useEffect, useMemo, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

function toISO(d: Date) { return d.toISOString().slice(0, 10) }

export default function DayCalendar() {
  const [days, setDays] = useState<string[]>([])
  const today = new Date()
  const until = new Date(); until.setDate(until.getDate() + 90)

  useEffect(() => {
    const qs = new URLSearchParams({ from: toISO(today), until: toISO(until) })
    fetch(`/api/availability?${qs.toString()}`)
      .then(r => r.json())
      .then(d => setDays((d.days || []).filter((x: any) => x.hasWindow).map((x: any) => x.date)))
      .catch(() => {})
  }, [])

  const available = useMemo(() => days.map(s => new Date(s + 'T00:00:00')), [days])

  return (
    <DayPicker
      mode="single"
      selected={undefined}
      fromDate={today}
      toDate={until}
      modifiers={{ available }}
      modifiersClassNames={{ available: 'bg-accent/40 rounded-full' }}
      styles={{ caption: { color: '#2B2B2B' } }}
    />
  )
}

