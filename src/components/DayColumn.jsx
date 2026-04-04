import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import ActivityCard from './ActivityCard'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function DayColumn({ date, activities, members, onAddActivity, onEditActivity, filterMemberIds }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${date}` })

  const d = new Date(date + 'T00:00:00')
  const dayName = DAY_NAMES[d.getDay()]
  const dayNum = d.getDate()
  const month = MONTH_NAMES[d.getMonth()]
  const isWeekend = d.getDay() === 0 || d.getDay() === 6

  const filteredActivities = filterMemberIds.length === 0
    ? activities
    : activities.filter(a => (a.memberIds || []).some(id => filterMemberIds.includes(id)))

  return (
    <div className={`flex gap-4 rounded-2xl border-2 p-4 transition-all ${
      isOver
        ? 'border-indigo-300 bg-indigo-50/40 shadow-md'
        : 'border-gray-100 bg-white shadow-sm hover:shadow-md'
    }`}>
      {/* Date label — fixed left column */}
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
          <span className="mt-2 text-xs text-gray-400 font-medium">
            {activities.length}
          </span>
        )}
      </div>

      {/* Vertical divider */}
      <div className={`w-px self-stretch ${isWeekend ? 'bg-indigo-100' : 'bg-gray-100'}`} />

      {/* Activities drop zone */}
      <div ref={setNodeRef} className="flex-1 min-w-0 min-h-16">
        <SortableContext items={filteredActivities.map(a => a.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {filteredActivities.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                members={members}
                onClick={() => onEditActivity(activity)}
              />
            ))}
          </div>
        </SortableContext>

        {filteredActivities.length === 0 && (
          <div className="h-10 flex items-center">
            <span className="text-xs text-gray-300">Drop activities here</span>
          </div>
        )}

        <button
          onClick={() => onAddActivity(date)}
          className="mt-2 flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-500 transition-colors py-1"
        >
          <Plus size={13} />
          Add activity
        </button>
      </div>
    </div>
  )
}
