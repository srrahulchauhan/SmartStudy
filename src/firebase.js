import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBu3nfPlj2oS-FIFVExFIR-8agWxu2oaIA",
  authDomain: "esmatstudy-654ec.firebaseapp.com",
  projectId: "esmatstudy-654ec",
  storageBucket: "esmatstudy-654ec.firebasestorage.app",
  messagingSenderId: "14111794305",
  appId: "1:14111794305:web:650e06ea672c4cb3879980",
  measurementId: "G-05K1GD1RC8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged,
  signOut
};
