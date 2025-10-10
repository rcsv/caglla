import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import logger from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    logger.debug('Auth debug API called')
    
    // Check if Firebase Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      logger.warn('Firebase Admin SDK not initialized')
      return NextResponse.json({ 
        error: 'Firebase Admin SDK not initialized',
        isInitialized: false 
      })
    }

    logger.debug('Firebase Admin SDK is initialized')

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    logger.debug('Auth header status', { present: !!authHeader })
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug('No valid authorization header')
      return NextResponse.json({ 
        error: 'No authorization header',
        hasAuthHeader: false 
      })
    }

    const idToken = authHeader.split('Bearer ')[1]
    logger.debug('ID token received', { length: idToken.length })
    // トークンプレビューは機密情報のため、本番環境では出力しない（logger.debugのみ）
    
    // Try to verify the ID token
    try {
      logger.debug('Attempting to verify ID token')
      const decodedToken = await adminAuth.verifyIdToken(idToken)
      const userId = decodedToken.uid
      logger.info('ID token verified successfully', { userId })
      
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
      logger.error('ID token verification failed', verifyError)
      return NextResponse.json({ 
        error: 'ID token verification failed',
        details: verifyError instanceof Error ? verifyError.message : 'Unknown error',
        tokenLength: idToken.length
        // tokenPreviewは機密情報のため削除
      }, { status: 401 })
    }
  } catch (error) {
    logger.error('Auth debug error', error)
    return NextResponse.json(
      { error: 'Auth debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
