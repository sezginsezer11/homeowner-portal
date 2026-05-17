'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Loader } from 'lucide-react'

export default function AddressAutocomplete({ value, onChange, placeholder = 'Start typing an address...', className }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading]         = useState(false)
  const [showList, setShowList]       = useState(false)
  const [query, setQuery]             = useState(value || '')
  const debounceRef = useRef(null)
  const wrapperRef  = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowList(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange({ address: val, city: '', state: '', zip: '', full: val })

    clearTimeout(debounceRef.current)
    if (val.length < 3) { setSuggestions([]); setShowList(false); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/places?query=${encodeURIComponent(val)}`)
        const data = await res.json()
        setSuggestions(data.suggestions || [])
        setShowList(true)
      } catch {}
      finally { setLoading(false) }
    }, 350)
  }

  const handleSelect = (suggestion) => {
    setQuery(suggestion.full)
    setSuggestions([])
    setShowList(false)
    onChange(suggestion)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setShowList(true)}
          placeholder={placeholder}
          className={className || "w-full pl-10 pr-10 py-3 bg-white border border-[#e4e6eb] rounded-xl text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all text-sm"}
          autoComplete="off"
        />
        {loading && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] animate-spin" />}
      </div>

      {showList && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-[#e4e6eb] rounded-xl shadow-cardHv overflow-hidden">
          {suggestions.map((s, i) => (
            <button key={i} type="button" onClick={() => handleSelect(s)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#f0f2f5] transition-colors text-left border-b border-[#f0f2f5] last:border-0">
              <MapPin className="w-4 h-4 text-[#1877F2] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[#1a1a2e] text-sm font-medium">{s.address}</div>
                <div className="text-[#65676b] text-xs">{s.city}{s.state ? `, ${s.state}` : ''} {s.zip}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
