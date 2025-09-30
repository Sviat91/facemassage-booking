"use client"
import { useState } from 'react'
import type { BookingResult, ProcedureOption, ExtensionCheckStatus, ExtensionCheckResult, SlotSelection } from './types'

interface EditProcedurePanelProps {
  booking: BookingResult
  selectedProcedure: ProcedureOption | null
  procedures: ProcedureOption[]
  onSelectProcedure: (procedure: ProcedureOption | null) => void
  onBack: () => void
  onConfirmSameTime: () => void
  onRequestNewTime: () => void
  onCheckAvailability: () => void
  isSubmitting?: boolean
  // Новые пропсы для проверки доступности
  extensionCheckStatus?: ExtensionCheckStatus
  extensionCheckResult?: ExtensionCheckResult | null
  selectedAlternativeSlot?: SlotSelection | null
  onSelectAlternativeSlot?: (slot: SlotSelection) => void
  onConfirmAlternativeSlot?: () => void
}

export default function EditProcedurePanel({
  booking,
  selectedProcedure,
  procedures,
  onSelectProcedure,
  onBack,
  onConfirmSameTime,
  onRequestNewTime,
  onCheckAvailability,
  isSubmitting = false,
  extensionCheckStatus = null,
  extensionCheckResult = null,
  selectedAlternativeSlot = null,
  onSelectAlternativeSlot,
  onConfirmAlternativeSlot,
}: EditProcedurePanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const currentDuration = booking.procedureDurationMin
  const newDuration = selectedProcedure?.duration_min ?? currentDuration
  const durationDiff = newDuration - currentDuration
  const isSameOrShorter = durationDiff <= 0
  const isChecking = extensionCheckStatus === 'checking'
  const canExtend = extensionCheckStatus === 'can_extend'
  const canShiftBack = extensionCheckStatus === 'can_shift_back'
  const noAvailability = extensionCheckStatus === 'no_availability'
  
  // Format time helper
  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent" role="dialog" aria-label="Zmiana procedury">
      <div className="text-sm text-neutral-600 dark:text-dark-muted">
        Wybierz nową procedurę dla rezerwacji:
      </div>

      <div className="space-y-2">
        {/* Current procedure info */}
        <div className="rounded-xl border border-border bg-neutral-50 p-3 dark:bg-dark-border/30 dark:border-dark-border">
          <div className="text-xs text-neutral-500 dark:text-dark-muted mb-1">Obecna procedura:</div>
          <div className="text-sm font-medium dark:text-dark-text">
            {booking.procedureName}
          </div>
          <div className="text-xs text-neutral-500 dark:text-dark-muted mt-1">
            {currentDuration} min • {booking.price}zł
          </div>
          <div className="text-xs text-neutral-500 dark:text-dark-muted mt-1">
            {new Intl.DateTimeFormat('pl-PL', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }).format(booking.startTime)}
          </div>
        </div>

        {/* Dropdown selector - like ProcedureSelect */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(o => !o)}
            className="relative w-full rounded-xl border border-border bg-white/80 px-3 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-card/80 dark:border-dark-border dark:text-dark-text"
          >
            {selectedProcedure ? (
              <span className="block whitespace-normal break-words text-sm">
                {selectedProcedure.name_pl} • {selectedProcedure.duration_min} min • {selectedProcedure.price_pln}zł
              </span>
            ) : (
              <span className="text-neutral-500 dark:text-dark-muted text-sm">Wybierz nową procedurę</span>
            )}
            <span
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500 dark:text-dark-muted">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>
          
          <div
            className={`overflow-hidden transition-all duration-200 ease-out ${isOpen ? 'max-h-60 opacity-100 mt-2' : 'max-h-0 opacity-0'} bg-white/90 border border-border rounded-xl dark:bg-dark-card/90 dark:border-dark-border`}
          >
            <ul className="max-h-60 overflow-auto p-1">
              {procedures.map((procedure) => {
                const isCurrent = procedure.name_pl === booking.procedureName
                const isSelected = selectedProcedure?.id === procedure.id
                return (
                  <li key={procedure.id}>
                    <button
                      type="button"
                      disabled={isCurrent}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors whitespace-normal break-words dark:text-dark-text ${
                        isCurrent
                          ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-dark-border/50 dark:text-dark-muted'
                          : isSelected
                            ? 'bg-primary/20 text-primary dark:bg-accent/20 dark:text-accent'
                            : 'hover:bg-primary/10 focus:bg-primary/10 focus:outline-none dark:hover:bg-dark-border/60'
                      }`}
                      onClick={() => {
                        if (!isCurrent) {
                          onSelectProcedure(isSelected ? null : procedure)
                          setIsOpen(false)
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm">{procedure.name_pl}</span>
                        <span className="text-xs text-neutral-500 dark:text-dark-muted whitespace-nowrap">
                          {procedure.duration_min} min • {procedure.price_pln}zł{isCurrent ? ' (obecna)' : ''}
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      {selectedProcedure ? (
        <div className="space-y-3">
          {/* Info message about duration */}
          {isSameOrShorter ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-400/50 dark:bg-green-400/10">
              <div className="text-sm text-green-700 dark:text-green-400">
                ✓ Nowa procedura jest {durationDiff === 0 ? 'tej samej długości' : `krótsza o ${Math.abs(durationDiff)} min`}
              </div>
              <div className="text-xs text-green-600 dark:text-green-300">
                Możesz zachować obecny termin lub wybrać nowy.
              </div>
            </div>
          ) : (
            <>
              {/* Сценарий A: Время доступно (can_extend) */}
              {canExtend && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-400/50 dark:bg-green-400/10">
                  <div className="text-sm text-green-700 dark:text-green-400">
                    ✓ Czas jest dostępny! Procedura może być zmieniona na ten sam termin.
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-300 mt-1">
                    {extensionCheckResult?.message}
                  </div>
                </div>
              )}
              
              {/* Сценарий B: Можно сдвинуть раньше (can_shift_back) */}
              {canShiftBack && extensionCheckResult && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-400/50 dark:bg-amber-400/10">
                  <div className="text-sm text-amber-700 dark:text-amber-400">
                    ⚠ Na obecny termin brak miejsca, ale możemy przesunąć rezerwację wcześniej:
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                    Sugerowany termin: <span className="font-semibold">{extensionCheckResult.suggestedStartISO && formatTime(extensionCheckResult.suggestedStartISO)}</span>
                  </div>
                  
                  {/* Раскрывающийся список альтернативных слотов */}
                  {extensionCheckResult.alternativeSlots && extensionCheckResult.alternativeSlots.length > 0 && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setShowAlternatives(!showAlternatives)}
                        className="text-xs text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <span>{showAlternatives ? '▼' : '▶'}</span>
                        Inne dostępne terminy tego dnia ({extensionCheckResult.alternativeSlots.length})
                      </button>
                      
                      {showAlternatives && (
                        <div className="mt-2 space-y-1">
                          {extensionCheckResult.alternativeSlots.map((slot, idx) => {
                            const isSelected = selectedAlternativeSlot?.startISO === slot.startISO
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => onSelectAlternativeSlot?.(slot)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                  isSelected
                                    ? 'bg-amber-200 text-amber-900 dark:bg-amber-600/30 dark:text-amber-200'
                                    : 'bg-white/50 text-amber-800 hover:bg-amber-100 dark:bg-dark-card/50 dark:text-amber-300 dark:hover:bg-dark-border'
                                }`}
                              >
                                {formatTime(slot.startISO)} - {formatTime(slot.endISO)}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Сценарий C: Нет доступности (no_availability) */}
              {noAvailability && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-400/50 dark:bg-red-400/10">
                  <div className="text-sm text-red-700 dark:text-red-400">
                    ✗ Brak dostępnego czasu w dniu Twojej rezerwacji.
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-300 mt-1">
                    Wybierz nowy termin w kalendarzu używając przycisku poniżej.
                  </div>
                </div>
              )}
              
              {/* Начальное сообщение перед проверкой */}
              {!canExtend && !canShiftBack && !noAvailability && !isChecking && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-400/50 dark:bg-amber-400/10">
                  <div className="text-sm text-amber-700 dark:text-amber-400">
                    ⚠ Nowa procedura jest dłuższa o {durationDiff} min
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-300">
                    Sprawdzimy dostępność dla dłuższego terminu.
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action buttons - two main buttons in a row */}
          <div className="flex gap-2">
            {isSameOrShorter ? (
              <>
                <button 
                  type="button" 
                  onClick={onConfirmSameTime}
                  disabled={isSubmitting || !selectedProcedure}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 hover:shadow-md dark:bg-accent dark:hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Zapisywanie...
                    </>
                  ) : (
                    'Potwierdź na ten sam czas'
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={onRequestNewTime} 
                  className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-border/50"
                >
                  Wybierz nowy termin
                </button>
              </>
            ) : (
              <>
                {/* Сценарий A: can_extend - зеленая кнопка подтверждения */}
                {canExtend ? (
                  <>
                    <button 
                      type="button" 
                      onClick={onConfirmSameTime}
                      disabled={isSubmitting}
                      className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-green-700 hover:shadow-md dark:bg-green-600 dark:hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Zapisywanie...
                        </>
                      ) : (
                        'Potwierdź na ten sam czas'
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={onRequestNewTime} 
                      className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-border/50"
                    >
                      Wybierz nowy termin
                    </button>
                  </>
                ) : canShiftBack ? (
                  /* Сценарий B: can_shift_back - желтая кнопка подтверждения на предложенное или выбранное время */
                  <>
                    <button 
                      type="button" 
                      onClick={onConfirmAlternativeSlot}
                      disabled={isSubmitting}
                      className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-amber-600 hover:shadow-md dark:bg-amber-600 dark:hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Zapisywanie...
                        </>
                      ) : (
                        selectedAlternativeSlot 
                          ? `Potwierdź na ${formatTime(selectedAlternativeSlot.startISO)}`
                          : `Potwierdź na ${extensionCheckResult?.suggestedStartISO ? formatTime(extensionCheckResult.suggestedStartISO) : ''}`
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={onRequestNewTime} 
                      className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-border/50"
                    >
                      Lub wybierz inny termin
                    </button>
                  </>
                ) : noAvailability ? (
                  /* Сценарий C: no_availability - увеличенная кнопка выбора нового термина */
                  <button 
                    type="button" 
                    onClick={onRequestNewTime} 
                    className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 hover:shadow-md dark:bg-accent dark:hover:bg-accent/90"
                  >
                    Wybierz nowy termin
                  </button>
                ) : (
                  /* Начальное состояние - кнопка проверки */
                  <>
                    <button 
                      type="button" 
                      onClick={onCheckAvailability}
                      disabled={isChecking}
                      className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 hover:shadow-md dark:bg-accent dark:hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isChecking ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sprawdzanie...
                        </>
                      ) : (
                        'Sprawdź dostępność'
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={onRequestNewTime} 
                      className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-border/50"
                    >
                      Wybierz nowy termin
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Back button - full width below */}
          <button 
            type="button" 
            onClick={onBack} 
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-border/50"
          >
            Powrót
          </button>
        </div>
      ) : (
        <div className="text-xs text-neutral-500 dark:text-dark-muted text-center py-2">
          Wybierz procedurę z listy powyżej, aby kontynuować.
        </div>
      )}
    </div>
  )
}
