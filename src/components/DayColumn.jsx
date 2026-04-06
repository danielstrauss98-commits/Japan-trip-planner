import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Pencil, Plane } from 'lucide-react'
import { useState } from 'react'
import ActivityCard from './ActivityCard'
import TravelEventCard from './TravelEventCard'
import HotelCard from './HotelCard'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Returns a sortable time key for before/after-travel comparisons
function getActivityTimeKey(act) {
  if (act.startTime) return act.startTime
  const tod = act.timeOfDay || []
  if (tod.includes('morning')) return '06:00'
  if (tod.includes('afternoon')) return '12:00'
  if (tod.includes('evening') || tod.includes('night')) return '18:00'
  return '99:99'
}

// Which split column does an activity belong to?
function getColumn(activity, groupA, groupB) {
  const ids = activity.memberIds || []
  if (ids.length === 0) return 'A'
  const inA = ids.filter(id => groupA.includes(id)).length
  const inB = ids.filter(id => groupB.includes(id)).length
  return inB > inA ? 'B' : 'A'
}

function CityHeader({ cities, onEditCity, date }) {
  const [hovered, setHovered] = useState(false)
  if (cities.length === 0) {
    return (
      <button
        onClick={() => onEditCity(date)}
        className="text-xs text-gray-300 hover:text-indigo-400 transition-colors mb-2 block"
      >
        + Add city
      </button>
    )
  }
  return (
    <div
      className="flex items-center gap-1 mb-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="text-sm font-semibold text-gray-700">{cities.join(' → ')}</span>
      {hovered && (
        <button onClick={() => onEditCity(date)} className="p-0.5 rounded hover:bg-gray-100 transition-colors">
          <Pencil size={11} className="text-gray-400" />
        </button>
      )}
    </div>
  )
}

function MemberDots({ memberIds, members }) {
  return (
    <>
      {memberIds.map(id => {
        const m = members.find(x => x.id === id)
        return m ? (
          <span
            key={id}
            title={m.name}
            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold flex-shrink-0"
            style={{ backgroundColor: m.color }}
          >
            {m.name[0]}
          </span>
        ) : null
      })}
    </>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 my-2 text-[10px] text-gray-400 uppercase tracking-wider">
      <div className="h-px bg-gray-100 flex-1" />
      <span>{children}</span>
      <div className="h-px bg-gray-100 flex-1" />
    </div>
  )
}

function ActivityGroup({ items, members, filterMemberIds, onEditActivity, onEditTravel, travelItems }) {
  const visible = filterMemberIds.length === 0
    ? items
    : items.filter(a => (a.memberIds || []).some(id => filterMemberIds.includes(id)))

  const visibleTravel = filterMemberIds.length === 0
    ? (travelItems || [])
    : (travelItems || []).filter(a => (a.memberIds || []).some(id => filterMemberIds.includes(id)))

  // Merge and sort activities + travel events by time so travel appears in chronological order
  const merged = [
    ...visible.map(a => ({ item: a, isTravel: false })),
    ...visibleTravel.map(a => ({ item: a, isTravel: true })),
  ].sort((a, b) => {
    const keyA = getActivityTimeKey(a.item)
    const keyB = getActivityTimeKey(b.item)
    if (keyA !== keyB) return keyA.localeCompare(keyB)
    // At the same time slot, travel comes first
    if (a.isTravel && !b.isTravel) return -1
    if (!a.isTravel && b.isTravel) return 1
    return (a.item.order || 0) - (b.item.order || 0)
  })

  const sortableIds = visible.map(a => a.id)

  return (
    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
      <div className="space-y-2">
        {merged.map(({ item, isTravel }) =>
          isTravel ? (
            <TravelEventCard key={item.id} event={item} members={members} onClick={() => onEditTravel && onEditTravel(item)} />
          ) : (
            <ActivityCard key={item.id} activity={item} members={members} onClick={() => onEditActivity(item)} />
          )
        )}
        {merged.length === 0 && (
          <div className="h-8 flex items-center">
            <span className="text-xs text-gray-200">No activities yet</span>
          </div>
        )}
      </div>
    </SortableContext>
  )
}

export default function DayColumn({
  date,
  activities,
  hotels,
  members,
  onAddActivity,
  onAddTravel,
  onAddHotel,
  onEditActivity,
  onEditTravel,
  filterMemberIds,
  cities,
  onEditCity,
  split,
  reunion,
  goneHome,
}) {
  const [activeTab, setActiveTab] = useState('A')
  const { setNodeRef, isOver } = useDroppable({ id: `day-${date}` })

  const d = new Date(date + 'T00:00:00')
  const dayName = DAY_NAMES[d.getDay()]
  const dayNum = d.getDate()
  const month = MONTH_NAMES[d.getMonth()]
  const isWeekend = d.getDay() === 0 || d.getDay() === 6

  const goneHomeMembers = (goneHome || []).map(id => members.find(m => m.id === id)).filter(Boolean)

  // ── Compute split layout variables ──────────────────────────────────────────
  let splitTrigger = null       // the between_cities travel event on this day (if any)
  let beforeTravel = []         // regular activities before the split trigger's time
  let afterTravelA = []         // regular activities after trigger, in GroupA column
  let afterTravelB = []         // regular activities after trigger, in GroupB column
  let otherTravelA = []         // non-trigger travel events assigned to GroupA
  let otherTravelB = []         // non-trigger travel events assigned to GroupB
  let normalActivities = []     // for non-split days

  if (split) {
    splitTrigger = activities.find(a => a.type === 'travel' && a.travelType === 'between_cities') || null
    const nonTravel = activities.filter(a => a.type !== 'travel')

    if (splitTrigger) {
      const travelKey = getActivityTimeKey(splitTrigger)
      beforeTravel = nonTravel.filter(a => getActivityTimeKey(a) < travelKey)
      const after = nonTravel.filter(a => getActivityTimeKey(a) >= travelKey)
      afterTravelA = after.filter(a => getColumn(a, split.groupA, split.groupB) === 'A')
      afterTravelB = after.filter(a => getColumn(a, split.groupA, split.groupB) === 'B')
    } else {
      // Continuing split from previous day — all activities go into columns, no before/after
      const all = nonTravel
      afterTravelA = all.filter(a => getColumn(a, split.groupA, split.groupB) === 'A')
      afterTravelB = all.filter(a => getColumn(a, split.groupA, split.groupB) === 'B')
    }

    // Other travel events (not the split trigger) — assigned to their column
    const otherTravels = activities.filter(a => a.type === 'travel' && a !== splitTrigger)
    otherTravelA = otherTravels.filter(a => getColumn(a, split.groupA, split.groupB) === 'A')
    otherTravelB = otherTravels.filter(a => getColumn(a, split.groupA, split.groupB) === 'B')
  } else {
    normalActivities = activities
  }

  // ── Hotel cards for this day ────────────────────────────────────────────────
  const hotelsForDay = (hotels || []).flatMap(hotel => {
    const { checkInDate, checkOutDate } = hotel
    if (!checkInDate || !checkOutDate || checkOutDate < checkInDate) return []
    if (date < checkInDate || date > checkOutDate) return []
    const isCheckIn  = date === checkInDate
    const isCheckOut = date === checkOutDate
    if (isCheckIn && isCheckOut) return [{ hotel, role: 'single' }]
    if (isCheckIn)  return [{ hotel, role: 'checkin' }]
    if (isCheckOut) return [{ hotel, role: 'checkout' }]
    return [{ hotel, role: 'middle' }]
  })
  // checkout/single/middle → top (first item); checkin/middle → bottom (last item)
  // 'single' (same-day check-in/out) shows only once at top
  const topHotels    = hotelsForDay.filter(h => h.role === 'checkout' || h.role === 'middle' || h.role === 'single')
  const bottomHotels = hotelsForDay.filter(h => h.role === 'checkin'  || h.role === 'middle')

  return (
    <div className={`flex gap-4 rounded-2xl border-2 p-4 transition-all ${
      isOver
        ? 'border-indigo-300 bg-indigo-50/40 shadow-md'
        : 'border-gray-100 bg-white shadow-sm hover:shadow-md'
    }`}>
      {/* Date sidebar */}
      <div className={`w-14 flex-shrink-0 flex flex-col items-center pt-0.5 rounded-xl py-2 ${
        isWeekend ? 'bg-indigo-50' : 'bg-gray-50'
      }`}>
        <span className={`text-xs font-semibold uppercase tracking-wider ${isWeekend ? 'text-indigo-400' : 'text-gray-400'}`}>
          {dayName}
        </span>
        <span className={`text-2xl font-bold leading-none mt-0.5 ${isWeekend ? 'text-indigo-600' : 'text-gray-700'}`}>
          {dayNum}
        </span>
        <span className={`text-xs mt-0.5 ${isWeekend ? 'text-indigo-400' : 'text-gray-400'}`}>
          {month}
        </span>
        {activities.length > 0 && (
          <span className="mt-2 text-xs text-gray-400 font-medium">{activities.length}</span>
        )}
      </div>

      <div className={`w-px self-stretch ${isWeekend ? 'bg-indigo-100' : 'bg-gray-100'}`} />

      {/* Content area (the drop zone covers the whole thing) */}
      <div ref={setNodeRef} className="flex-1 min-w-0">
        {/* Reunion banner */}
        {reunion && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100">
            <span className="text-base leading-none">🤝</span>
            <span className="text-sm font-medium text-green-700">
              Group reunited{reunion.city ? ` in ${reunion.city}` : ''}!
            </span>
          </div>
        )}

        {(!split || cities.length > 0) && <CityHeader cities={cities} onEditCity={onEditCity} date={date} />}

        {split ? (
          // ── SPLIT MODE ──────────────────────────────────────────────────────
          <>
            {/* Top hotel cards (checkout / middle) */}
            {topHotels.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {topHotels.map(({ hotel, role }) => (
                  <HotelCard key={`top-${hotel.id}`} hotel={hotel} role={role} members={members} onClick={() => onEditActivity(hotel)} />
                ))}
              </div>
            )}
            {/* Before-travel section (full width, shown only when there's a split trigger on this day) */}
            {splitTrigger && beforeTravel.length > 0 && (
              <div className="mb-1">
                <SectionLabel>Before travel</SectionLabel>
                <ActivityGroup
                  items={beforeTravel}
                  members={members}
                  filterMemberIds={filterMemberIds}
                  onEditActivity={onEditActivity}
                  onEditTravel={onEditTravel}
                />
              </div>
            )}

            {/* Travel event divider (only on the travel day itself) */}
            {splitTrigger && (
              <div className="my-2">
                <TravelEventCard event={splitTrigger} members={members} onClick={() => onEditTravel && onEditTravel(splitTrigger)} />
              </div>
            )}

            {/* City tab toggle */}
            <div className="flex gap-1.5 mb-3 mt-2">
              {[
                { key: 'A', city: split.cityA, group: split.groupA },
                { key: 'B', city: split.cityB, group: split.groupB },
              ].map(({ key, city, group }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <span className="flex gap-0.5">
                    {group.map(id => {
                      const m = members.find(x => x.id === id)
                      return m ? (
                        <span
                          key={id}
                          className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] font-bold ${activeTab === key ? 'text-white/80' : 'text-white'}`}
                          style={{ backgroundColor: activeTab === key ? 'rgba(255,255,255,0.35)' : m.color }}
                        >
                          {m.name[0]}
                        </span>
                      ) : null
                    })}
                  </span>
                  {city || `Group ${key}`}
                </button>
              ))}
            </div>

            {/* Active group content */}
            {activeTab === 'A' ? (
              <>
                <ActivityGroup
                  items={afterTravelA}
                  members={members}
                  filterMemberIds={filterMemberIds}
                  onEditActivity={onEditActivity}
                  onEditTravel={onEditTravel}
                  travelItems={otherTravelA}
                />
                <button
                  onClick={() => onAddActivity(date, split.groupA)}
                  className="mt-2 flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-500 transition-colors py-1"
                >
                  <Plus size={13} />Add activity
                </button>
                <button
                  onClick={() => onAddTravel(date)}
                  className="mt-1 flex items-center gap-1 text-xs text-gray-300 hover:text-rose-400 transition-colors py-1"
                >
                  <Plane size={13} />Travel
                </button>
                <button
                  onClick={() => onAddHotel(date)}
                  className="mt-1 flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-400 transition-colors py-1"
                >
                  <span className="text-[11px] leading-none">🏨</span>Hotel
                </button>
              </>
            ) : (
              <>
                <ActivityGroup
                  items={afterTravelB}
                  members={members}
                  filterMemberIds={filterMemberIds}
                  onEditActivity={onEditActivity}
                  onEditTravel={onEditTravel}
                  travelItems={otherTravelB}
                />
                <button
                  onClick={() => onAddActivity(date, split.groupB)}
                  className="mt-2 flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-500 transition-colors py-1"
                >
                  <Plus size={13} />Add activity
                </button>
                <button
                  onClick={() => onAddTravel(date)}
                  className="mt-1 flex items-center gap-1 text-xs text-gray-300 hover:text-rose-400 transition-colors py-1"
                >
                  <Plane size={13} />Travel
                </button>
                <button
                  onClick={() => onAddHotel(date)}
                  className="mt-1 flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-400 transition-colors py-1"
                >
                  <span className="text-[11px] leading-none">🏨</span>Hotel
                </button>
              </>
            )}
            {/* Bottom hotel cards (checkin / middle) */}
            {bottomHotels.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {bottomHotels.map(({ hotel, role }) => (
                  <HotelCard key={`bottom-${hotel.id}`} hotel={hotel} role={role} members={members} onClick={() => onEditActivity(hotel)} />
                ))}
              </div>
            )}
          </>
        ) : (
          // ── NORMAL MODE ─────────────────────────────────────────────────────
          <>
            {/* Top hotel cards: checkout / middle / single */}
            {topHotels.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {topHotels.map(({ hotel, role }) => (
                  <HotelCard key={`top-${hotel.id}`} hotel={hotel} role={role} members={members} onClick={() => onEditActivity(hotel)} />
                ))}
              </div>
            )}
            <ActivityGroup
              items={normalActivities.filter(a => a.type !== 'travel')}
              members={members}
              filterMemberIds={filterMemberIds}
              onEditActivity={onEditActivity}
              onEditTravel={onEditTravel}
              travelItems={normalActivities.filter(a => a.type === 'travel')}
            />
            {normalActivities.filter(a => a.type !== 'travel').length === 0 &&
             normalActivities.filter(a => a.type === 'travel').length === 0 &&
             topHotels.length === 0 && (
              <div className="h-10 flex items-center">
                <span className="text-xs text-gray-300">Drop activities here</span>
              </div>
            )}
            {/* Bottom hotel cards: checkin / middle / single */}
            {bottomHotels.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {bottomHotels.map(({ hotel, role }) => (
                  <HotelCard key={`bottom-${hotel.id}`} hotel={hotel} role={role} members={members} onClick={() => onEditActivity(hotel)} />
                ))}
              </div>
            )}
            <button
              onClick={() => onAddActivity(date)}
              className="mt-2 flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-500 transition-colors py-1"
            >
              <Plus size={13} />Add activity
            </button>
            <button
              onClick={() => onAddTravel(date)}
              className="mt-1 flex items-center gap-1 text-xs text-gray-300 hover:text-rose-400 transition-colors py-1"
            >
              <Plane size={13} />Travel
            </button>
            <button
              onClick={() => onAddHotel(date)}
              className="mt-1 flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-400 transition-colors py-1"
            >
              <span className="text-[11px] leading-none">🏨</span>Hotel
            </button>
          </>
        )}

        {/* Gone-home indicators */}
        {goneHomeMembers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {goneHomeMembers.map(m => (
              <span
                key={m.id}
                title={`${m.name} has departed`}
                className="inline-flex items-center gap-0.5 text-xs text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100"
              >
                {m.emoji} {m.name.split(' ')[0]} ✈️
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
