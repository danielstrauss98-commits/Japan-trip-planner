import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, MapPin, GripVertical } from 'lucide-react'
import { getCategoryById } from '../constants'

export default function ActivityCard({ activity, members, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const cat = getCategoryById(activity.category)
  const activityMembers = members.filter(m => (activity.memberIds || []).includes(m.id))

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Booked badge — top-right corner */}
      {activity.booked && (
        <div
          className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm"
          title="Booked"
        >
          <span className="text-white text-xs font-bold leading-none">✓</span>
        </div>
      )}

      <div className="flex items-start gap-2 p-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>

        <div className="flex-1 min-w-0 pr-4">
          {/* Category chip + title */}
          <div className="flex items-start gap-2 mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${cat.color}`}>
              {cat.emoji}
            </span>
            <span className="text-sm font-medium text-gray-800 leading-tight">{activity.title}</span>
          </div>

          {/* Notes */}
          {activity.notes && (
            <p className="text-xs text-gray-400 mt-0.5 mb-1 leading-relaxed line-clamp-2">
              {activity.notes}
            </p>
          )}

          {/* Time & location */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
            {(activity.startTime || activity.endTime) && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={10} />
                {activity.startTime}{activity.endTime ? ` – ${activity.endTime}` : ''}
              </span>
            )}
            {activity.location && (
              <span className="flex items-center gap-1 text-xs text-gray-500 truncate max-w-[140px]">
                <MapPin size={10} />
                <span className="truncate">{activity.location}</span>
              </span>
            )}
          </div>

          {/* Member dots */}
          {activityMembers.length > 0 && (
            <div className="flex gap-1 flex-wrap mb-1.5">
              {activityMembers.map(m => (
                <span
                  key={m.id}
                  title={m.name}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: m.color }}
                >
                  {m.name.charAt(0)}
                </span>
              ))}
            </div>
          )}

          {/* Added by */}
          {activity.addedBy && (
            <p className="text-xs text-gray-300 leading-none mt-0.5">
              Added by {activity.addedBy}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
