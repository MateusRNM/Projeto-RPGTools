import { initializeApp } from "@firebase/app"
import { getAuth } from "@firebase/auth"
import { collection, doc, getFirestore } from "@firebase/firestore"
import { writable } from "svelte/store"

const firebaseConfig = {
  apiKey: "AIzaSyAMr1F4rMtL-PGXUTAn64f28nZzKBksea0",
  authDomain: "rpgtools-3f412.firebaseapp.com",
  projectId: "rpgtools-3f412",
  storageBucket: "rpgtools-3f412.firebasestorage.app",
  messagingSenderId: "908558412169",
  appId: "1:908558412169:web:10e8e3cd841df9f91b1958",
  measurementId: "G-9CXXNRNT92"
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