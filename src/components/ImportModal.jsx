import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { getCategoryById } from '../constants'
import { X, Download } from 'lucide-react'

export default function ImportModal({ versions, currentVersionId, onImport, onClose }) {
  const [sourceVersionId, setSourceVersionId] = useState('')
  const [sourceActivities, setSourceActivities] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)

  const otherVersions = versions.filter(v => v.id !== currentVersionId)

  useEffect(() => {
    if (!sourceVersionId) { setSourceActivities([]); setSelectedIds(new Set()); return }
    setLoading(true)
    getDocs(
      query(collection(db, 'versions', sourceVersionId, 'activities'), orderBy('order', 'asc'))
    ).then(snap => {
      setSourceActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [sourceVersionId])

  const toggleId = (id) => setSelectedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleImport = () => {
    const toImport = sourceActivities
      .filter(a => selectedIds.has(a.id))
      // Strip the original ID so Firestore assigns new ones; clear the date so they land in Unassigned
      .map(({ id, ...rest }) => ({ ...rest, date: '' }))
    onImport(toImport)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Import Activities</h2>
            <p className="text-xs text-gray-400 mt-0.5">Copies selected activities into Unassigned</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Source version picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Copy from version</label>
            {otherVersions.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No other versions exist yet.</p>
            ) : (
              <select
                value={sourceVersionId}
                onChange={e => setSourceVersionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                <option value="">Select a version…</option>
                {otherVersions.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-8 text-gray-400 text-sm">Loading activities…</div>
          )}

          {/* Empty */}
          {!loading && sourceVersionId && sourceActivities.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">This version has no activities.</div>
          )}

          {/* Activity checklist */}
          {!loading && sourceActivities.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">
                  {selectedIds.size} of {sourceActivities.length} selected
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedIds(new Set(sourceActivities.map(a => a.id)))}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-gray-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {sourceActivities.map(act => {
                  const cat = getCategoryById(act.category)
                  const checked = selectedIds.has(act.id)
                  return (
                    <label
                      key={act.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? 'border-indigo-200 bg-indigo-50'
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleId(act.id)}
                        className="accent-indigo-600 w-4 h-4 flex-shrink-0"
                      />
                      <span className="text-base select-none">{cat.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-700 truncate">{act.title}</div>
                        <div className="text-xs text-gray-400 flex gap-2">
                          {act.date && <span>{act.date}</span>}
                          {act.startTime && <span>{act.startTime}</span>}
                          {act.location && <span className="truncate">{act.location}</span>}
                        </div>
                      </div>
                      {act.booked && (
                        <span className="text-green-500 text-xs font-bold flex-shrink-0" title="Booked">✓</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
          >
            <Download size={14} />
            Import {selectedIds.size > 0 ? `${selectedIds.size} activit${selectedIds.size === 1 ? 'y' : 'ies'}` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
