export default function MemberFilter({ members, activeIds, onChange }) {
  const toggle = (id) =>
    onChange(activeIds.includes(id) ? activeIds.filter(x => x !== id) : [...activeIds, id])

  const allActive = activeIds.length === 0

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <span className="text-xs text-gray-400 flex-shrink-0">Filter:</span>
      <button
        onClick={() => onChange([])}
        className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
          allActive ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {members.map(member => {
        const active = activeIds.includes(member.id)
        return (
          <button
            key={member.id}
            onClick={() => toggle(member.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border-2 transition-all"
            style={active
              ? { backgroundColor: member.color + '22', borderColor: member.color, color: member.color }
              : { backgroundColor: 'transparent', borderColor: '#e5e7eb', color: '#9ca3af' }
            }
          >
            <span>{member.emoji}</span>
            <span>{member.name.split(' ')[0]}</span>
          </button>
        )
      })}
    </div>
  )
}
