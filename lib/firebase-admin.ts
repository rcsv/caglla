import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// Firebase Admin SDK の初期化（エラーハンドリング付き）
let firebaseAdminConfig: any
let app: any
let adminDb: any
let adminAuth: any

try {
  const { validateServerEnvironment } = require('./env-validation')
  const env = validateServerEnvironment()
  
  firebaseAdminConfig = {
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  }
  
  // 既に初期化されている場合は既存のアプリを使用
  app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0]
  adminDb = getFirestore(app)
  adminAuth = getAuth(app)
  
  console.log('✅ Firebase Admin SDK initialized successfully')
} catch (error) {
  console.warn('⚠️ Firebase Admin SDK environment validation failed, using fallback config:', error)
  
  // フォールバック設定
  firebaseAdminConfig = {
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'dev-project',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'dev@dev-project.iam.gserviceaccount.com',
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\ndev-key\n-----END PRIVATE KEY-----').replace(/\\n/g, '\n'),
    }),
  }
  
  try {
    app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0]
    adminDb = getFirestore(app)
    adminAuth = getAuth(app)
    console.log('✅ Firebase Admin SDK initialized with fallback config')
  } catch (initError) {
    console.error('❌ Firebase Admin SDK initialization failed:', initError)
    app = null
    adminDb = null
    adminAuth = null
  }
}

// Firestore Admin インスタンス
export { adminDb, adminAuth }
export default app
