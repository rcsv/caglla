import { initializeApp, getApps, cert } from 'firebase-admin/app'
import logger from '@/lib/core/logger'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// Firebase Admin SDK の初期化（最小限検証版）
let firebaseAdminConfig: any
let app: any
let adminDb: any
let adminAuth: any

try {
  // 環境変数の直接確認（env-validationをスキップ）
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  logger.debug('🔍 Environment variables check:', {
    FIREBASE_PROJECT_ID: !!projectId,
    FIREBASE_CLIENT_EMAIL: !!clientEmail,
    FIREBASE_PRIVATE_KEY: !!privateKey
  })

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(`Missing required environment variables: PROJECT_ID=${!!projectId}, CLIENT_EMAIL=${!!clientEmail}, PRIVATE_KEY=${!!privateKey}`)
  }

  firebaseAdminConfig = {
    credential: cert({
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  }
  
  // 既に初期化されている場合は既存のアプリを使用
  app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0]
  adminDb = getFirestore(app)
  adminAuth = getAuth(app)
  
  logger.debug('✅ Firebase Admin SDK initialized successfully')
} catch (error) {
  // ビルド時は環境変数の検証エラーを無視
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
    logger.debug('🔧 Build time: Firebase Admin SDK initialization skipped')
    firebaseAdminConfig = null
    app = null
    adminDb = null
    adminAuth = null
  } else {
    logger.error('❌ Firebase Admin SDK initialization failed:', error)
    logger.error('Environment variables status:')
    logger.error(`  - FIREBASE_PROJECT_ID: ${!!process.env.FIREBASE_PROJECT_ID}`)
    logger.error(`  - FIREBASE_CLIENT_EMAIL: ${!!process.env.FIREBASE_CLIENT_EMAIL}`)
    logger.error(`  - FIREBASE_PRIVATE_KEY: ${!!process.env.FIREBASE_PRIVATE_KEY}`)
    
    // エラーを投げずにnullのままにする（検証用）
    firebaseAdminConfig = null
    app = null
    adminDb = null
    adminAuth = null
  }
}

// IDトークンの検証関数
export async function verifyIdToken(token: string) {
  if (!adminAuth) {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      logger.debug('🔧 Build time: Firebase Admin Auth verification skipped')
      return null
    }
    logger.warn('⚠️ Firebase Admin Auth not initialized')
    return null
  }
  return await adminAuth.verifyIdToken(token)
}

// Firestore Admin インスタンス
export { adminDb, adminAuth }
export default app