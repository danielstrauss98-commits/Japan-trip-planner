import { useState } from 'react'
import { X, Save } from 'lucide-react'

const MEMBER_COLORS = [
  '#f43f5e', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#6366f1', '#a855f7', '#ec4899'
]

const MEMBER_EMOJIS = ['👨', '👩', '👦', '👧', '👴', '👵', '🧑', '👤']

export default function SettingsModal({ members, tripDates, currentUserId, onSelectUser, onSave, onClose }) {
  const [localMembers, setLocalMembers] = useState(members)
  const [localDates, setLocalDates] = useState(tripDates)

  const updateMember = (idx, field, val) =>
    setLocalMembers(ms => ms.map((m, i) => i === idx ? { ...m, [field]: val } : m))

  const handleSave = () => {
    onSave(localMembers, localDates)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Trip Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Who are you */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Who are you?</h3>
            <div className="grid grid-cols-4 gap-2">
              {members.map(member => {
                const selected = member.id === currentUserId
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => onSelectUser(member.id)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-xs font-medium"
                    style={selected
                      ? { borderColor: member.color, backgroundColor: member.color + '18' }
                      : { borderColor: '#e5e7eb' }
                    }
                  >
                    <span className="text-2xl">{member.emoji}</span>
                    <span className="truncate w-full text-center text-xs"
                      style={selected ? { color: member.color } : { color: '#6b7280' }}>
                      {member.name.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Trip Dates */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Trip Dates</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={localDates.start}
                  onChange={e => setLocalDates(d => ({ ...d, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={localDates.end}
                  onChange={e => setLocalDates(d => ({ ...d, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Family Members */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Family Members</h3>
            <div className="space-y-3">
              {localMembers.map((member, idx) => (
                <div key={member.id} className="flex items-center gap-3">
                  {/* Emoji picker */}
                  <select
                    value={member.emoji}
                    onChange={e => updateMember(idx, 'emoji', e.target.value)}
                    className="text-xl border border-gray-200 rounded-lg px-1 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {MEMBER_EMOJIS.map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>

                  {/* Name */}
                  <input
                    type="text"
                    value={member.name}
                    onChange={e => updateMember(idx, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder={`Member ${idx + 1}`}
                  />

                  {/* Color */}
                  <div className="flex gap-1">
                    {MEMBER_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateMember(idx, 'color', color)}
                        className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: member.color === color ? '#1e1b4b' : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
          >
            <Save size={14} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
