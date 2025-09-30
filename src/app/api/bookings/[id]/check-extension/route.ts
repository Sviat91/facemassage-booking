import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getBusyTimesWithIds } from '../../../../../lib/google/calendar'
import { readProcedures, readWeekly, readExceptions } from '../../../../../lib/google/sheets'
import { getLogger } from '../../../../../lib/logger'
import { reportError } from '../../../../../lib/sentry'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'

export const runtime = 'nodejs'

const log = getLogger({ module: 'api.bookings.check-extension' })

// Input validation schema
const CheckExtensionSchema = z.object({
  eventId: z.string().min(1),
  currentStartISO: z.string(),
  currentEndISO: z.string(),
  newProcedureId: z.string().min(1),
})

// Response types
type ExtensionCheckResult = 
  | { status: 'can_extend'; message: string }
  | { status: 'can_shift_back'; suggestedStartISO: string; suggestedEndISO: string; message: string; alternativeSlots: Array<{ startISO: string; endISO: string }> }
  | { status: 'no_availability'; message: string }

interface CheckExtensionResponse {
  result: ExtensionCheckResult
  currentBooking: {
    startISO: string
    endISO: string
  }
  newProcedure: {
    id: string
    name: string
    duration: number
  }
}

/**
 * SIMPLIFIED POST - Check if booking can be extended to accommodate longer procedure
 * 
 * Simple approach:
 * 1. Get busy times for the day (5:00-22:00)
 * 2. Get working hours from Weekly + Exceptions
 * 3. Return raw data for client to analyze
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: z.infer<typeof CheckExtensionSchema>

  try {
    const eventId = params.id
    body = CheckExtensionSchema.parse(await req.json())

    const TZ = 'Europe/Warsaw'
    const currentStart = new Date(body.currentStartISO)
    const currentEnd = new Date(body.currentEndISO)
    const currentStartLocal = toZonedTime(currentStart, TZ)
    const dateISO = format(currentStartLocal, 'yyyy-MM-dd')

    log.info({ 
      eventId,
      dateISO,
      currentStartISO: body.currentStartISO,
      currentEndISO: body.currentEndISO,
      newProcedureId: body.newProcedureId,
      message: '🔍 STEP 1: Parse input data (no Turnstile - user already verified during search)'
    })

    // Get new procedure info
    const procedures = await readProcedures()
    const newProcedure = procedures.find(p => p.id === body.newProcedureId)
    
    if (!newProcedure) {
      return NextResponse.json(
        { error: 'Nie znaleziono procedury.' },
        { status: 404 }
      )
    }

    const currentDuration = (currentEnd.getTime() - currentStart.getTime()) / 60000
    const newDuration = newProcedure.duration_min
    const extensionNeeded = newDuration - currentDuration

    log.info({
      currentDuration,
      newDuration,
      extensionNeeded,
      message: '📊 STEP 2: Duration analysis'
    })

    // If new procedure is same or shorter, no check needed
    if (extensionNeeded <= 0) {
      log.info({ message: '✅ No extension needed - procedure is same or shorter' })
      return NextResponse.json<CheckExtensionResponse>({
        result: {
          status: 'can_extend',
          message: 'Nowa procedura jest krótsza lub równa obecnej. Można zmienić bez przesunięcia czasu.'
        },
        currentBooking: {
          startISO: body.currentStartISO,
          endISO: body.currentEndISO,
        },
        newProcedure: {
          id: newProcedure.id,
          name: newProcedure.name_pl,
          duration: newProcedure.duration_min,
        }
      })
    }

    // STEP 3: Get busy times for the day (5:00-22:00)
    const dayStart = fromZonedTime(dateISO + 'T05:00:00', TZ)
    const dayEnd = fromZonedTime(dateISO + 'T22:00:00', TZ)

    const busyTimes = await getBusyTimesWithIds(dayStart.toISOString(), dayEnd.toISOString())
    
    log.info({
      dateISO,
      dayStartISO: dayStart.toISOString(),
      dayEndISO: dayEnd.toISOString(),
      busyTimesCount: busyTimes.length,
      busyTimesRaw: busyTimes.map((b: { start: string; end: string; id?: string }) => ({
        id: b.id,
        start: b.start,
        end: b.end
      })),
      message: '📅 STEP 3: Got busy times (5:00-22:00)'
    })

    // STEP 4: Get working hours from Weekly + Exceptions
    const weekly = await readWeekly()
    const exceptions = await readExceptions()
    
    const weekday = currentStartLocal.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    let hours = weekly[weekday]?.hours || ''
    let isDayOff = weekly[weekday]?.isDayOff || false
    
    // Override with exceptions if present
    if (exceptions[dateISO]) {
      const ex = exceptions[dateISO]
      if (ex.hours) hours = ex.hours
      isDayOff = ex.isDayOff
    }
    
    log.info({
      dateISO,
      weekday,
      weeklyHours: weekly[weekday]?.hours,
      exceptionHours: exceptions[dateISO]?.hours,
      finalHours: hours,
      isDayOff,
      message: '🕐 STEP 4: Got working hours'
    })

    // STEP 5: Check if day is closed
    if (isDayOff || !hours) {
      log.warn({ message: '❌ Salon is closed on this day' })
      return NextResponse.json<CheckExtensionResponse>({
        result: {
          status: 'no_availability',
          message: 'Salon jest zamknięty w tym dniu.'
        },
        currentBooking: {
          startISO: body.currentStartISO,
          endISO: body.currentEndISO,
        },
        newProcedure: {
          id: newProcedure.id,
          name: newProcedure.name_pl,
          duration: newProcedure.duration_min,
        }
      })
    }

    // STEP 6: Filter out current booking from busy times
    const otherBookings = busyTimes.filter((busy: { start: string; end: string; id?: string }) => {
      if (busy.id && busy.id === eventId) {
        log.info({ excludedByEventId: busy.id, message: '✅ Excluded current booking' })
        return false
      }
      const busyStart = new Date(busy.start).getTime()
      const busyEnd = new Date(busy.end).getTime()
      const isSameTime = Math.abs(busyStart - currentStart.getTime()) < 1000 && 
                         Math.abs(busyEnd - currentEnd.getTime()) < 1000
      if (isSameTime) {
        log.info({ excludedByTime: busy, message: '✅ Excluded by time match' })
        return false
      }
      return true
    })

    log.info({
      totalBusy: busyTimes.length,
      otherBookings: otherBookings.length,
      message: '✅ STEP 6: Filtered current booking'
    })

    // STEP 7: Check if can extend at current time
    const newEnd = new Date(currentStart.getTime() + (newDuration * 60 * 1000))
    
    // Check for conflicts with other bookings
    const hasConflict = otherBookings.some((busy: { start: string; end: string }) => {
      const busyStart = new Date(busy.start).getTime()
      const busyEnd = new Date(busy.end).getTime()
      return (currentStart.getTime() < busyEnd && newEnd.getTime() > busyStart)
    })

    if (hasConflict) {
      log.warn({ message: '❌ STEP 7: Cannot extend - time conflict with another booking' })
    } else {
      log.info({ message: '✅ No booking conflicts detected' })
    }

    // STEP 8: Check if new end time is within working hours
    // Normalize hours format: replace dots and spaces with colons (Google Sheets returns "09.00" or "09 00")
    const normalizedHours = hours.replace(/(\d{1,2})[.\s]+(\d{2})/g, '$1:$2')
    
    // Parse working hours (format: "HH:MM-HH:MM")
    const scheduleMatch = normalizedHours.match(/(\d{1,2}):(\d{2})[–-](\d{1,2}):(\d{2})/)
    if (!scheduleMatch) {
      log.error({ hours, message: '❌ Cannot parse working hours format' })
      return NextResponse.json<CheckExtensionResponse>({
        result: {
          status: 'no_availability',
          message: 'Nie można odczytać godzin pracy.'
        },
        currentBooking: {
          startISO: body.currentStartISO,
          endISO: body.currentEndISO,
        },
        newProcedure: {
          id: newProcedure.id,
          name: newProcedure.name_pl,
          duration: newProcedure.duration_min,
        }
      })
    }

    const [, , , endHourStr, endMinStr] = scheduleMatch
    
    // Create schedule end using fromZonedTime (same approach as getDaySlots)
    const scheduleEndStr = `${dateISO}T${endHourStr.padStart(2, '0')}:${endMinStr.padStart(2, '0')}:00`
    const scheduleEnd = fromZonedTime(scheduleEndStr, TZ)
    
    const newEndLocal = toZonedTime(newEnd, TZ)
    const withinSchedule = newEnd.getTime() <= scheduleEnd.getTime()
    
    // Convert to minutes for easier comparison (like in availability.ts)
    const scheduleEndMinutes = parseInt(endHourStr) * 60 + parseInt(endMinStr)
    const newEndMinutes = newEndLocal.getHours() * 60 + newEndLocal.getMinutes()

    log.info({
      workingHoursRaw: hours,
      workingHoursNormalized: normalizedHours,
      dateISO,
      scheduleEndStr,
      scheduleEndTime: scheduleEnd.toISOString(),
      scheduleEndMinutes: `${Math.floor(scheduleEndMinutes / 60)}:${scheduleEndMinutes % 60} (${scheduleEndMinutes} min)`,
      currentStartTime: currentStart.toISOString(),
      currentStartLocal: currentStartLocal.toISOString(),
      newEndTime: newEnd.toISOString(),
      newEndLocalTime: newEndLocal.toISOString(),
      newEndMinutes: `${Math.floor(newEndMinutes / 60)}:${newEndMinutes % 60} (${newEndMinutes} min)`,
      comparison: `${newEndMinutes} <= ${scheduleEndMinutes} = ${newEndMinutes <= scheduleEndMinutes}`,
      withinSchedule,
      withinScheduleTimestamp: `${newEnd.getTime()} <= ${scheduleEnd.getTime()}`,
      message: '🕐 STEP 8: Check working hours boundary'
    })

    if (!hasConflict && withinSchedule) {
      log.info({ message: '✅ STEP 8: Can extend at same time!' })
      return NextResponse.json<CheckExtensionResponse>({
        result: {
          status: 'can_extend',
          message: `Czas jest dostępny! Możesz zmienić procedurę na "${newProcedure.name_pl}" (${newDuration} min) bez zmiany godziny rozpoczęcia.`
        },
        currentBooking: {
          startISO: body.currentStartISO,
          endISO: body.currentEndISO,
        },
        newProcedure: {
          id: newProcedure.id,
          name: newProcedure.name_pl,
          duration: newProcedure.duration_min,
        }
      })
    }

    // Cannot extend - either conflict or outside working hours
    const reason = hasConflict 
      ? 'konflikt z innym terminem' 
      : 'nowa procedura wykracza poza godziny pracy'
    
    log.warn({ 
      hasConflict, 
      withinSchedule, 
      reason,
      message: '❌ STEP 9: Cannot extend at same time' 
    })
    
    return NextResponse.json<CheckExtensionResponse>({
      result: {
        status: 'no_availability',
        message: `Nie można wydłużyć wizyty na aktualny czas (${reason}). Wybierz nowy termin z kalendarza.`
      },
      currentBooking: {
        startISO: body.currentStartISO,
        endISO: body.currentEndISO,
      },
      newProcedure: {
        id: newProcedure.id,
        name: newProcedure.name_pl,
        duration: newProcedure.duration_min,
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      log.warn({ issues: error.issues, message: '❌ Validation error' })
      return NextResponse.json(
        { error: 'Nieprawidłowe dane wejściowe.' },
        { status: 400 }
      )
    }

    log.error({ err: error, message: '❌ Unexpected error in extension check' })
    await reportError(error instanceof Error ? error : new Error(String(error)), {
      tags: { module: 'api.bookings.check-extension' },
    })
    
    return NextResponse.json(
      { error: 'Wystąpił błąd wewnętrzny serwera.' },
      { status: 500 }
    )
  }
}
