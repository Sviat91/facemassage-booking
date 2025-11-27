"use client"
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import PhoneInput from '../ui/PhoneInput'
import type { SearchFormData } from './types'

interface SearchPanelProps {
  form: SearchFormData
  onFormChange: (next: Partial<SearchFormData>) => void
  canSearch: boolean
  isLoading: boolean
  errorMessage?: string | null
  onSearch: () => void
  onExtendedSearch?: () => void
  turnstileNode?: ReactNode
  turnstileRequired?: boolean
}

export default function SearchPanel({
  form,
  onFormChange,
  canSearch,
  isLoading,
  errorMessage,
  onSearch,
  onExtendedSearch,
  turnstileNode,
  turnstileRequired,
}: SearchPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      <div className="text-sm text-neutral-600 dark:text-dark-muted">
        {t('management.enterDataToFind')}
      </div>

      <div className="space-y-3">
        <input
          className="w-full max-w-full box-border rounded-xl border border-border bg-white/80 px-3 py-2 dark:bg-dark-card/80 dark:border-dark-border dark:text-dark-text dark:placeholder-dark-muted"
          placeholder={t('form.name')}
          value={form.fullName}
          onChange={(event) => onFormChange({ fullName: event.target.value })}
          autoComplete="name"
        />

        <PhoneInput
          value={form.phone}
          onChange={(value) => onFormChange({ phone: value })}
          placeholder={t('form.phone')}
          error={errorMessage && errorMessage.includes('telefon') ? errorMessage : undefined}
        />

        <input
          className="w-full max-w-full box-border rounded-xl border border-border bg-white/80 px-3 py-2 dark:bg-dark-card/80 dark:border-dark-border dark:text-dark-text dark:placeholder-dark-muted"
          placeholder={t('form.emailOptional')}
          type="email"
          value={form.email}
          onChange={(event) => onFormChange({ email: event.target.value })}
          autoComplete="email"
        />
      </div>

      {turnstileNode ? <div className="mt-2">{turnstileNode}</div> : null}

      {turnstileRequired ? (
        <div className="text-xs text-neutral-500 dark:text-dark-muted">
          {t('management.turnstileRequired')}
        </div>
      ) : null}

      {errorMessage && !errorMessage.includes('telefon') ? (
        <div className="text-sm text-red-600 dark:text-red-400">{errorMessage}</div>
      ) : null}

      <button
        type="button"
        disabled={!canSearch || isLoading}
        onClick={onSearch}
        className={`btn btn-primary w-full ${!canSearch || isLoading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        {isLoading ? t('management.searching') : t('management.searchBookings')}
      </button>

      <div className="text-center">
      </div>
    </div>
  )
}
