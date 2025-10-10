import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// Firebase Admin SDK の初期化（厳格なエラーハンドリング）
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
  console.error('❌ Firebase Admin SDK initialization failed:', error)
  console.error('Please ensure all required environment variables are set:')
  console.error('  - FIREBASE_PROJECT_ID')
  console.error('  - FIREBASE_CLIENT_EMAIL')
  console.error('  - FIREBASE_PRIVATE_KEY')
  console.error('\nRefer to env.example for required configuration.')
  
  // フォールバック設定を削除：環境変数が不足している場合は起動を停止
  throw new Error('Firebase Admin SDK initialization failed due to missing or invalid environment variables')
}

// IDトークンの検証関数
export async function verifyIdToken(token: string) {
  if (!adminAuth) {
    throw new Error('Firebase Admin Auth not initialized')
  }
  return await adminAuth.verifyIdToken(token)
}

// Firestore Admin インスタンス
export { adminDb, adminAuth }
export default app
