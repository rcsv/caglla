import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // サーバー側の環境変数をチェック
    const serverEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL', 
      'FIREBASE_PRIVATE_KEY',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY',
      'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
      'NEXT_PUBLIC_GOOGLE_MAP_ID',
      'NEXT_PUBLIC_APP_URL',
    ]

    const envStatus = serverEnvVars.map(varName => ({
      variable: varName,
      value: process.env[varName] ? 'Available' : 'Missing',
      status: process.env[varName] ? 'available' : 'missing',
      source: 'server' as const
    }))

    // Firebase Admin SDKの初期化状態もチェック
    let firebaseAdminStatus = 'Not initialized'
    try {
      const { adminDb, adminAuth } = await import('@/lib/firebase/admin')
      if (adminDb && adminAuth) {
        firebaseAdminStatus = 'Initialized successfully'
      } else {
        firebaseAdminStatus = 'Failed to initialize'
      }
    } catch (error) {
      firebaseAdminStatus = `Error: ${error}`
    }

    return NextResponse.json({
      envStatus,
      firebaseAdminStatus,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      nextPhase: process.env.NEXT_PHASE
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check environment variables',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
