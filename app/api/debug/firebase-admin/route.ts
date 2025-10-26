import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'

export async function GET(request: NextRequest) {
  try {
    // 環境変数の確認
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }

    // Firebase Admin SDKの初期化テスト
    let firebaseAdminStatus = 'not_initialized'
    let errorMessage = null

    try {
      const { adminDb, adminAuth } = await import('@/lib/firebase/admin')
      
      if (adminDb && adminAuth) {
        firebaseAdminStatus = 'initialized'
        
        // Firestore接続テスト
        const testDoc = await adminDb.collection('_test').doc('connection').get()
        firebaseAdminStatus = 'connected'
      } else {
        firebaseAdminStatus = 'failed'
        errorMessage = 'Firebase Admin SDK not initialized'
      }
    } catch (error) {
      firebaseAdminStatus = 'error'
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
    }

    const result = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      firebaseAdmin: {
        status: firebaseAdminStatus,
        error: errorMessage
      },
      message: 'Firebase Admin SDK minimal test'
    }

    logger.debug('Firebase Admin SDK Test Result:', result)
    
    return NextResponse.json(result)
  } catch (error) {
    logger.error('Firebase Admin SDK Test Error:', error)
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
