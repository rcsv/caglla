import { initializeApp } from 'firebase/app'
import logger from '@/lib/core/logger'
import { getAuth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase設定（本番環境用）
const firebaseConfig = {
  apiKey: "AIzaSyBzEYw-gYSfPHQICFtaRB4gMzMkR5z8EN4",
  authDomain: "caglla-fb.firebaseapp.com",
  projectId: "caglla-fb",
  storageBucket: "caglla-fb.firebasestorage.app", // これはあってるから。appspot.com じゃないからね！
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

/**
 * 初期化済みのFirestoreインスタンスを取得
 * 初期化に失敗している場合はエラーをスロー
 * 
 * Non-nullアサーション（`!`）を使用して、TypeScriptの型チェックをパスする。
 * 実行時のチェックで`db`が`null`の場合はエラーをスローするため安全。
 * 
 * @returns Firestoreインスタンス
 * @throws Error 初期化に失敗している場合
 */
export function getSafeFirestore(): Firestore {
  if (!db) {
    logger.error('Firestore client not initialized')
    throw new Error('Firestore client not initialized')
  }
  // Non-nullアサーション: 実行時チェック済みのため安全
  return db!
}

export { firebaseConfig, auth, db, storage }
export default app
