import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Settings, Download, BookOpen, Map } from 'lucide-react'

import { useVersions } from './hooks/useVersions'
import { useActivities } from './hooks/useActivities'
import { useSettings } from './hooks/useSettings'

import VersionBar from './components/VersionBar'
import DayColumn from './components/DayColumn'
import UnassignedPanel from './components/UnassignedPanel'
import ActivityCard from './components/ActivityCard'
import ActivityModal from './components/ActivityModal'
import ImportModal from './components/ImportModal'
import SettingsModal from './components/SettingsModal'
import MemberFilter from './components/MemberFilter'
import SplashScreen from './components/SplashScreen'
import TravelModal from './components/TravelModal'
import CityAutocomplete from './components/CityAutocomplete'
import ItineraryView from './components/ItineraryView'
import MapView from './components/MapView'

function getDatesInRange(start, end) {
  if (!start || !end) return []
  const dates = []
  const cur = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (cur <= last) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export default function App() {
  const [unlocked, setUnlocked] = useState(() =>
    localStorage.getItem('japan_trip_unlocked') === '1'
  )
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem('japan_trip_user'))

  const { versions, loading: versionsLoading, error: versionsError, addVersion, renameVersion, deleteVersion, updateVersionData } = useVersions()
  const [activeVersionId, setActiveVersionId] = useState(null)
  const { activities, loading: activitiesLoading, addActivity, updateActivity, deleteActivity, error: activitiesError } = useActivities(
    activeVersionId || versions[0]?.id
  )
  const { members, tripDates, saveSettings, error: settingsError } = useSettings()

  const [activityModal, setActivityModal] = useState(null)
  const [travelModal, setTravelModal] = useState(null)
  const [editingCity, setEditingCity] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showItinerary, setShowItinerary] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [filterMemberIds, setFilterMemberIds] = useState([])
  const [dragActive, setDragActive] = useState(null)

  const firestoreError = versionsError || activitiesError || settingsError

  const currentVersionId = activeVersionId || versions[0]?.id

  const currentVersion = versions.find(v => v.id === currentVersionId)
  const cityAssignments = currentVersion?.cityAssignments || {}
  const goneHome = currentVersion?.goneHome || []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 10 } })
  )

  const dates = useMemo(() => getDatesInRange(tripDates.start, tripDates.end), [tripDates])

  const sortByTime = (arr) => [...arr].sort((a, b) => {
    const TOD_ORDER = { morning: 0, afternoon: 1, night: 2, other: 3, evening: 2 }
    const todKey = (act) => {
      const tod = act.timeOfDay || []
      return tod.length === 0 ? 4 : Math.min(...tod.map(t => TOD_ORDER[t] ?? 4))
    }
    const aOrd = todKey(a), bOrd = todKey(b)
    if (aOrd !== bOrd) return aOrd - bOrd
    const aTime = a.startTime || '99:99'
    const bTime = b.startTime || '99:99'
    if (aTime !== bTime) return aTime.localeCompare(bTime)
    if (a.type === 'travel' && b.type !== 'travel') return -1
    if (a.type !== 'travel' && b.type === 'travel') return 1
    return (a.order || 0) - (b.order || 0)
  })

  const hotels = useMemo(() =>
    activities.filter(a => a.type === 'hotel'),
    [activities]
  )

  const activitiesByDate = useMemo(() => {
    const map = {}
    dates.forEach(d => { map[d] = [] })
    activities.forEach(a => {
      if (a.type === 'hotel') return  // hotels are rendered separately via DayColumn hotels prop
      if (a.date && map[a.date]) map[a.date].push(a)
    })
    Object.keys(map).forEach(d => { map[d] = sortByTime(map[d]) })
    return map
  }, [activities, dates])

  const unscheduled = useMemo(() =>
    sortByTime(activities.filter(a => a.type !== 'hotel' && (!a.date || !dates.includes(a.date)))),
    [activities, dates]
  )

  const dateStates = useMemo(() => {
    const states = {}
    let currentCity = null
    let split = null

    for (const date of dates) {
      let reunionCity = null
      let splitStartedThisDay = false

      const dayTravels = activities
        .filter(a => a.type === 'travel' && a.date === date)
        .sort((a, b) => (a.order || 0) - (b.order || 0))

      for (const event of dayTravels) {
        const activeIds = members.map(m => m.id).filter(id => !goneHome.includes(id))
        const traveling = (event.memberIds || []).filter(id => activeIds.includes(id))
        const staying = activeIds.filter(id => !traveling.includes(id))

        if (event.travelType === 'start_of_trip') {
          if (event.destinationCity) currentCity = event.destinationCity

        } else if (event.travelType === 'between_cities') {
          if (!split) {
            if (staying.length === 0) {
              currentCity = event.destinationCity || currentCity
            } else {
              split = {
                groupA: traveling,
                cityA: event.destinationCity || '',
                groupB: staying,
                cityB: event.originCity || currentCity || '',
              }
              splitStartedThisDay = true
            }
          } else {
            // Already split — check for reunion
            const travelingSet = new Set(traveling)
            const dest = (event.destinationCity || '').trim().toLowerCase()
            const cityA = (split.cityA || '').trim().toLowerCase()
            const cityB = (split.cityB || '').trim().toLowerCase()
            const groupBAllTraveling = split.groupB.length > 0 && split.groupB.every(id => travelingSet.has(id))
            const groupAAllTraveling = split.groupA.length > 0 && split.groupA.every(id => travelingSet.has(id))
            const isReunion =
              staying.length === 0 ||
              (groupBAllTraveling && dest && dest === cityA) ||
              (groupAAllTraveling && dest && dest === cityB)

            if (isReunion) {
              reunionCity = event.destinationCity || currentCity || ''
              currentCity = reunionCity
              split = null
            } else {
              // Update which group's city changed
              if (groupAAllTraveling) split = { ...split, cityA: event.destinationCity || split.cityA }
              if (groupBAllTraveling) split = { ...split, cityB: event.destinationCity || split.cityB }
            }
          }

        } else if (event.travelType === 'travel_home') {
          if (split) {
            const newGroupA = split.groupA.filter(id => !traveling.includes(id))
            const newGroupB = split.groupB.filter(id => !traveling.includes(id))
            if (newGroupA.length === 0 || newGroupB.length === 0) {
              const prevSplit = { ...split }
              split = null
              currentCity = newGroupA.length > 0 ? prevSplit.cityA : newGroupB.length > 0 ? prevSplit.cityB : currentCity
            } else {
              split = { ...split, groupA: newGroupA, groupB: newGroupB }
            }
          }
        }
      }

      const manualCities = cityAssignments[date]
      let cities
      if (manualCities && manualCities.length > 0) {
        cities = manualCities
      } else if (split && splitStartedThisDay) {
        // Only show "City A → City B" on the day the split starts
        cities = [split.cityA, split.cityB].filter(Boolean)
      } else if (split) {
        // On subsequent split days, don't repeat the route header
        cities = []
      } else if (currentCity) {
        cities = [currentCity]
      } else {
        cities = []
      }

      states[date] = {
        split: split ? { ...split } : null,
        reunion: reunionCity ? { city: reunionCity } : null,
        cities,
      }
    }

    return states
  }, [activities, members, goneHome, cityAssignments, dates])

  const handleDragStart = ({ active }) => {
    setDragActive(activities.find(a => a.id === active.id) || null)
  }

  const handleDragEnd = ({ active, over }) => {
    setDragActive(null)
    if (!over) return

    const activeActivity = activities.find(a => a.id === active.id)
    if (!activeActivity) return

    if (over.id === 'unassigned') {
      if (activeActivity.date) {
        const newOrder = (unscheduled.at(-1)?.order || 0) + 1000
        updateActivity(activeActivity.id, { date: '', order: newOrder })
      }
      return
    }

    if (over.id.startsWith('day-')) {
      const newDate = over.id.replace('day-', '').replace(/-[AB]$/, '')
      if (activeActivity.date !== newDate) {
        const dayActivities = activitiesByDate[newDate] || []
        const newOrder = (dayActivities.at(-1)?.order || 0) + 1000
        updateActivity(activeActivity.id, { date: newDate, order: newOrder })
      }
      return
    }

    const overActivity = activities.find(a => a.id === over.id)
    if (!overActivity) return

    const activeDate = activeActivity.date && dates.includes(activeActivity.date) ? activeActivity.date : ''
    const overDate = overActivity.date && dates.includes(overActivity.date) ? overActivity.date : ''

    if (activeDate === overDate) {
      const bucket = overDate
        ? [...(activitiesByDate[overDate] || [])]
        : [...unscheduled]
      const oldIdx = bucket.findIndex(a => a.id === active.id)
      const newIdx = bucket.findIndex(a => a.id === over.id)
      if (oldIdx === -1 || newIdx === -1) return
      const reordered = arrayMove(bucket, oldIdx, newIdx)
      reordered.forEach((act, i) => {
        if (act.order !== i * 100) updateActivity(act.id, { order: i * 100 })
      })
    } else {
      const destBucket = overDate
        ? [...(activitiesByDate[overDate] || [])]
        : [...unscheduled]
      const insertIdx = destBucket.findIndex(a => a.id === over.id)
      const before = destBucket[insertIdx - 1]?.order ?? (destBucket[insertIdx]?.order ?? 0) - 200
      const after = destBucket[insertIdx]?.order ?? before + 200
      const newOrder = (before + after) / 2
      updateActivity(activeActivity.id, { date: overDate, order: newOrder })
    }
  }

  const handleSaveActivity = (form) => {
    if (activityModal?.activity) {
      // Editing: don't close — ActivityModal switches back to summary view itself
      updateActivity(activityModal.activity.id, form)
    } else {
      // Creating: close modal after save
      setActivityModal(null)
      const bucket = form.date ? (activitiesByDate[form.date] || []) : unscheduled
      const order = (bucket.at(-1)?.order || 0) + 1000
      addActivity({ ...form, order, addedBy: currentUser?.name || '' })
    }
  }

  const handleSaveTravelEvent = async (form) => {
    const existingEvent = travelModal?.event
    setTravelModal(null)

    if (existingEvent) {
      await updateActivity(existingEvent.id, form)
    } else {
      const bucket = activitiesByDate[form.date] || []
      const order = (bucket.at(-1)?.order || 0) + 1000
      await addActivity({ ...form, order, addedBy: currentUser?.name || '' })
    }

    if (form.travelType === 'travel_home' && form.memberIds?.length > 0) {
      const newGoneHome = [...new Set([...goneHome, ...form.memberIds])]
      updateVersionData(currentVersionId, { goneHome: newGoneHome })
    }

    if (form.travelType === 'start_of_trip' && form.destinationCity) {
      const newAssignments = { ...cityAssignments, [form.date]: [form.destinationCity] }
      updateVersionData(currentVersionId, { cityAssignments: newAssignments })
    }
  }

  const handleDeleteTravelEvent = async () => {
    if (travelModal?.event) {
      await deleteActivity(travelModal.event.id)
      setTravelModal(null)
    }
  }

  const handleEditCity = (date) => {
    setEditingCity({ date })
  }

  const handleSaveCity = (date, cityString) => {
    setEditingCity(null)
    const cities = cityString.trim()
      ? cityString.split(',').map(c => c.trim()).filter(Boolean)
      : []
    const newAssignments = { ...cityAssignments }
    if (cities.length === 0) {
      delete newAssignments[date]
    } else {
      newAssignments[date] = cities
    }
    updateVersionData(currentVersionId, { cityAssignments: newAssignments })
  }

  const handleImport = (activitiesToImport) => {
    activitiesToImport.forEach((act, i) => {
      const order = (unscheduled.at(-1)?.order || 0) + (i + 1) * 1000
      addActivity({ ...act, date: '', order })
    })
  }

  const handleDeleteActivity = async () => {
    if (activityModal?.activity) {
      await deleteActivity(activityModal.activity.id)
      setActivityModal(null)
    }
  }

  const handleDuplicateActivity = async () => {
    const src = activityModal?.activity
    if (!src) return
    const { id, date: _date, comments: _comments, addedBy: _addedBy, ...rest } = src
    const order = (unscheduled.at(-1)?.order || 0) + 1000
    await addActivity({ ...rest, date: '', order, comments: [], addedBy: currentUser?.name || '' })
    setActivityModal(null)
  }

  if (!unlocked) {
    return (
      <SplashScreen
        onUnlock={() => setUnlocked(true)}
      />
    )
  }

  if (versionsLoading || (currentVersionId && activitiesLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⛩️</div>
          <div className="text-gray-500 font-medium">Loading your trip...</div>
        </div>
      </div>
    )
  }

  const currentUser = members.find(m => m.id === currentUserId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-pink-50/30">
      {firestoreError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-xs text-red-700">
          <div className="flex items-start gap-2">
            <span className="text-base leading-none mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold mb-0.5">Firebase error — data is NOT saving ({firestoreError.code})</p>
              {firestoreError.code === 'permission-denied' ? (
                <p>Your Firestore security rules are blocking access. Run <code className="bg-red-100 px-1 rounded">npm run deploy:rules</code> in the project folder (after <code className="bg-red-100 px-1 rounded">firebase login</code>), or paste the rules from <code className="bg-red-100 px-1 rounded">firestore.rules</code> directly into the Firebase console → Firestore → Rules.</p>
              ) : (
                <p>Check your internet connection and Firebase project config in <code className="bg-red-100 px-1 rounded">src/firebase.js</code>.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-full px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className="text-2xl">⛩️</span>
              <div>
                <h1 className="text-base font-bold text-gray-800 leading-tight">Japan Trip</h1>
                <p className="text-xs text-gray-400 leading-tight">
                  {tripDates.start && tripDates.end
                    ? `${tripDates.start} → ${tripDates.end}`
                    : 'Set your dates in Settings'}
                </p>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <VersionBar
                versions={versions}
                activeId={currentVersionId}
                onSelect={setActiveVersionId}
                onAdd={addVersion}
                onRename={renameVersion}
                onDelete={deleteVersion}
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {currentUser ? (
                <button
                  title={`${currentUser.name} — click Settings to switch`}
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-medium border-2 transition-all hover:scale-105"
                  style={{ borderColor: currentUser.color + '66', color: currentUser.color, background: currentUser.color + '12' }}
                >
                  <span className="text-base leading-none">{currentUser.emoji}</span>
                  <span className="hidden sm:inline">{currentUser.name}</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowSettings(true)}
                  title="Select your profile in Settings"
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-medium border-2 border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-all"
                >
                  <span className="text-base leading-none">👤</span>
                  <span className="hidden sm:inline">Set profile</span>
                </button>
              )}
              <button
                onClick={() => setShowMap(true)}
                title="View map"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                <Map size={15} />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                onClick={() => setShowItinerary(true)}
                title="View detailed itinerary"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              >
                <BookOpen size={15} />
                <span className="hidden sm:inline">Itinerary</span>
              </button>
              {versions.length > 1 && (
                <button
                  onClick={() => setShowImport(true)}
                  title="Import activities from another version"
                  className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Download size={18} />
                </button>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          <div className="mt-2.5">
            <MemberFilter
              members={members}
              activeIds={filterMemberIds}
              onChange={setFilterMemberIds}
            />
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6">
        {!currentVersionId ? (
          <EmptyState onAdd={() => addVersion('Option A').then(id => setActiveVersionId(id))} />
        ) : dates.length === 0 ? (
          <NoDatesState onSettings={() => setShowSettings(true)} />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col md:flex-row gap-5 items-start">
              <div className="flex-1 min-w-0 space-y-3 w-full">
                {dates.map(date => (
                  <DayColumn
                    key={date}
                    date={date}
                    activities={activitiesByDate[date] || []}
                    hotels={hotels}
                    members={members}
                    filterMemberIds={filterMemberIds}
                    onAddActivity={(d, prefillIds) => setActivityModal({ date: d, prefillMemberIds: prefillIds })}
                    onAddTravel={(d) => setTravelModal({ date: d, currentCity: dateStates[d]?.cities?.[0] || null })}
                    onAddHotel={(d) => setActivityModal({ date: d, hotelMode: true })}
                    onEditActivity={(act) => setActivityModal({ activity: act })}
                    onEditTravel={(evt) => setTravelModal({ event: evt, date: evt.date, currentCity: evt.originCity || null })}
                    cities={dateStates[date]?.cities || []}
                    onEditCity={handleEditCity}
                    split={dateStates[date]?.split || null}
                    reunion={dateStates[date]?.reunion || null}
                    goneHome={goneHome}
                  />
                ))}
              </div>

              <div className="w-full md:w-72 md:flex-shrink-0 md:sticky md:top-[108px] md:max-h-[calc(100vh-130px)] md:overflow-y-auto scrollbar-thin">
                <UnassignedPanel
                  activities={unscheduled}
                  members={members}
                  filterMemberIds={filterMemberIds}
                  onAddActivity={() => setActivityModal({ date: '' })}
                  onEditActivity={(act) => setActivityModal({ activity: act })}
                />
              </div>
            </div>

            <DragOverlay>
              {dragActive && (
                <div className="rotate-2 scale-105 w-72">
                  <ActivityCard activity={dragActive} members={members} onClick={() => {}} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {activityModal && (
        <ActivityModal
          activity={activityModal.activity}
          date={activityModal.date}
          members={members}
          currentUserId={currentUserId}
          prefillMemberIds={activityModal.prefillMemberIds}
          hotelMode={activityModal.hotelMode || false}
          onSave={handleSaveActivity}
          onSaveComment={(newComments) => {
            if (activityModal?.activity) {
              updateActivity(activityModal.activity.id, { comments: newComments })
            }
          }}
          onDelete={handleDeleteActivity}
          onDuplicate={handleDuplicateActivity}
          onClose={() => setActivityModal(null)}
        />
      )}

      {travelModal && (
        <TravelModal
          date={travelModal.date}
          members={members}
          goneHome={goneHome}
          currentUserId={currentUserId}
          currentCity={travelModal.currentCity}
          event={travelModal.event}
          onSave={handleSaveTravelEvent}
          onDelete={handleDeleteTravelEvent}
          onClose={() => setTravelModal(null)}
        />
      )}

      {editingCity && (
        <CityEditModal
          date={editingCity.date}
          current={(cityAssignments[editingCity.date] || []).join(', ')}
          onSave={(cityStr) => handleSaveCity(editingCity.date, cityStr)}
          onClose={() => setEditingCity(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          members={members}
          tripDates={tripDates}
          currentUserId={currentUserId}
          onSelectUser={(id) => {
            localStorage.setItem('japan_trip_user', id)
            setCurrentUserId(id)
          }}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showImport && (
        <ImportModal
          versions={versions}
          currentVersionId={currentVersionId}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {showMap && dates.length > 0 && (
        <MapView
          dates={dates}
          activitiesByDate={activitiesByDate}
          hotels={hotels}
          members={members}
          dateStates={dateStates}
          tripDates={tripDates}
          onClose={() => setShowMap(false)}
        />
      )}

      {showItinerary && (
        <ItineraryView
          dates={dates}
          activitiesByDate={activitiesByDate}
          members={members}
          dateStates={dateStates}
          tripDates={tripDates}
          onClose={() => setShowItinerary(false)}
        />
      )}
    </div>
  )
}

function CityEditModal({ date, current, onSave, onClose }) {
  const [value, setValue] = useState(current)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-1">Set City for {date}</h3>
        <p className="text-xs text-gray-400 mb-3">Search for a city, or type manually. Separate multiple cities with commas.</p>
        <div className="mb-3">
          <CityAutocomplete
            value={value}
            onChange={setValue}
            placeholder="e.g. Tokyo"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => onSave(value)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">Save</button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 text-center">
      <div className="text-6xl mb-4">🗾</div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Start planning your trip</h2>
      <p className="text-gray-400 mb-6 max-w-sm">Create your first itinerary version, then set your trip dates in Settings.</p>
      <button
        onClick={onAdd}
        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
      >
        Create Itinerary
      </button>
    </div>
  )
}

function NoDatesState({ onSettings }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 text-center">
      <div className="text-5xl mb-4">📅</div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Set your trip dates</h2>
      <p className="text-gray-400 mb-6 max-w-sm">Open Settings to set your start and end dates — the calendar will appear automatically.</p>
      <button
        onClick={onSettings}
        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
      >
        <Settings size={16} />
        Open Settings
      </button>
    </div>
  )
}
