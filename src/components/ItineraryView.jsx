import { X, Printer } from 'lucide-react'

const TOD_LABELS = { morning: 'Morning', afternoon: 'Afternoon', night: 'Night', other: 'Other', evening: 'Evening' }
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`
}

function formatTime(val) {
  if (!val) return null
  const [h, m] = val.split(':').map(Number)
  const hour12 = h % 12 || 12
  const ampm = h < 12 ? 'AM' : 'PM'
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function getTransportIcon(method) {
  if (method === 'flight') return '✈️'
  if (method === 'bus') return '🚌'
  if (method === 'train') return '🚄'
  return '🚗'
}

function getRouteText(event) {
  const { travelType, transportMethod, originCity, destinationCity } = event
  if (travelType === 'start_of_trip') return `Arriving in ${destinationCity || '—'}`
  if (travelType === 'between_cities') return `${originCity || '—'} → ${destinationCity || '—'}`
  if (travelType === 'travel_home') {
    if (transportMethod === 'flight') return 'Flying home'
    if (transportMethod === 'bus') return 'Busing home'
    if (transportMethod === 'train') return 'Train home'
    return 'Traveling home'
  }
  return ''
}

function ActivityEntry({ activity, members }) {
  const timeOfDayStr = (activity.timeOfDay || []).map(t => TOD_LABELS[t] || t).join(' · ')
  const startTimeStr = formatTime(activity.startTime)
  const endTimeStr = formatTime(activity.endTime)

  let timeDisplay = ''
  if (timeOfDayStr && startTimeStr) {
    timeDisplay = `${timeOfDayStr} · ${startTimeStr}`
    if (endTimeStr) timeDisplay += ` – ${endTimeStr}`
  } else if (timeOfDayStr) {
    timeDisplay = timeOfDayStr
  } else if (startTimeStr) {
    timeDisplay = startTimeStr
    if (endTimeStr) timeDisplay += ` – ${endTimeStr}`
  }

  const activityMembers = (activity.memberIds || [])
    .map(id => members.find(m => m.id === id))
    .filter(Boolean)

  const validLinks = (activity.links || []).filter(l => l.trim())

  return (
    <div className="mb-5 pb-5 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-semibold text-gray-900 text-[15px] leading-snug">{activity.title}</h4>
        <span className={`text-xs font-medium flex-shrink-0 mt-0.5 px-2 py-0.5 rounded-full border ${
          activity.booked
            ? 'text-green-700 bg-green-50 border-green-200'
            : 'text-gray-400 bg-gray-50 border-gray-200'
        }`}>
          {activity.booked ? '✓ Booked' : '○ Not booked'}
        </span>
      </div>
      <div className="mt-1.5 space-y-0.5 text-sm text-gray-500">
        {timeDisplay && <p>{timeDisplay}</p>}
        {activity.location && <p>📍 {activity.location}</p>}
        {activityMembers.length > 0 && (
          <p>{activityMembers.map(m => `${m.emoji} ${m.name.split(' ')[0]}`).join('  ·  ')}</p>
        )}
      </div>
      {activity.description && (
        <p className="text-sm text-gray-700 mt-2 leading-relaxed">{activity.description}</p>
      )}
      {activity.notes && (
        <p className="text-sm text-gray-600 mt-2 italic pl-3 border-l-2 border-amber-300">
          {activity.notes}
        </p>
      )}
      {validLinks.length > 0 && (
        <div className="mt-2 space-y-1">
          {validLinks.map((link, i) => (
            <a key={i} href={link} target="_blank" rel="noopener noreferrer"
              className="text-xs text-indigo-500 hover:underline block truncate">
              🔗 {link}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ItineraryView({ dates, activitiesByDate, members, dateStates, tripDates, onClose }) {
  const handlePrint = () => {
    document.body.classList.add('printing-itinerary')
    window.print()
    document.body.classList.remove('printing-itinerary')
  }

  return (
    <div id="itinerary-overlay" className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Toolbar — hidden on print */}
      <div className="no-print sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⛩️</span>
          <h1 className="text-base font-semibold text-gray-800">Detailed Itinerary</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Printer size={14} />
            Print / Save as PDF
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Itinerary content */}
      <div className="max-w-2xl mx-auto px-8 py-10">
        {/* Trip header */}
        <div className="text-center mb-12 pb-8 border-b-2 border-gray-900">
          <div className="text-5xl mb-4">⛩️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Japan Trip</h1>
          {tripDates.start && tripDates.end && (
            <p className="text-gray-500 text-sm">
              {formatDate(tripDates.start)} — {formatDate(tripDates.end)}
            </p>
          )}
          {members.length > 0 && (
            <p className="text-gray-500 text-sm mt-1">
              {members.map(m => `${m.emoji} ${m.name.split(' ')[0]}`).join('  ·  ')}
            </p>
          )}
        </div>

        {/* Days */}
        {dates.map(date => {
          const dayActivities = activitiesByDate[date] || []
          const state = dateStates[date] || {}
          const { split, cities, reunion } = state

          const travelEvents = dayActivities.filter(a => a.type === 'travel')
          const nonTravel = dayActivities.filter(a => a.type !== 'travel')

          if (dayActivities.length === 0 && !reunion) return null

          const cityLabel = cities && cities.length > 0 ? cities.join(' / ') : null

          return (
            <div key={date} className="mb-10">
              {/* Day header */}
              <div className="flex items-baseline gap-3 mb-1">
                <h2 className="text-lg font-bold text-gray-900">{formatDate(date)}</h2>
                {cityLabel && <span className="text-sm text-gray-500 font-medium">{cityLabel}</span>}
              </div>
              <div className="border-b-2 border-gray-800 mb-5" />

              {/* Reunion banner */}
              {reunion && (
                <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                  <span>🤝</span>
                  <span className="text-sm font-medium text-green-700">
                    Group reunited{reunion.city ? ` in ${reunion.city}` : ''}
                  </span>
                </div>
              )}

              {/* Travel banners */}
              {travelEvents.map(event => (
                <div key={event.id} className="mb-4 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <span className="text-xl flex-shrink-0">{getTransportIcon(event.transportMethod)}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{getRouteText(event)}</p>
                    {event.startTime && (
                      <p className="text-sm text-gray-500">{formatTime(event.startTime)}</p>
                    )}
                    {(event.memberIds || []).length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {event.memberIds
                          .map(id => members.find(m => m.id === id))
                          .filter(Boolean)
                          .map(m => `${m.emoji} ${m.name.split(' ')[0]}`)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Activities — split or normal */}
              {split ? (
                <div className="space-y-6">
                  {[
                    { ids: split.groupA, city: split.cityA },
                    { ids: split.groupB, city: split.cityB },
                  ].map(({ ids, city }) => {
                    const groupActs = nonTravel.filter(a => {
                      const mIds = a.memberIds || []
                      if (mIds.length === 0) return true
                      const inGroup = mIds.filter(id => ids.includes(id)).length
                      const inOther = mIds.filter(id => !ids.includes(id)).length
                      return inGroup >= inOther
                    })
                    if (groupActs.length === 0) return null
                    return (
                      <div key={city || ids.join(',')}>
                        {city && (
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                            📍 {city}
                          </h3>
                        )}
                        {groupActs.map(act => (
                          <ActivityEntry key={act.id} activity={act} members={members} />
                        ))}
                      </div>
                    )
                  })}
                </div>
              ) : (
                nonTravel.length > 0 && (
                  <div>
                    {nonTravel.map(act => (
                      <ActivityEntry key={act.id} activity={act} members={members} />
                    ))}
                  </div>
                )
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
