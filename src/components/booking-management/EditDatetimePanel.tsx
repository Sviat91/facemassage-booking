"use client"
import { useTranslation } from 'react-i18next'
import type { BookingResult, ProcedureOption, SlotSelection } from './types'

interface EditDatetimePanelProps {
  booking: BookingResult
  selectedProcedure: ProcedureOption | null
  selectedDate?: Date
  selectedSlot?: SlotSelection | null
  onBack: () => void
  onConfirm: () => void
}

export default function EditDatetimePanel({
  booking,
  selectedProcedure,
  selectedDate,
  selectedSlot,
  onBack,
  onConfirm,
}: EditDatetimePanelProps) {
  const { t } = useTranslation()
  const hasSelection = Boolean(selectedDate && selectedSlot)

  const currentDateLabel = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(booking.startTime)

  const currentTimeLabel = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(booking.startTime)

  const selectedDateLabel = selectedDate
    ? new Intl.DateTimeFormat('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(selectedDate)
    : null

  const selectedTimeLabel = selectedSlot
    ? new Intl.DateTimeFormat('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(selectedSlot.startISO))
    : null

  return (
    <div className="overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      <div className="text-sm text-neutral-600 dark:text-dark-muted">
        {t('management.selectNewDatetime')}
      </div>

      <div className="space-y-2">
        <div className="rounded-xl border border-border bg-neutral-50 p-3 dark:bg-dark-border/30 dark:border-dark-border">
          <div className="text-xs text-neutral-500 dark:text-dark-muted mb-1">{t('management.currentBooking')}</div>
          <div className="text-sm font-medium dark:text-dark-text">{booking.procedureName}</div>
          <div className="text-xs text-neutral-500 dark:text-dark-muted">
            {currentDateLabel} • {currentTimeLabel}
          </div>
        </div>

        {selectedProcedure ? (
          <div className="rounded-xl border border-primary bg-primary/10 p-3 dark:border-accent dark:bg-accent/10">
            <div className="text-xs text-primary dark:text-accent mb-1">{t('management.newProcedureLabel')}</div>
            <div className="text-sm font-medium text-primary dark:text-accent">
              {selectedProcedure.name_pl} ({selectedProcedure.duration_min} min)
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-primary bg-primary/10 p-3 dark:border-accent dark:bg-accent/10">
        <div className="text-sm text-primary dark:text-accent mb-1">{t('management.selectDateAndTimeLabel')}</div>
        <div className="text-xs text-primary/80 dark:text-accent/80">
          {t('management.useCalendarToSelect')}
        </div>
      </div>

      {selectedDateLabel ? (
        <div className="rounded-xl border border-border bg-neutral-50 p-3 dark:bg-dark-border/30 dark:border-dark-border">
          <div className="text-xs text-neutral-500 dark:text-dark-muted mb-1">{t('management.selectedDate')}</div>
          <div className="text-sm font-medium dark:text-dark-text">{selectedDateLabel}</div>
          {selectedTimeLabel ? (
            <div className="text-xs text-neutral-500 dark:text-dark-muted mt-1">
              {t('management.hour')} {selectedTimeLabel}
            </div>
          ) : (
            <div className="text-xs text-neutral-500 dark:text-dark-muted mt-1">
              {t('management.selectHourFromList')}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-neutral-500 dark:text-dark-muted text-sm">
          {t('management.selectDateInCalendar')}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onBack} className="btn btn-outline flex-1">
          {t('management.back')}
        </button>
        <button
          type="button"
          disabled={!hasSelection}
          onClick={onConfirm}
          className={`btn flex-1 ${hasSelection ? 'btn-primary' : 'btn-primary opacity-50 cursor-not-allowed'}`}
        >
          {t('management.confirmNewTerm')}
        </button>
      </div>
    </div>
  )
}
