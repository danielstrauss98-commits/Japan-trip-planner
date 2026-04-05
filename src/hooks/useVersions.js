import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'

export function useVersions() {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Use client-side timestamp (Date.now()) instead of serverTimestamp() so the
    // orderBy('createdAt') query never transiently drops a newly-created version
    // while waiting for the server to write the timestamp.
    const q = query(collection(db, 'versions'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setVersions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('[useVersions] Firestore error:', err.code, err.message)
        setError(err)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  const addVersion = async (name) => {
    const ref = await addDoc(collection(db, 'versions'), {
      name,
      createdAt: Date.now(), // client timestamp — always immediately available
    })
    return ref.id
  }

  const renameVersion = (id, name) =>
    updateDoc(doc(db, 'versions', id), { name })

  const deleteVersion = (id) =>
    deleteDoc(doc(db, 'versions', id))

  const updateVersionData = (id, data) =>
    updateDoc(doc(db, 'versions', id), data)

  return { versions, loading, error, addVersion, renameVersion, deleteVersion, updateVersionData }
}
