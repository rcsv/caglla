import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// Firebase Admin SDK の初期化
const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
}

// 既に初期化されている場合は既存のアプリを使用
const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0]

// Firestore Admin インスタンス
export const adminDb = getFirestore(app)

// Auth Admin インスタンス
export const adminAuth = getAuth(app)

export default app
