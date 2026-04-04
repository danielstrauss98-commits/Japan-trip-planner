export const FAMILY_MEMBERS = [
  { id: 'member1', name: 'Daniel',  color: '#6366f1', emoji: '🧑' },
  { id: 'member2', name: 'Josh',    color: '#f97316', emoji: '🧑' },
  { id: 'member3', name: 'Steven',  color: '#22c55e', emoji: '🧑' },
  { id: 'member4', name: 'Linda',   color: '#ec4899', emoji: '👩' },
  { id: 'member5', name: 'Jack',    color: '#eab308', emoji: '🧑' },
  { id: 'member6', name: 'Henry',   color: '#06b6d4', emoji: '🧑' },
  { id: 'member7', name: 'Kim',     color: '#a855f7', emoji: '👩' },
  { id: 'member8', name: 'Braeme',  color: '#f43f5e', emoji: '🧑' },
]

export const ACTIVITY_CATEGORIES = [
  { id: 'sightseeing', label: 'Sightseeing', emoji: '🏯', color: 'bg-blue-100 text-blue-700' },
  { id: 'food',        label: 'Food & Drink', emoji: '🍜', color: 'bg-orange-100 text-orange-700' },
  { id: 'transport',   label: 'Transport',    emoji: '🚄', color: 'bg-gray-100 text-gray-700' },
  { id: 'shopping',    label: 'Shopping',     emoji: '🛍️', color: 'bg-pink-100 text-pink-700' },
  { id: 'nature',      label: 'Nature',       emoji: '🌸', color: 'bg-green-100 text-green-700' },
  { id: 'culture',     label: 'Culture',      emoji: '⛩️', color: 'bg-purple-100 text-purple-700' },
  { id: 'hotel',       label: 'Hotel',        emoji: '🏨', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'other',       label: 'Other',        emoji: '📌', color: 'bg-slate-100 text-slate-700' },
]

export const getCategoryById = (id) =>
  ACTIVITY_CATEGORIES.find(c => c.id === id) || ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1]

export const getMemberById = (id) =>
  FAMILY_MEMBERS.find(m => m.id === id)
