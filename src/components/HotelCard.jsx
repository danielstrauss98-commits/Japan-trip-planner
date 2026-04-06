import { MapPin } from 'lucide-react'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(str) {
  if (!str) return ''
  const d = new Date(str + 'T00:00:00')
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
}

export default function HotelCard({ hotel, role, members, onClick }) {
  const attending = members.filter(m => (hotel.memberIds || []).includes(m.id))

  let roleLabel = ''
  if (role === 'checkin')  roleLabel = `Check-in · ${fmtDate(hotel.checkInDate)}`
  else if (role === 'checkout') roleLabel = `Check-out · ${fmtDate(hotel.checkOutDate)}`
  else if (role === 'middle')   roleLabel = 'Overnight stay'
  else if (role === 'single')   roleLabel = `${fmtDate(hotel.checkInDate)} – ${fmtDate(hotel.checkOutDate)}`

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-indigo-100 bg-indigo-50/70 cursor-pointer hover:bg-indigo-100/80 transition-colors"
      onClick={onClick}
    >
      <span className="text-lg flex-shrink-0 leading-none">🏨</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-indigo-900 truncate leading-tight">{hotel.title}</p>
        <p className="text-xs text-indigo-400 mt-0.5">{roleLabel}</p>
        {hotel.location && (
          <p className="flex items-center gap-1 text-xs text-indigo-400 mt-0.5 truncate">
            <MapPin size={9} className="flex-shrink-0" />
            {hotel.location}
          </p>
        )}
      </div>
      {attending.length > 0 && (
        <div className="flex gap-0.5 flex-shrink-0">
          {attending.map(m => (
            <span
              key={m.id}
              title={m.name}
              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
              style={{ backgroundColor: m.color }}
            >
              {m.name[0]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
