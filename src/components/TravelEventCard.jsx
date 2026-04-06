import { Pencil } from 'lucide-react'
import { useState } from 'react'

const TOD_LABELS = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' }

function formatTime(val) {
  if (!val) return null
  const [h, m] = val.split(':').map(Number)
  const hour12 = h % 12 || 12
  const ampm = h < 12 ? 'AM' : 'PM'
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function getRouteText(event) {
  const { travelType, transportMethod, originCity, destinationCity } = event
  if (travelType === 'start_of_trip') {
    return `Arriving in ${destinationCity || '—'}`
  }
  if (travelType === 'between_cities') {
    return `${originCity || '—'} → ${destinationCity || '—'}`
  }
  if (travelType === 'travel_home') {
    if (transportMethod === 'flight') return 'Flying home'
    if (transportMethod === 'bus') return 'Busing home'
    if (transportMethod === 'train') return 'Train home'
    return 'Traveling home'
  }
  return ''
}

function getTransportIcon(method) {
  if (method === 'flight') return '✈️'
  if (method === 'bus') return '🚌'
  if (method === 'train') return '🚄'
  return '🚗'
}

function getBorderColor(travelType) {
  if (travelType === 'between_cities') return 'border-l-indigo-400'
  if (travelType === 'start_of_trip') return 'border-l-green-400'
  if (travelType === 'travel_home') return 'border-l-rose-400'
  return 'border-l-gray-300'
}

export default function TravelEventCard({ event, members, onClick }) {
  const [hovered, setHovered] = useState(false)

  const timeOfDayStr = (event.timeOfDay || [])
    .map(t => TOD_LABELS[t] || t)
    .join(' · ')

  const timeStr = event.startTime ? formatTime(event.startTime) : null

  const timeDisplay = [timeOfDayStr, timeStr].filter(Boolean).join(' · ')

  const eventMembers = (event.memberIds || [])
    .map(id => members.find(m => m.id === id))
    .filter(Boolean)

  const borderColor = getBorderColor(event.travelType)

  return (
    <div
      className={`bg-white rounded-xl border-l-4 border border-gray-100 shadow-sm px-3 py-2 cursor-pointer hover:shadow-md transition-shadow relative ${borderColor}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm leading-none mt-0.5 flex-shrink-0">
          {getTransportIcon(event.transportMethod)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-700 leading-snug truncate">
            {getRouteText(event)}
          </p>
          {timeDisplay && (
            <p className="text-xs text-gray-400 mt-0.5">{timeDisplay}</p>
          )}
          {eventMembers.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {eventMembers.length === members.length ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-gray-100 text-gray-500">
                  👨‍👩‍👧‍👦 Whole group
                </span>
              ) : (
                eventMembers.map(m => (
                  <span
                    key={m.id}
                    title={m.name}
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold flex-shrink-0"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.name[0]}
                  </span>
                ))
              )}
            </div>
          )}
        </div>
        {hovered && (
          <button
            className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100 transition-colors"
            onClick={(e) => { e.stopPropagation(); onClick && onClick() }}
          >
            <Pencil size={11} className="text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )
}
