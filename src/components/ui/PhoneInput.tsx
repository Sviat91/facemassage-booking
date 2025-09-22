"use client"
import { useState, useRef, useEffect, useCallback } from 'react'

interface Country {
  code: string
  name: string
  phoneCode: string
  flag: string
}

const COUNTRIES: Country[] = [
  { code: 'PL', name: 'Poland', phoneCode: '+48', flag: '🇵🇱' },
  { code: 'UA', name: 'Ukraine', phoneCode: '+380', flag: '🇺🇦' },
  { code: 'DE', name: 'Germany', phoneCode: '+49', flag: '🇩🇪' },
  { code: 'GB', name: 'United Kingdom', phoneCode: '+44', flag: '🇬🇧' },
  { code: 'FR', name: 'France', phoneCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', phoneCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', phoneCode: '+34', flag: '🇪🇸' },
  { code: 'CZ', name: 'Czech Republic', phoneCode: '+420', flag: '🇨🇿' },
  { code: 'SK', name: 'Slovakia', phoneCode: '+421', flag: '🇸🇰' },
  { code: 'LT', name: 'Lithuania', phoneCode: '+370', flag: '🇱🇹' },
  { code: 'LV', name: 'Latvia', phoneCode: '+371', flag: '🇱🇻' },
  { code: 'EE', name: 'Estonia', phoneCode: '+372', flag: '🇪🇪' },
  { code: 'HU', name: 'Hungary', phoneCode: '+36', flag: '🇭🇺' },
  { code: 'RO', name: 'Romania', phoneCode: '+40', flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgaria', phoneCode: '+359', flag: '🇧🇬' },
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  placeholder?: string
}

export default function PhoneInput({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "Telefon"
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(COUNTRIES[0])
  const [customCountryCode, setCustomCountryCode] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [activeField, setActiveField] = useState<'code' | 'phone' | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)
  const lastValueRef = useRef<string>('')

  const isCustomMode = selectedCountry === null

  // Effect to parse the initial value from the parent
  useEffect(() => {
    lastValueRef.current = value // Update ref when value changes from outside
    
    // Don't redistribute data if user is actively typing in a field
    if (activeField) {
      return
    }
    
    if (value) {
      const matchingCountry = COUNTRIES.find(c => value.startsWith(c.phoneCode))
      if (matchingCountry) {
        setSelectedCountry(matchingCountry)
        setPhoneNumber(value.substring(matchingCountry.phoneCode.length).trim())
      } else if (value.startsWith('+')) {
        const match = value.match(/^(\+\d{1,4})(.*)/)    
        if (match) {
          setSelectedCountry(null)
          setCustomCountryCode(match[1])
          setPhoneNumber(match[2].trim())
        } else {
          // Handle case where only "+" is entered or "+non-digits"
          setSelectedCountry(null)
          setCustomCountryCode(value.startsWith('+') ? value : '+')
          setPhoneNumber('') // Don't put "+" in phone number field
        }
      } else {
        setPhoneNumber(value)
      }
    } else {
      // Reset to default when value is cleared (but only if we're not in custom mode)
      if (selectedCountry !== null) {
        setSelectedCountry(COUNTRIES[0])
        setPhoneNumber('')
        setCustomCountryCode('')
      }
    }
  }, [value, activeField])

  // Effect to notify parent of changes
  useEffect(() => {
    const countryCode = isCustomMode ? customCountryCode : selectedCountry?.phoneCode || ''
    const fullPhone = countryCode + phoneNumber
    
    // In custom mode, only notify parent if user has entered at least a "+"
    if (isCustomMode && !customCountryCode.startsWith('+')) {
      return // Don't notify parent yet in custom mode without "+"
    }
    
    if (fullPhone !== lastValueRef.current) {
      lastValueRef.current = fullPhone
      onChange(fullPhone)
    }
  }, [isCustomMode, customCountryCode, selectedCountry?.phoneCode, phoneNumber, onChange])


  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCountries = COUNTRIES.filter(country => {
    const query = searchQuery.toLowerCase()
    return (
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query) ||
      country.phoneCode.includes(query)
    )
  })

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setIsOpen(false)
    setSearchQuery('')
    inputRef.current?.focus()
  }

  const handleCustomCodeSelect = () => {
    setSelectedCountry(null)
    setCustomCountryCode('') // Start empty - user inputs + themselves
    setIsOpen(false)
    setSearchQuery('')
    setTimeout(() => codeInputRef.current?.focus(), 100)
  }

  const handleCustomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Allow + and digits only, user controls the + themselves
    const formatted = input.replace(/[^\d+]/g, '')
    setCustomCountryCode(formatted)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits, spaces, and dashes - NO plus signs
    const cleaned = e.target.value.replace(/[^\d\s-]/g, '')
    setPhoneNumber(cleaned)
  }

  const handleCodeFocus = () => {
    setActiveField('code')
  }

  const handlePhoneFocus = () => {
    setActiveField('phone')
  }

  const handleFieldBlur = () => {
    // Small delay to allow the other field to get focus first
    setTimeout(() => {
      if (document.activeElement !== codeInputRef.current && 
          document.activeElement !== inputRef.current) {
        setActiveField(null)
      }
    }, 100)
  }

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) setSearchQuery('')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex">
        {/* Country selector */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-l-xl border border-r-0 border-border bg-white/80 dark:bg-dark-card/80 dark:border-dark-border hover:bg-white dark:hover:bg-dark-card transition-all duration-200">
          <span className="text-lg">{isCustomMode ? '🌍' : selectedCountry?.flag}</span>
          
          {isCustomMode ? (
            <input
              ref={codeInputRef}
              type="text"
              value={customCountryCode}
              onChange={handleCustomCodeChange}
              onFocus={handleCodeFocus}
              onBlur={handleFieldBlur}
              placeholder="+ kod kraju"
              className="country-code-input w-20 text-sm font-medium dark:text-dark-text dark:placeholder-dark-muted bg-transparent border-none outline-none"
            />
          ) : (
            <span className="text-sm font-medium dark:text-dark-text">
              {selectedCountry?.phoneCode}
            </span>
          )}
          
          <button
            type="button"
            onClick={toggleDropdown}
            disabled={disabled}
            className={`flex items-center justify-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-200 dark:text-dark-muted ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Phone number input */}
        <input
          ref={inputRef}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          onFocus={handlePhoneFocus}
          onBlur={handleFieldBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 rounded-r-xl border border-border 
            bg-white/80 dark:bg-dark-card/80 dark:border-dark-border 
            dark:text-dark-text dark:placeholder-dark-muted
            focus:outline-none focus:ring-2 focus:ring-primary/20
            transition-all duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${error ? 'border-red-500 dark:border-red-400' : ''}
          `}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-border dark:border-dark-border">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj kraju..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card/80 dark:text-dark-text dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleCountrySelect(country)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-left 
                  transition-colors duration-150
                  ${selectedCountry?.code === country.code
                    ? 'bg-primary/30 dark:bg-primary/30 hover:bg-primary/40 dark:hover:bg-primary/40' 
                    : 'hover:bg-primary/60 dark:hover:bg-dark-border/60'
                  }
                `}
              >
                <span className="text-lg">{country.flag}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium dark:text-dark-text">{country.name}</div>
                  <div className="text-xs text-gray-500 dark:text-dark-muted">{country.phoneCode}</div>
                </div>
                {selectedCountry?.code === country.code && (
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
            
            <button
              type="button"
              onClick={handleCustomCodeSelect}
              className={`
                w-full flex items-center gap-3 px-3 py-2 text-left 
                transition-colors duration-150 border-t border-border dark:border-dark-border
                ${isCustomMode 
                  ? 'bg-primary/30 dark:bg-primary/30 hover:bg-primary/40 dark:hover:bg-primary/40' 
                  : 'hover:bg-primary/60 dark:hover:bg-dark-border/60'
                }
              `}
            >
              <span className="text-lg">🌍</span>
              <div className="flex-1">
                <div className="text-sm font-medium dark:text-dark-text">Inny kraj</div>
                <div className="text-xs text-gray-500 dark:text-dark-muted">Wprowadź kod ręcznie</div>
              </div>
              {isCustomMode && (
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}
