import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Replace these values with your Firebase project config
// Get them from: https://console.firebase.google.com → Project Settings → Your apps → Web app
const firebaseConfig = {
  apiKey: "AIzaSyCzjbwNnH9NJpaGRHg7wYVNFDGxabRxroo",
  authDomain: "japan-trip-planner-d06b2.firebaseapp.com",
  projectId: "japan-trip-planner-d06b2",
  storageBucket: "japan-trip-planner-d06b2.firebasestorage.app",
  messagingSenderId: "548429964911",
  appId: "1:548429964911:web:c57cb4b76076a30660cf9a",
  measurementId: "G-5MCLZZ7291"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
