import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    // Firebase Admin SDKの状態をチェック
    const status = {
      adminDb: !!adminDb,
      adminAuth: !!adminAuth,
      timestamp: new Date().toISOString()
    }
    
    console.log('Firebase Admin SDK Status:', status)
    
    return NextResponse.json({
      status: 'ok',
      firebase: status,
      message: 'Firebase Admin SDK status check'
    })
  } catch (error) {
    console.error('Error checking Firebase Admin SDK status:', error)
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      firebase: {
        adminDb: !!adminDb,
        adminAuth: !!adminAuth
      }
    }, { status: 500 })
  }
}
