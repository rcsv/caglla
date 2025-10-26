import { initializeApp } from 'firebase/app'
import logger from '@/lib/core/logger'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase設定（環境変数が利用可能な場合はそれを使用、そうでなければハードコード値）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBzEYw-gYSfPHQICFtaRB4gMzMkR5z8EN4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "caglla-fb.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "caglla-fb",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "caglla-fb.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "17375032053",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:17375032053:web:e1f99ead356f5421c1cbbc",
}

// Firebase設定の検証
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  logger.error('❌ Firebase configuration is missing required values')
}

// Initialize Firebase
let app: any
let auth: any
let db: any
let storage: any

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
} catch (error) {
  logger.error('❌ Firebase initialization failed:', error)
  // フォールバック用のダミーオブジェクト
  app = null
  auth = null
  db = null
  storage = null
}

export { firebaseConfig, auth, db, storage }
export default app
