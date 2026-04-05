import { useState, useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'

export default function AddressAutocomplete({ value, onChange, onCoordinatesFound, placeholder }) {
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
    if (query.length < 3) { setSuggestions([]); setOpen(false); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        const results = data.slice(0, 6).map(r => {
          const addr = r.address || {}
          const namePart = addr.amenity || addr.shop || addr.tourism || addr.historic || addr.leisure || null
          const streetPart = addr.road || addr.pedestrian || addr.footway || null
          const areaPart = addr.suburb || addr.neighbourhood || null
          const cityPart = addr.city || addr.town || addr.village || addr.municipality || null
          const parts = [namePart, streetPart, areaPart, cityPart].filter(Boolean)
          const display = parts.length >= 2
            ? parts.join(', ')
            : r.display_name.split(',').slice(0, 3).join(',').trim()
          return {
            display,
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
            city: cityPart || '',
          }
        })
        setSuggestions(results)
        setOpen(results.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (s) => {
    setQuery(s.display)
    onChange(s.display, s.city)
    if (onCoordinatesFound) onCoordinatesFound({ lat: s.lat, lng: s.lng })
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value, '') }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder || 'Search for a place or address…'}
          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-300">
            searching…
          </span>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSelect(s)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 border-b border-gray-50 last:border-0 flex items-start gap-2"
            >
              <MapPin size={11} className="text-gray-300 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2 leading-snug">{s.display}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
