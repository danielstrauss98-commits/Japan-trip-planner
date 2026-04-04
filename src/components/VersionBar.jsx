import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

export default function VersionBar({ versions, activeId, onSelect, onAdd, onRename, onDelete }) {
  const [editing, setEditing] = useState(null) // { id, name }
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const commitRename = () => {
    if (editing && editing.name.trim()) {
      onRename(editing.id, editing.name.trim())
    }
    setEditing(null)
  }

  const commitAdd = async () => {
    const name = newName.trim() || `Option ${String.fromCharCode(65 + versions.length)}`
    const id = await onAdd(name)
    setAdding(false)
    setNewName('')
    if (id) onSelect(id)
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {versions.map(v => (
        <div key={v.id} className="flex-shrink-0">
          {editing?.id === v.id ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white border-2 border-indigo-400 shadow-sm">
              <input
                autoFocus
                value={editing.name}
                onChange={e => setEditing(ed => ({ ...ed, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(null) }}
                className="text-sm font-medium outline-none w-24"
              />
              <button onClick={commitRename} className="text-green-500 hover:text-green-600"><Check size={13} /></button>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-500"><X size={13} /></button>
            </div>
          ) : (
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium cursor-pointer transition-all group ${
              v.id === activeId
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}>
              <span onClick={() => onSelect(v.id)}>{v.name}</span>
              {v.id === activeId && (
                <div className="flex items-center gap-0.5 ml-1">
                  <button
                    onClick={() => setEditing({ id: v.id, name: v.name })}
                    className="p-0.5 rounded hover:bg-indigo-500 transition-colors"
                  >
                    <Pencil size={11} />
                  </button>
                  {versions.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${v.name}"? All activities in this version will be lost.`)) {
                          onDelete(v.id)
                          onSelect(versions.find(x => x.id !== v.id)?.id)
                        }
                      }}
                      className="p-0.5 rounded hover:bg-indigo-500 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white border-2 border-indigo-400 shadow-sm flex-shrink-0">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitAdd(); if (e.key === 'Escape') { setAdding(false); setNewName('') } }}
            placeholder={`Option ${String.fromCharCode(65 + versions.length)}`}
            className="text-sm font-medium outline-none w-24 placeholder:text-gray-300"
          />
          <button onClick={commitAdd} className="text-green-500 hover:text-green-600"><Check size={13} /></button>
          <button onClick={() => { setAdding(false); setNewName('') }} className="text-gray-400 hover:text-gray-500"><X size={13} /></button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-dashed border-gray-200 hover:border-indigo-300 transition-all"
        >
          <Plus size={14} />
          New version
        </button>
      )}
    </div>
  )
}
