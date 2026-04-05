import { useState, useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'

export default function CityAutocomplete({ value, onChange, placeholder, inputClassName }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); setOpen(false); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        const seen = new Set()
        const cities = data
          .filter(r => r.class === 'place' && ['city', 'town', 'village', 'municipality', 'hamlet'].includes(r.type))
          .map(r => {
            const addr = r.address || {}
            const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || r.display_name.split(',')[0].trim()
            const country = addr.country || ''
            return { display: country ? `${cityName}, ${country}` : cityName, city: cityName }
          })
          .filter(s => {
            const key = s.city.toLowerCase()
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          .slice(0, 6)
        setSuggestions(cities)
        setOpen(cities.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (s) => {
    setQuery(s.city)
    onChange(s.city)
    setSuggestions([])
    setOpen(false)
  }

  const baseInputClass = inputClassName || 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value) }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={`pl-8 ${baseInputClass}`}
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-300">searching…</span>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSelect(s)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 border-b border-gray-50 last:border-0 flex items-center gap-2"
            >
              <MapPin size={11} className="text-gray-300 flex-shrink-0" />
              <span>{s.display}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
