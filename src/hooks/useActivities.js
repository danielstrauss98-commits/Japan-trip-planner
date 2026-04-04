import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'

export function useActivities(versionId) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!versionId) { setActivities([]); setLoading(false); return }
    const q = query(
      collection(db, 'versions', versionId, 'activities'),
      orderBy('order', 'asc')
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('[useActivities] Firestore error:', err.code, err.message)
        setError(err)
        setLoading(false)
      }
    )
    return unsub
  }, [versionId])

  const addActivity = (activity) =>
    addDoc(collection(db, 'versions', versionId, 'activities'), {
      ...activity,
      createdAt: serverTimestamp(),
    })

  const updateActivity = (id, data) =>
    updateDoc(doc(db, 'versions', versionId, 'activities', id), data)

  const deleteActivity = (id) =>
    deleteDoc(doc(db, 'versions', versionId, 'activities', id))

  return { activities, loading, error, addActivity, updateActivity, deleteActivity }
}
