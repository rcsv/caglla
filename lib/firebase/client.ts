import { initializeApp } from 'firebase/app'
import logger from '@/lib/core/logger'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// 環境変数を検証システムを通じて取得
let firebaseConfig: any

try {
  // 環境変数検証システムを使用（開発環境ではフォールバック値も含む）
  // ここは警告が出るので、監視スクリプトを使わない
  const env = require('@/lib/core/env-validation').validateClientEnvironment({ suppressWarnings: true })
  firebaseConfig = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
} catch (error) {
  // フォールバック: 直接 process.env から取得（開発環境用）
  logger.warn('Environment validation failed, using direct process.env access:', error)
  firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dev-fallback',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dev-project.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dev-project',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dev-project.appspot.com',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
  }
}

// 環境変数の検証
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  logger.error('❌ Firebase configuration is missing required environment variables')
  logger.error('Required variables:', {
    NEXT_PUBLIC_FIREBASE_API_KEY: !!firebaseConfig.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!firebaseConfig.authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!firebaseConfig.projectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!firebaseConfig.storageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!firebaseConfig.messagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID: !!firebaseConfig.appId,
  })
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
