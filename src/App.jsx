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
import { Settings, Download } from 'lucide-react'

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
  // Require BOTH a correct password AND a person selection.
  // This forces the splash to reappear when the person-picker feature is new.
  const [unlocked, setUnlocked] = useState(() =>
    localStorage.getItem('japan_trip_unlocked') === '1' &&
    Boolean(localStorage.getItem('japan_trip_user'))
  )
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem('japan_trip_user'))

  const { versions, loading: versionsLoading, error: versionsError, addVersion, renameVersion, deleteVersion } = useVersions()
  const [activeVersionId, setActiveVersionId] = useState(null)
  const { activities, addActivity, updateActivity, deleteActivity, error: activitiesError } = useActivities(
    activeVersionId || versions[0]?.id
  )
  const { members, tripDates, saveSettings, error: settingsError } = useSettings()

  const [activityModal, setActivityModal] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [filterMemberIds, setFilterMemberIds] = useState([])
  const [dragActive, setDragActive] = useState(null)

  const firestoreError = versionsError || activitiesError || settingsError

  const currentVersionId = activeVersionId || versions[0]?.id

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 10 } })
  )

  const dates = useMemo(() => getDatesInRange(tripDates.start, tripDates.end), [tripDates])

  const sortByTime = (arr) => [...arr].sort((a, b) => {
    const aTime = a.startTime || '99:99'
    const bTime = b.startTime || '99:99'
    if (aTime !== bTime) return aTime.localeCompare(bTime)
    return (a.order || 0) - (b.order || 0)
  })

  const activitiesByDate = useMemo(() => {
    const map = {}
    dates.forEach(d => { map[d] = [] })
    activities.forEach(a => {
      if (a.date && map[a.date]) map[a.date].push(a)
    })
    Object.keys(map).forEach(d => { map[d] = sortByTime(map[d]) })
    return map
  }, [activities, dates])

  // Activities with no date, or a date outside the trip range
  const unscheduled = useMemo(() =>
    sortByTime(activities.filter(a => !a.date || !dates.includes(a.date))),
    [activities, dates]
  )

  const handleDragStart = ({ active }) => {
    setDragActive(activities.find(a => a.id === active.id) || null)
  }

  const handleDragEnd = ({ active, over }) => {
    setDragActive(null)
    if (!over) return

    const activeActivity = activities.find(a => a.id === active.id)
    if (!activeActivity) return

    // ── Dropped onto the unassigned panel drop zone ──
    if (over.id === 'unassigned') {
      if (activeActivity.date) {
        const newOrder = (unscheduled.at(-1)?.order || 0) + 1000
        updateActivity(activeActivity.id, { date: '', order: newOrder })
      }
      return
    }

    // ── Dropped onto a day column drop zone ──
    if (over.id.startsWith('day-')) {
      const newDate = over.id.replace('day-', '')
      if (activeActivity.date !== newDate) {
        const dayActivities = activitiesByDate[newDate] || []
        const newOrder = (dayActivities.at(-1)?.order || 0) + 1000
        updateActivity(activeActivity.id, { date: newDate, order: newOrder })
      }
      return
    }

    // ── Dropped over another activity card ──
    const overActivity = activities.find(a => a.id === over.id)
    if (!overActivity) return

    const activeDate = activeActivity.date && dates.includes(activeActivity.date) ? activeActivity.date : ''
    const overDate = overActivity.date && dates.includes(overActivity.date) ? overActivity.date : ''

    if (activeDate === overDate) {
      // Reorder within the same bucket (same day or both unscheduled)
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
      // Move to overActivity's bucket, inserting at that position
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
    setActivityModal(null)
    if (activityModal?.activity) {
      updateActivity(activityModal.activity.id, form)
    } else {
      const bucket = form.date ? (activitiesByDate[form.date] || []) : unscheduled
      const order = (bucket.at(-1)?.order || 0) + 1000
      addActivity({ ...form, order, addedBy: currentUser?.name || '' })
    }
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

  // ── Password + person gate ──
  if (!unlocked) {
    return (
      <SplashScreen
        members={members}
        onUnlock={(memberId) => {
          setCurrentUserId(memberId)
          setUnlocked(true)
        }}
      />
    )
  }

  if (versionsLoading) {
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
      {/* Firestore error banner */}
      {firestoreError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>
            <strong>Firebase connection error</strong> — data may not be saving.
            Check your Firestore rules (test mode must be enabled) and your internet connection.
            Error: <code>{firestoreError.code}</code>
          </span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-full px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
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

            {/* Version bar */}
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

            {/* Current user + import + settings */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {currentUser && (
                <button
                  title={`Signed in as ${currentUser.name} — click to switch`}
                  onClick={() => {
                    localStorage.removeItem('japan_trip_user')
                    setUnlocked(false)
                    setCurrentUserId(null)
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-medium border-2 transition-all hover:scale-105"
                  style={{ borderColor: currentUser.color + '66', color: currentUser.color, background: currentUser.color + '12' }}
                >
                  <span className="text-base leading-none">{currentUser.emoji}</span>
                  <span className="hidden sm:inline">{currentUser.name}</span>
                </button>
              )}
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

          {/* Member filter */}
          <div className="mt-2.5">
            <MemberFilter
              members={members}
              activeIds={filterMemberIds}
              onChange={setFilterMemberIds}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
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
            {/* Single flex container — stacks vertically on mobile, side-by-side on md+ */}
            <div className="flex flex-col md:flex-row gap-5 items-start">
              {/* ── Itinerary: vertical stack of day rows ── */}
              <div className="flex-1 min-w-0 space-y-3 w-full">
                {dates.map(date => (
                  <DayColumn
                    key={date}
                    date={date}
                    activities={activitiesByDate[date] || []}
                    members={members}
                    filterMemberIds={filterMemberIds}
                    onAddActivity={(d) => setActivityModal({ date: d })}
                    onEditActivity={(act) => setActivityModal({ activity: act })}
                  />
                ))}
              </div>

              {/* ── Unassigned panel: right sidebar (single instance) ── */}
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

      {/* Modals */}
      {activityModal && (
        <ActivityModal
          activity={activityModal.activity}
          date={activityModal.date}
          members={members}
          onSave={handleSaveActivity}
          onDelete={handleDeleteActivity}
          onClose={() => setActivityModal(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          members={members}
          tripDates={tripDates}
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
