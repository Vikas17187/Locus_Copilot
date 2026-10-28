import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyARXAwC_P2K35FtpB3T6j5Iqw5NOLVzDQ0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "locus-1e383.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "locus-1e383",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "locus-1e383.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "625821858970",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:625821858970:web:752f9c663a4edb0b88b323"
};

// Initialize Firebase (Singleton pattern to prevent re-initialization during HMR)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
