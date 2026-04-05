import { useState, useEffect } from 'react'
import { X, Trash2, Plus, Link, MessageSquare } from 'lucide-react'
import { ACTIVITY_CATEGORIES } from '../constants'

const TIME_OF_DAY_OPTIONS = [
  { id: 'morning',   label: 'Morning',   emoji: '🌅' },
  { id: 'afternoon', label: 'Afternoon', emoji: '☀️' },
  { id: 'night',     label: 'Night',     emoji: '🌙' },
  { id: 'other',     label: 'Other',     emoji: '⏰' },
]

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

export default function ActivityModal({ activity, date, members, currentUserId, prefillMemberIds, onSave, onSaveComment, onDelete, onClose }) {
  const isEdit = Boolean(activity)
  const currentUser = members.find(m => m.id === currentUserId)

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: date || '',
    startTime: '',
    endTime: '',
    timeOfDay: [],
    category: 'sightseeing',
    location: '',
    notes: '',
    memberIds: prefillMemberIds || [],
    booked: false,
    mustDo: false,
    order: Date.now(),
    comments: [],
    links: [],
  })
  const [commentInput, setCommentInput] = useState('')

  useEffect(() => {
    if (activity) setForm(f => ({
      ...f, ...activity,
      timeOfDay: activity.timeOfDay || [],
      comments: activity.comments || [],
      links: activity.links || [],
      mustDo: activity.mustDo || false,
    }))
  }, [activity])

  const hasOther = form.timeOfDay.includes('other')
  const showExactTime = form.timeOfDay.length > 0 || form.startTime || form.endTime

  const toggle = (key, val) =>
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }))

  const handleAddComment = () => {
    const text = commentInput.trim()
    if (!text) return
    const comment = {
      text,
      authorId: currentUserId || '',
      authorName: currentUser?.name || 'Someone',
      createdAt: Date.now(),
    }
    const newComments = [...form.comments, comment]
    setForm(f => ({ ...f, comments: newComments }))
    setCommentInput('')
    if (isEdit && onSaveComment) onSaveComment(newComments)
  }

  const handleAddLink = () =>
    setForm(f => ({ ...f, links: [...f.links, ''] }))

  const handleLinkChange = (i, val) =>
    setForm(f => ({ ...f, links: f.links.map((l, idx) => idx === i ? val : l) }))

  const handleRemoveLink = (i) =>
    setForm(f => ({ ...f, links: f.links.filter((_, idx) => idx !== i) }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave({ ...form, links: form.links.filter(l => l.trim()) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? 'Edit Activity' : 'Add Activity'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Name *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Visit Fushimi Inari"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              required
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.category === cat.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Time of Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time of Day</label>
            <div className="flex flex-wrap gap-2">
              {TIME_OF_DAY_OPTIONS.map(opt => {
                const active = form.timeOfDay.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle('timeOfDay', opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
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
            {hasOther && (
              <p className="text-xs text-indigo-500 mt-1.5">Exact start time is required for "Other"</p>
            )}
          </div>

          {/* Exact Time — shown when any TOD is selected, or when existing time is set */}
          {showExactTime && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start time{hasOther ? ' *' : ' (optional)'}
                </label>
                <select
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  required={hasOther}
                  className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                >
                  <option value="">--</option>
                  {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End time (optional)</label>
                <select
                  value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                >
                  <option value="">--</option>
                  {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Kyoto, Fushimi Ward"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What are you doing here?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Tips</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Booking info, tips..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Link size={13} className="text-gray-400" />
                Links
              </label>
              <button
                type="button"
                onClick={handleAddLink}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              >
                <Plus size={11} />
                Add Link
              </button>
            </div>
            {form.links.length > 0 && (
              <div className="space-y-2">
                {form.links.map((link, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="url"
                      value={link}
                      onChange={e => handleLinkChange(i, e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(i)}
                      className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
              <MessageSquare size={13} className="text-gray-400" />
              Comments
            </label>

            {form.comments.length > 0 && (
              <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto">
                {form.comments.map((c, i) => (
                  <div key={i} className="flex gap-1.5 text-sm bg-gray-50 rounded-lg px-3 py-2 leading-snug">
                    <span className="font-semibold text-gray-700 flex-shrink-0">{c.authorName}:</span>
                    <span className="text-gray-600">{c.text}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment() } }}
                placeholder={currentUser ? `Comment as ${currentUser.name}…` : 'Add a comment…'}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!commentInput.trim()}
                className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                Add
              </button>
            </div>
          </div>

          {/* Family Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Who's joining?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, memberIds: members.map(m => m.id) }))}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                >
                  👨‍👩‍👧‍👦 Everyone
                </button>
                {form.memberIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, memberIds: [] }))}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {members.map(member => {
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

          {/* Must Do toggle */}
          <label
            className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none"
            style={form.mustDo
              ? { borderColor: '#f59e0b', background: '#fffbeb' }
              : { borderColor: '#e5e7eb', background: 'transparent' }
            }
          >
            <input
              type="checkbox"
              checked={form.mustDo || false}
              onChange={e => setForm(f => ({ ...f, mustDo: e.target.checked }))}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all ${
              form.mustDo ? 'bg-amber-400 border-amber-400' : 'border-gray-300'
            }`}>
              {form.mustDo && <span className="text-white text-[11px] font-bold leading-none">★</span>}
            </div>
            <div className="flex-1">
              <span className={`text-sm font-medium ${form.mustDo ? 'text-amber-700' : 'text-gray-600'}`}>
                Must Do
              </span>
              {!form.mustDo && (
                <p className="text-xs text-gray-400 leading-tight">Mark as a top priority activity</p>
              )}
            </div>
            {form.mustDo && <span className="text-xl select-none">⭐</span>}
          </label>

          {/* Booked toggle */}
          <label
            className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none"
            style={form.booked
              ? { borderColor: '#22c55e', background: '#f0fdf4' }
              : { borderColor: '#e5e7eb', background: 'transparent' }
            }
          >
            <input
              type="checkbox"
              checked={form.booked || false}
              onChange={e => setForm(f => ({ ...f, booked: e.target.checked }))}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all ${
              form.booked ? 'bg-green-500 border-green-500' : 'border-gray-300'
            }`}>
              {form.booked && <span className="text-white text-xs font-bold leading-none">✓</span>}
            </div>
            <span className={`text-sm font-medium flex-1 ${form.booked ? 'text-green-700' : 'text-gray-600'}`}>
              Booked / Confirmed
            </span>
            {form.booked && <span className="text-lg select-none">🎟️</span>}
          </label>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {isEdit && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                Delete
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
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              {isEdit ? 'Save Changes' : 'Add Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
