import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Inbox } from 'lucide-react'
import ActivityCard from './ActivityCard'

export default function UnassignedPanel({ activities, members, filterMemberIds, onAddActivity, onEditActivity }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' })

  const filtered = filterMemberIds.length === 0
    ? activities
    : activities.filter(a => (a.memberIds || []).some(id => filterMemberIds.includes(id)))

  return (
    <div className="w-72 flex-shrink-0 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Inbox size={15} className="text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-600">Unassigned</h2>
        {activities.length > 0 && (
          <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
            {activities.length}
          </span>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={() => onAddActivity(null)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 border-2 border-gray-300 hover:border-indigo-300 transition-all"
      >
        <Plus size={15} />
        Add Activity
      </button>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-2xl p-3 min-h-64 transition-all border-2 ${
          isOver
            ? 'border-indigo-300 bg-indigo-50/60'
            : 'border-dashed border-gray-200 bg-gray-50/60'
        }`}
      >
        <SortableContext items={filtered.map(a => a.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {filtered.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                members={members}
                onClick={() => onEditActivity(activity)}
              />
            ))}
          </div>
        </SortableContext>

        {filtered.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center gap-2 text-gray-300">
            <Inbox size={24} strokeWidth={1.5} />
            <span className="text-xs text-center leading-relaxed px-2">
              {isOver ? 'Drop here to unschedule' : 'Drag activities here\nto unschedule them'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
