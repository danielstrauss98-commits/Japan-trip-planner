import { useState, useEffect } from 'react'

const BG = 'linear-gradient(160deg, #1e1b4b 0%, #312e81 35%, #7c1d40 75%, #450a0a 100%)'
const BTN_BG = 'linear-gradient(135deg, #6366f1, #a855f7)'

export default function SplashScreen({ onUnlock }) {
  const [step, setStep] = useState(
    localStorage.getItem('japan_trip_unlocked') === '1' ? 'done' : 'password'
  )
  const [password, setPassword] = useState('')
  const [shaking, setShaking] = useState(false)

  // Already unlocked — call onUnlock immediately
  useEffect(() => {
    if (step === 'done') onUnlock()
  }, [])

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (password.toLowerCase() === 'japan') {
      localStorage.setItem('japan_trip_unlocked', '1')
      onUnlock()
    } else {
      setShaking(true)
      setPassword('')
      setTimeout(() => setShaking(false), 500)
    }
  }

  if (step === 'done') return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center"
      style={{ background: BG }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.18) 0%, transparent 70%)' }}
      />
      <div className="relative z-10 w-full max-w-sm mx-4 text-center">
        <div className="mb-8">
          <div className="text-8xl mb-4 drop-shadow-lg select-none">⛩️</div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-1">Japan Trip</h1>
          <p className="text-indigo-300 text-base">Family Adventure Planner</p>
          <div className="flex items-center justify-center gap-3 mt-3 text-2xl opacity-50 select-none">
            <span>🌸</span><span>🗻</span><span>🍱</span><span>🚄</span><span>🌸</span>
          </div>
        </div>
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
      </div>
    </div>
  )
}
