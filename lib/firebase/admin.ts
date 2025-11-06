import { initializeApp, getApps, cert } from 'firebase-admin/app'
import logger from '@/lib/core/logger'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'

// Firebase Admin SDK の初期化（厳格なエラーハンドリング）
let firebaseAdminConfig: any
let app: any
let adminDb: any
let adminAuth: any
let adminStorage: any

try {
  // 環境変数の直接取得（fallbackあり）
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  
  logger.debug('🔍 Checking environment variables...')
  logger.debug(`Project ID: ${projectId ? 'Set' : 'Missing'}`)
  logger.debug(`Client Email: ${clientEmail ? 'Set' : 'Missing'}`)
  logger.debug(`Private Key: ${privateKey ? 'Set' : 'Missing'}`)
  logger.debug(`Storage Bucket: ${storageBucket ? 'Set' : 'Missing'}`)
  
  if (!projectId || !clientEmail || !privateKey) {
    const missing = []
    if (!projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID or FIREBASE_PROJECT_ID')
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL')
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY')
    
    logger.error(`❌ Missing environment variables: ${missing.join(', ')}`)
    throw new Error(`Required environment variables are missing: ${missing.join(', ')}`)
  }
  
  firebaseAdminConfig = {
    credential: cert({
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
    // Storage Bucketを明示的に指定
    storageBucket: storageBucket || `${projectId}.appspot.com`,
  }
  
  // 既に初期化されている場合は既存のアプリを使用
  app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0]
  adminDb = getFirestore(app)
  adminAuth = getAuth(app)
  // Storage BucketはfirebaseAdminConfigのstorageBucketで設定済み
  adminStorage = getStorage(app)
  
  logger.debug('✅ Firebase Admin SDK initialized successfully')
} catch (error) {
  logger.error('❌ Firebase Admin SDK initialization failed:', error)
  logger.error('Please ensure all required environment variables are set:')
  logger.error('  - NEXT_PUBLIC_FIREBASE_PROJECT_ID or FIREBASE_PROJECT_ID')
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
export { adminDb, adminAuth, adminStorage }
export default app
