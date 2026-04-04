import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { FAMILY_MEMBERS } from '../constants'

export function useSettings() {
  const [members, setMembers] = useState(FAMILY_MEMBERS)
  const [tripDates, setTripDates] = useState({ start: '', end: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'global', 'settings'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          if (data.members?.length) setMembers(data.members)
          if (data.tripDates) setTripDates(data.tripDates)
        }
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('[useSettings] Firestore error:', err.code, err.message)
        setError(err)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  const saveSettings = (newMembers, newTripDates) =>
    setDoc(doc(db, 'global', 'settings'), {
      members: newMembers,
      tripDates: newTripDates,
    })

  return { members, tripDates, loading, error, saveSettings }
}
