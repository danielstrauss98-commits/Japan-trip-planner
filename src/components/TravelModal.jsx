import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import CityAutocomplete from './CityAutocomplete'

const TIME_OPTIONS = (() => {
  const opts = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour12 = h % 12 || 12
      const ampm = h < 12 ? 'AM' : 'PM'
      const min = m.toString().padStart(2, '0')
      opts.push({ value: `${h.toString().padStart(2, '0')}:${min}`, label: `${hour12}:${min} ${ampm}` })
    }
  }
  return opts
})()

const TRANSPORT_OPTIONS = [
  { id: 'flight', label: 'Flight', emoji: '✈️' },
  { id: 'bus', label: 'Bus', emoji: '🚌' },
  { id: 'train', label: 'Train', emoji: '🚄' },
]

const TRAVEL_TYPE_OPTIONS = [
  { id: 'start_of_trip', label: 'Start of Trip', emoji: '🌅' },
  { id: 'between_cities', label: 'Between Cities', emoji: '🔄' },
  { id: 'travel_home', label: 'Travel Home', emoji: '🏠' },
]

const TIME_OF_DAY_OPTIONS = [
  { id: 'morning', label: 'Morning', emoji: '🌅' },
  { id: 'afternoon', label: 'Afternoon', emoji: '☀️' },
  { id: 'evening', label: 'Evening', emoji: '🌙' },
]

export default function TravelModal({ date, members, goneHome, currentUserId, currentCity, event, onSave, onDelete, onClose }) {
  const isEdit = Boolean(event)
  const activeMembers = members.filter(m => !(goneHome || []).includes(m.id))

  const [form, setForm] = useState(() => isEdit ? {
    transportMethod: event.transportMethod || 'flight',
    travelType: event.travelType || '',
    timeOfDay: event.timeOfDay || [],
    startTime: event.startTime || '',
    memberIds: event.memberIds || activeMembers.map(m => m.id),
    originCity: event.originCity || currentCity || '',
    destinationCity: event.destinationCity || '',
  } : {
    transportMethod: 'flight',
    travelType: '',
    timeOfDay: [],
    startTime: '',
    memberIds: activeMembers.map(m => m.id),
    originCity: currentCity || '',
    destinationCity: '',
  })

  const toggle = (key, val) =>
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.travelType) return
    if (!form.destinationCity.trim() && form.travelType !== 'travel_home') return
    onSave({
      type: 'travel',
      transportMethod: form.transportMethod,
      travelType: form.travelType,
      timeOfDay: form.timeOfDay,
      startTime: form.startTime,
      memberIds: form.memberIds,
      originCity: form.originCity,
      destinationCity: form.destinationCity,
      date,
      order: Date.now(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{isEdit ? 'Edit Travel Event' : 'Add Travel Event'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Date</p>
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{date}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transport Method</label>
            <div className="flex gap-2">
              {TRANSPORT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, transportMethod: opt.id }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                    form.transportMethod === opt.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Travel Type *</label>
            <div className="flex gap-2">
              {TRAVEL_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, travelType: opt.id }))}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                    form.travelType === opt.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time of Day</label>
            <div className="flex gap-2">
              {TIME_OF_DAY_OPTIONS.map(opt => {
                const active = form.timeOfDay.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle('timeOfDay', opt.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {form.timeOfDay.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time (optional)</label>
              <select
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                <option value="">--</option>
                {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}

          {form.travelType !== 'travel_home' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <CityAutocomplete
                  value={form.originCity}
                  onChange={val => setForm(f => ({ ...f, originCity: val }))}
                  placeholder="Origin city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
                <CityAutocomplete
                  value={form.destinationCity}
                  onChange={val => setForm(f => ({ ...f, destinationCity: val }))}
                  placeholder="Destination city"
                />
              </div>
            </div>
          )}

          {form.travelType === 'travel_home' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departing from</label>
              <CityAutocomplete
                value={form.originCity}
                onChange={val => setForm(f => ({ ...f, originCity: val }))}
                placeholder="Origin city"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Who is traveling?</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, memberIds: activeMembers.map(m => m.id) }))}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              >
                👨‍👩‍👧‍👦 Everyone
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {activeMembers.map(member => {
                const selected = form.memberIds.includes(member.id)
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggle('memberIds', member.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-xs font-medium ${
                      selected
                        ? 'border-transparent shadow-md scale-105'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                    style={selected ? { borderColor: member.color, backgroundColor: member.color + '18' } : {}}
                  >
                    <span className="text-lg">{member.emoji}</span>
                    <span className="truncate w-full text-center" style={selected ? { color: member.color } : {}}>
                      {member.name.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {isEdit && (
              <button
                type="button"
                onClick={onDelete}
                className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete travel event"
              >
                <Trash2 size={16} />
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!form.travelType || (!form.destinationCity.trim() && form.travelType !== 'travel_home')}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isEdit ? 'Save Changes' : 'Add Travel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
