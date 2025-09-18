"use client"
import Image from 'next/image'
import { useState } from 'react'
import BrandHeader from '../components/BrandHeader'
import Card from '../components/ui/Card'
import ProcedureSelect from '../components/ProcedureSelect'
import DayCalendar from '../components/DayCalendar'
import SlotsList from '../components/SlotsList'
import BookingForm from '../components/BookingForm'

export default function Page() {
  const [procId, setProcId] = useState<string | undefined>(undefined)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<{ startISO: string; endISO: string } | null>(null)
  return (
    <main className="min-h-screen p-6 relative">
      {/* фиксированный логотип в левом верхнем углу */}
      <div className="absolute left-4 top-4 z-10">
        <Image
          src="/head_logo.png"
          alt="Somique beauty logo"
          width={242}  // +~10%
          height={97}
          className="h-auto"
        />
      </div>
      {/* основной центрированный контейнер */}
      <div className="mx-auto max-w-5xl">
        <BrandHeader />
        <div className="mt-8 flex flex-col items-center gap-6 lg:flex-row lg:justify-center">
          <div className="w-full max-w-md">
            <Card className="w-full">
              <DayCalendar
                key={procId ?? 'none'}
                procedureId={procId}
                onChange={(d) => {
                  setDate(d)
                  setSelectedSlot(null)
                }}
              />
              <SlotsList date={date} procedureId={procId} selected={selectedSlot} onPick={setSelectedSlot} />
            </Card>
          </div>
          <div className="w-full max-w-sm">
            <div className="space-y-4">
              <Card title="Service" className="w-full">
                <ProcedureSelect
                  onChange={(p) => {
                    setProcId(p?.id)
                    setDate(undefined)
                    setSelectedSlot(null)
                  }}
                />
              </Card>
              {selectedSlot && (
                <Card title="Booking" className="w-full">
                  <BookingForm slot={selectedSlot} procedureId={procId} />
                </Card>
              )}
              {/*
              <Card title="Contact">
                <div className="grid grid-cols-2 gap-3">
                  <input className="rounded-xl border border-border bg-white/80 px-3 py-2" placeholder="Name" />
                  <input className="rounded-xl border border-border bg-white/80 px-3 py-2" placeholder="Phone" />
                </div>
                <button className="btn btn-primary mt-4">Submit</button>
              </Card>
              */}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
