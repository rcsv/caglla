import { initializeApp } from 'firebase/app'
import logger from '@/lib/core/logger'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase設定（本番環境用）
const firebaseConfig = {
  apiKey: "AIzaSyBzEYw-gYSfPHQICFtaRB4gMzMkR5z8EN4",
  authDomain: "caglla-fb.firebaseapp.com",
  projectId: "caglla-fb",
  storageBucket: "caglla-fb.firebasestorage.app",
  messagingSenderId: "17375032053",
  appId: "1:17375032053:web:e1f99ead356f5421c1cbbc",
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
