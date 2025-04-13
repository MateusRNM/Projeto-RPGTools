import { initializeApp } from "@firebase/app"
import { getAuth } from "@firebase/auth"
import { collection, doc, getFirestore } from "@firebase/firestore"
import { writable } from "svelte/store"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

export const app = initializeApp(firebaseConfig) 
export const firestore = getFirestore(app)
export const auth = getAuth(app)
export const userCollectionRef = collection(firestore, 'usuarios')
export const roomsCollectionRef = collection(firestore, 'salas')

export const roomRef = writable(null)
export function setRoomRef(roomName){
  roomRef.set(doc(roomsCollectionRef, roomName))
}