import { initializeApp, getApps, cert } from 'firebase-admin/app'
import logger from '@/lib/core/logger'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// Firebase Admin SDK の初期化（厳格なエラーハンドリング）
let firebaseAdminConfig: any
let app: any
let adminDb: any
let adminAuth: any

try {
  const { validateServerEnvironment } = require('@/lib/core/env-validation')
  const env = validateServerEnvironment()
  
  // 環境変数の存在確認
  if (!env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    throw new Error('Required environment variables are missing')
  }
  
  firebaseAdminConfig = {
    credential: cert({
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  }
  
  // 既に初期化されている場合は既存のアプリを使用
  app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0]
  adminDb = getFirestore(app)
  adminAuth = getAuth(app)
  
  logger.debug('✅ Firebase Admin SDK initialized successfully')
} catch (error) {
  logger.error('❌ Firebase Admin SDK initialization failed:', error)
  logger.error('Please ensure all required environment variables are set:')
  logger.error('  - NEXT_PUBLIC_FIREBASE_PROJECT_ID')
  logger.error('  - FIREBASE_CLIENT_EMAIL')
  logger.error('  - FIREBASE_PRIVATE_KEY')
  logger.error('\nRefer to env.example for required configuration.')
  
  // 環境変数が不足している場合は起動を停止
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
