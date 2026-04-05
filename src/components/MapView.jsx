import { useState, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet default marker icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})
import { X, ChevronLeft, ChevronRight, Layers, Map } from 'lucide-react'

// ── Japan center (fallback when no pins) ──────────────────────────────────────
const JAPAN_CENTER = [36.2048, 138.2529]
const JAPAN_ZOOM = 6

// ── Time-of-day pin colors ────────────────────────────────────────────────────
const TOD_COLOR = {
  morning: '#3b82f6',
  afternoon: '#22c55e',
  night: '#8b5cf6',
  other: '#f97316',
}

function getActivityColor(activity) {
  const tod = activity.timeOfDay || []
  if (tod.includes('morning'))   return TOD_COLOR.morning
  if (tod.includes('afternoon')) return TOD_COLOR.afternoon
  if (tod.includes('night'))     return TOD_COLOR.night
  return TOD_COLOR.other
}

// ── Per-day colors for "all days" mode ───────────────────────────────────────
const DAY_PALETTE = [
  '#ef4444','#f97316','#eab308','#22c55e','#06b6d4',
  '#6366f1','#a855f7','#ec4899','#14b8a6','#f43f5e',
  '#84cc16','#0ea5e9',
]

// ── Custom map markers ────────────────────────────────────────────────────────
function createMarkerIcon(number, color, isHotel = false) {
  if (isHotel) {
    return L.divIcon({
      className: '',
      html: `<div style="background:#1e1b4b;width:34px;height:34px;border-radius:8px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:17px;">🏨</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -20],
    })
  }
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:30px;height:30px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;line-height:1;">${number}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  })
}

// ── Formats time for popup display ───────────────────────────────────────────
const TOD_LABEL = { morning: 'Morning', afternoon: 'Afternoon', night: 'Night', other: 'Other' }

function buildTimeStr(activity) {
  const tod = (activity.timeOfDay || []).map(t => TOD_LABEL[t] || t).join(' · ')
  const t = activity.startTime
  let exact = ''
  if (t) {
    const [h, m] = t.split(':').map(Number)
    const hr = h % 12 || 12
    exact = `${hr}:${m.toString().padStart(2,'0')} ${h < 12 ? 'AM' : 'PM'}`
  }
  if (tod && exact) return `${tod} · ${exact}`
  return tod || exact
}

// ── MapController: imperative pan / fit inside MapContainer ──────────────────
function MapController({ positions, highlightedId, markerRefs }) {
  const map = useMap()
  const prevKey = useRef('')

  useEffect(() => {
    const key = JSON.stringify(positions)
    if (key === prevKey.current) return
    prevKey.current = key
    if (!positions || positions.length === 0) {
      map.setView(JAPAN_CENTER, JAPAN_ZOOM)
      return
    }
    if (positions.length === 1) {
      map.setView(positions[0], 15)
    } else {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
    }
  }, [JSON.stringify(positions)])

  useEffect(() => {
    if (!highlightedId) return
    const marker = markerRefs.current[highlightedId]
    if (!marker) return
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15), { animate: true })
    setTimeout(() => marker.openPopup(), 350)
  }, [highlightedId])

  return null
}

// ── Format date for display ───────────────────────────────────────────────────
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MapView({
  dates, activitiesByDate, members, dateStates, tripDates, onClose,
}) {
  const [selectedDate, setSelectedDate] = useState(dates[0] || '')
  const [activeTab, setActiveTab] = useState('A')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [highlightedId, setHighlightedId] = useState(null)
  const markerRefs = useRef({})
  const dateSelectorRef = useRef(null)

  // Scroll selected date into view on change
  useEffect(() => {
    if (!dateSelectorRef.current || selectedDate === 'all') return
    const el = dateSelectorRef.current.querySelector(`[data-date="${selectedDate}"]`)
    if (el) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [selectedDate])

  // Reset tab when date changes
  useEffect(() => { setActiveTab('A') }, [selectedDate])

  const currentState = selectedDate !== 'all' ? (dateStates[selectedDate] || {}) : {}
  const isSplit = Boolean(currentState.split)

  // Activities for the selected date / tab
  const selectedActivities = useMemo(() => {
    if (selectedDate === 'all') {
      return dates.flatMap(d =>
        (activitiesByDate[d] || [])
          .filter(a => a.type !== 'travel')
          .map(a => ({ ...a, _date: d }))
      )
    }
    const dayActs = (activitiesByDate[selectedDate] || []).filter(a => a.type !== 'travel')
    if (isSplit) {
      const group = activeTab === 'A'
        ? currentState.split.groupA
        : currentState.split.groupB
      return dayActs.filter(a => {
        const ids = a.memberIds || []
        if (ids.length === 0) return true
        return ids.some(id => group.includes(id))
      })
    }
    return dayActs
  }, [selectedDate, activeTab, activitiesByDate, dateStates, dates, isSplit])

  const mappedActivities = useMemo(() =>
    selectedActivities.filter(a => a.coordinates?.lat && a.coordinates?.lng),
    [selectedActivities]
  )

  const mapPositions = useMemo(() =>
    mappedActivities.map(a => [a.coordinates.lat, a.coordinates.lng]),
    [mappedActivities]
  )

  // Route polyline positions (only for single-day mode)
  const routePositions = useMemo(() =>
    selectedDate !== 'all' ? mapPositions : [],
    [selectedDate, mapPositions]
  )

  // Color for each mapped activity
  function getColor(activity, index) {
    if (selectedDate === 'all') {
      const dayIdx = dates.indexOf(activity._date)
      return DAY_PALETTE[dayIdx % DAY_PALETTE.length]
    }
    return getActivityColor(activity)
  }

  const registerMarker = (id, marker) => {
    if (marker) markerRefs.current[id] = marker
    else delete markerRefs.current[id]
  }

  // Travel events for the selected day
  const travelEvents = selectedDate !== 'all'
    ? (activitiesByDate[selectedDate] || []).filter(a => a.type === 'travel')
    : []

  return (
    <div id="map-overlay" className="fixed inset-0 z-50 bg-white flex flex-col">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="no-print bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 flex-shrink-0 z-[500]">
        <div className="flex items-center gap-2">
          <Map size={16} className="text-emerald-600" />
          <h1 className="text-base font-semibold text-gray-800">Map</h1>
        </div>
        <div className="flex-1" />
        {/* Legend for all-days mode */}
        {selectedDate === 'all' && (
          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
            {dates.slice(0, 6).map((d, i) => (
              <span key={d} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                  style={{ background: DAY_PALETTE[i % DAY_PALETTE.length] }} />
                {fmtDate(d)}
              </span>
            ))}
            {dates.length > 6 && <span className="text-gray-400">+{dates.length - 6} more</span>}
          </div>
        )}
        {/* Time-of-day legend for single-day mode */}
        {selectedDate !== 'all' && (
          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
            {Object.entries(TOD_COLOR).map(([label, color]) => (
              <span key={label} className="flex items-center gap-1 capitalize">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        )}
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-2">
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      {/* ── Date selector bar ────────────────────────────────────────────────── */}
      <div
        ref={dateSelectorRef}
        className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0 scrollbar-hide z-[500]"
      >
        {/* All days button */}
        <button
          data-date="all"
          onClick={() => setSelectedDate('all')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            selectedDate === 'all'
              ? 'bg-gray-800 text-white shadow-sm'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <Layers size={12} />
          All Days
        </button>

        {/* Individual dates */}
        {dates.map(date => {
          const hasMapPins = (activitiesByDate[date] || []).some(a =>
            a.type !== 'travel' && a.coordinates?.lat
          )
          return (
            <button
              key={date}
              data-date={date}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDate === date
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <span>{fmtDate(date)}</span>
              {hasMapPins && (
                <span className={`text-[9px] mt-0.5 ${selectedDate === date ? 'text-indigo-200' : 'text-indigo-400'}`}>
                  ● mapped
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── City toggle for split days ───────────────────────────────────────── */}
      {isSplit && selectedDate !== 'all' && (
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 flex-shrink-0 z-[500]">
          {[
            { key: 'A', city: currentState.split.cityA, group: currentState.split.groupA },
            { key: 'B', city: currentState.split.cityB, group: currentState.split.groupB },
          ].map(({ key, city, group }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {group.map(id => {
                const m = members.find(x => x.id === id)
                return m ? (
                  <span key={id}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ background: activeTab === key ? 'rgba(255,255,255,0.3)' : m.color }}
                  >{m.name[0]}</span>
                ) : null
              })}
              {city || `Group ${key}`}
            </button>
          ))}
        </div>
      )}

      {/* ── Map + Sidebar ─────────────────────────────────────────────────────── */}
      <div className="flex-1 relative">

        {/* Sidebar */}
        <div className={`absolute top-0 bottom-0 left-0 z-[400] flex flex-col bg-white shadow-xl transition-all duration-200 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 flex-shrink-0">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {selectedDate === 'all' ? 'All Activities' : fmtDate(selectedDate)}
            </span>
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-gray-100">
              <ChevronLeft size={14} className="text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {selectedActivities.length === 0 ? (
              <p className="text-xs text-gray-400 p-2 italic">No activities for this day</p>
            ) : (
              selectedActivities.map((act, idx) => {
                const hasPins = act.coordinates?.lat
                const color = hasPins ? getColor(act, idx) : '#d1d5db'
                return (
                  <button
                    key={act.id}
                    onClick={() => {
                      if (!hasPins) return
                      setHighlightedId(null)
                      setTimeout(() => setHighlightedId(act.id), 50)
                    }}
                    className={`w-full text-left px-2 py-2 rounded-lg text-xs transition-all flex items-start gap-2 ${
                      hasPins
                        ? 'hover:bg-indigo-50 cursor-pointer'
                        : 'cursor-default opacity-60'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px] mt-0.5"
                      style={{ background: color }}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{act.title}</p>
                      {buildTimeStr(act) && (
                        <p className="text-gray-400 mt-0.5">{buildTimeStr(act)}</p>
                      )}
                      {!hasPins && (
                        <p className="text-gray-300 mt-0.5 italic">No address</p>
                      )}
                    </div>
                  </button>
                )
              })
            )}

            {/* Travel events for this day */}
            {travelEvents.length > 0 && (
              <>
                <div className="flex items-center gap-2 py-1 px-1">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">Travel</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                {travelEvents.map(evt => (
                  <div key={evt.id} className="px-2 py-1.5 rounded-lg bg-gray-50 text-xs text-gray-500 flex items-center gap-2">
                    <span>
                      {evt.transportMethod === 'flight' ? '✈️' : evt.transportMethod === 'train' ? '🚄' : '🚌'}
                    </span>
                    <span className="truncate">
                      {evt.originCity && evt.destinationCity
                        ? `${evt.originCity} → ${evt.destinationCity}`
                        : evt.destinationCity || evt.originCity || '—'}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Sidebar toggle button (when closed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-3 left-3 z-[400] bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        )}

        {/* Map */}
        <MapContainer
          center={JAPAN_CENTER}
          zoom={JAPAN_ZOOM}
          style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='Tiles © <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer
            attribution=""
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          />

          <MapController
            positions={mapPositions}
            highlightedId={highlightedId}
            markerRefs={markerRefs}
          />

          {/* Route polyline */}
          {routePositions.length >= 2 && (
            <Polyline
              positions={routePositions}
              pathOptions={{
                color: '#6366f1',
                weight: 2,
                opacity: 0.5,
                dashArray: '6 6',
              }}
            />
          )}

          {/* Activity markers */}
          {mappedActivities.map((activity, idx) => {
            const color = getColor(activity, idx)
            const isHotel = activity.category === 'hotel'
            const timeStr = buildTimeStr(activity)
            const num = selectedDate === 'all'
              ? String(idx + 1)
              : String(idx + 1)

            return (
              <Marker
                key={activity.id}
                ref={(m) => registerMarker(activity.id, m)}
                position={[activity.coordinates.lat, activity.coordinates.lng]}
                icon={createMarkerIcon(num, color, isHotel)}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, color: '#1f2937' }}>
                      {activity.title}
                    </p>
                    {timeStr && (
                      <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{timeStr}</p>
                    )}
                    {activity.address && (
                      <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{activity.address}</p>
                    )}
                    {selectedDate === 'all' && activity._date && (
                      <p style={{ fontSize: 11, color: '#9ca3af' }}>{fmtDate(activity._date)}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {/* No pins message */}
        {mappedActivities.length === 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-white/90 backdrop-blur-sm rounded-xl shadow-md px-4 py-2.5 text-xs text-gray-500 text-center max-w-xs pointer-events-none">
            {selectedDate === 'all'
              ? 'No activities have addresses yet. Add addresses in the activity edit form.'
              : `No activities with addresses on ${fmtDate(selectedDate)}. Add an address in the activity edit form.`}
          </div>
        )}
      </div>
    </div>
  )
}
