import { useState, useEffect } from 'react'

const SUSHI_COUNT = 14
const BG = 'linear-gradient(160deg, #1e1b4b 0%, #312e81 35%, #7c1d40 75%, #450a0a 100%)'
const BTN_BG = 'linear-gradient(135deg, #6366f1, #a855f7)'

function generateSushis() {
  return Array.from({ length: SUSHI_COUNT }, (_, i) => ({
    id: i,
    left: `${5 + Math.random() * 90}%`,
    duration: `${9 + Math.random() * 12}s`,
    delay: `${Math.random() * 14}s`,
    size: `${1.4 + Math.random() * 1.4}rem`,
  }))
}

export default function SplashScreen({ members, onUnlock }) {
  // If already password-unlocked from a previous visit, jump straight to person selection
  const [step, setStep] = useState(
    localStorage.getItem('japan_trip_unlocked') === '1' ? 'person' : 'password'
  )
  const [password, setPassword] = useState('')
  const [shaking, setShaking] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [sushis] = useState(generateSushis)

  // Auto-advance from welcome screen into the app after 2.5 s
  useEffect(() => {
    if (step !== 'welcome' || !selectedMember) return
    const t = setTimeout(() => onUnlock(selectedMember.id), 2500)
    return () => clearTimeout(t)
  }, [step, selectedMember, onUnlock])

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (password.toLowerCase() === 'japan') {
      localStorage.setItem('japan_trip_unlocked', '1')
      setStep('person')
    } else {
      setShaking(true)
      setPassword('')
      setTimeout(() => setShaking(false), 500)
    }
  }

  const handlePersonSelect = (member) => {
    localStorage.setItem('japan_trip_user', member.id)
    setSelectedMember(member)
    setStep('welcome')
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center"
      style={{ background: BG }}
    >
      {/* Floating sushi */}
      {sushis.map(s => (
        <span
          key={s.id}
          className="sushi-float"
          style={{ left: s.left, bottom: 0, fontSize: s.size, animationDuration: s.duration, animationDelay: s.delay, zIndex: 0 }}
        >
          🍣
        </span>
      ))}

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.18) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4 text-center">

        {/* ── Shared header ── */}
        {step !== 'welcome' && (
          <div className="mb-8">
            <div className="text-8xl mb-4 drop-shadow-lg select-none">⛩️</div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-1">Japan Trip</h1>
            <p className="text-indigo-300 text-base">Family Adventure Planner</p>
            <div className="flex items-center justify-center gap-3 mt-3 text-2xl opacity-50 select-none">
              <span>🌸</span><span>🗻</span><span>🍱</span><span>🚄</span><span>🌸</span>
            </div>
          </div>
        )}

        {/* ── Step 1: Password ── */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col items-center gap-3">
            <div className={`w-full ${shaking ? 'shake' : ''}`}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                className="w-full px-5 py-3.5 rounded-2xl text-center text-white text-base font-medium placeholder-indigo-300 outline-none border-2 transition-all focus:border-indigo-400"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderColor: shaking ? '#f43f5e' : 'rgba(165,180,252,0.3)',
                  backdropFilter: 'blur(8px)',
                }}
              />
              {shaking && (
                <p className="text-rose-400 text-sm mt-2 font-medium">Incorrect password. Try again.</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl text-base font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              style={{ background: BTN_BG }}
            >
              Enter 🗾
            </button>
            <p className="text-indigo-400/50 text-xs mt-1">Shared with love · {new Date().getFullYear()}</p>
          </form>
        )}

        {/* ── Step 2: Person selector ── */}
        {step === 'person' && (
          <div>
            <p className="text-indigo-200 font-medium mb-4">Who are you?</p>
            <div className="grid grid-cols-4 gap-3">
              {members.map(member => (
                <button
                  key={member.id}
                  onClick={() => handlePersonSelect(member)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95"
                  style={{ background: member.color + '28', borderColor: member.color + '88' }}
                >
                  <span className="text-3xl leading-none select-none">{member.emoji}</span>
                  <span
                    className="text-xs font-semibold w-full text-center truncate"
                    style={{ color: member.color }}
                  >
                    {member.name}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-indigo-400/50 text-xs mt-5">Your choice is saved on this device</p>
          </div>
        )}

        {/* ── Step 3: Welcome message ── */}
        {step === 'welcome' && selectedMember && (
          <div className="flex flex-col items-center">
            <div className="text-8xl mb-5 select-none" style={{ filter: 'drop-shadow(0 0 20px rgba(165,180,252,0.5))' }}>
              {selectedMember.emoji}
            </div>
            <p className="text-indigo-300 text-lg font-medium mb-3">{selectedMember.name}</p>
            <h2 className="text-5xl font-bold text-white mb-2 tracking-wide">ようこそ</h2>
            <p className="text-3xl font-light mb-1" style={{ color: selectedMember.color }}>忍者！</p>
            <p className="text-indigo-300/70 text-sm mb-8">Welcome, Ninja!</p>
            {/* Progress bar */}
            <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="welcome-bar h-full rounded-full" style={{ background: selectedMember.color }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
