import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Auth debug API called')
    
    // Check if Firebase Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      console.warn('⚠️ Firebase Admin SDK not initialized')
      return NextResponse.json({ 
        error: 'Firebase Admin SDK not initialized',
        isInitialized: false 
      })
    }

    console.log('✅ Firebase Admin SDK is initialized')

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    console.log('🔑 Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header')
      return NextResponse.json({ 
        error: 'No authorization header',
        hasAuthHeader: false 
      })
    }

    const idToken = authHeader.split('Bearer ')[1]
    console.log('🔑 ID token length:', idToken.length)
    console.log('🔑 ID token preview:', idToken.substring(0, 50) + '...')
    
    // Try to verify the ID token
    try {
      console.log('🔍 Attempting to verify ID token...')
      const decodedToken = await adminAuth.verifyIdToken(idToken)
      const userId = decodedToken.uid
      console.log('✅ ID token verified successfully, userId:', userId)
      
      return NextResponse.json({ 
        success: true,
        userId: userId,
        tokenInfo: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          email_verified: decodedToken.email_verified,
          auth_time: decodedToken.auth_time,
          exp: decodedToken.exp
        }
      })
    } catch (verifyError) {
      console.error('❌ ID token verification failed:', verifyError)
      return NextResponse.json({ 
        error: 'ID token verification failed',
        details: verifyError instanceof Error ? verifyError.message : 'Unknown error',
        tokenLength: idToken.length,
        tokenPreview: idToken.substring(0, 50) + '...'
      }, { status: 401 })
    }
  } catch (error) {
    console.error('❌ Auth debug error:', error)
    return NextResponse.json(
      { error: 'Auth debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
