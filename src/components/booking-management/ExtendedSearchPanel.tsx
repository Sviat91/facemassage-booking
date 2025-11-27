"use client"
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ExtendedSearchPanelProps {
  initialFullName?: string
  initialPhone?: string
  initialEmail?: string
  onSearch: (fullName: string, phone: string, email: string, startDate: string, endDate: string) => void
  onBack: () => void
  isSearching?: boolean
}

export default function ExtendedSearchPanel({
  initialFullName = '',
  initialPhone = '',
  initialEmail = '',
  onSearch,
  onBack,
  isSearching = false,
}: ExtendedSearchPanelProps) {
  const { t } = useTranslation()
  const [fullName, setFullName] = useState(initialFullName)
  const [phone, setPhone] = useState(initialPhone)
  const [email, setEmail] = useState(initialEmail)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Вычисляем минимальную и максимальную даты для input
  // Минимум - сегодня (поиск в прошлое запрещен)
  // Максимум - 180 дней вперед (расширенный диапазон)
  const today = new Date()
  const minDate = new Date(today) // Сегодня
  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + 180) // 180 дней вперед
  
  const minDateStr = minDate.toISOString().split('T')[0]
  const maxDateStr = maxDate.toISOString().split('T')[0]
  
  const canSearch = fullName.trim().length >= 2 && 
                    phone.replace(/\D/g, '').length >= 9 && 
                    startDate && 
                    endDate
  
  const handleSearch = () => {
    if (canSearch) {
      onSearch(fullName.trim(), phone.trim(), email.trim(), startDate, endDate)
    }
  }
  
  return (
    <div className="overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      <div>
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-dark-text">
          {t('management.extendedDateRange')}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-dark-muted mt-1">
          {t('management.enterDataAndSelectDateRange')}
        </p>
      </div>
      
      <div className="space-y-3">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-dark-text mb-1">
            {t('management.fullNameLabel')}
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t('management.fullNamePlaceholder')}
            className="w-full max-w-full box-border px-3 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm dark:border-dark-border dark:bg-dark-card dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
          />
        </div>
        
        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-dark-text mb-1">
            {t('management.phoneLabel')}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('management.phonePlaceholder')}
            className="w-full max-w-full box-border px-3 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm dark:border-dark-border dark:bg-dark-card dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
          />
        </div>
        
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-dark-text mb-1">
            {t('management.emailOptionalLabel')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('management.emailPlaceholder')}
            className="w-full max-w-full box-border px-3 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm dark:border-dark-border dark:bg-dark-card dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
          />
        </div>
        
        {/* Date Range */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-400/30 dark:bg-amber-400/10">
          <div className="text-sm font-medium text-amber-800 dark:text-amber-400 mb-3">
            {t('management.dateRangeSearch')}
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <label htmlFor="extended-search-start-date" className="text-xs text-amber-700 dark:text-amber-400 mb-1 block">
                {t('management.dateFrom')}
              </label>
              <div className="relative">
                <input
                  id="extended-search-start-date"
                  name="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  min={minDateStr}
                  max={maxDateStr}
                  className="w-full max-w-full box-border px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm dark:border-amber-600 dark:bg-dark-card dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            
            <div className="relative">
              <label htmlFor="extended-search-end-date" className="text-xs text-amber-700 dark:text-amber-400 mb-1 block">
                {t('management.dateTo')}
              </label>
              <div className="relative">
                <input
                  id="extended-search-end-date"
                  name="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  min={startDate || minDateStr}
                  max={maxDateStr}
                  className="w-full max-w-full box-border px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm dark:border-amber-600 dark:bg-dark-card dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
          
          <div className="text-xs text-amber-600 dark:text-amber-300 mt-2">
            {t('management.canSearchUpTo180Days')}
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSearching}
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-border/50"
        >
          {t('management.back')}
        </button>
        <button
          type="button"
          onClick={handleSearch}
          disabled={!canSearch || isSearching}
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed dark:bg-accent dark:hover:bg-accent/90 flex items-center justify-center gap-2"
        >
          {isSearching ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('management.searchingBookings')}
            </>
          ) : (
            t('management.searchBookings')
          )}
        </button>
      </div>
    </div>
  )
}
