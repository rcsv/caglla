import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations } from '@/lib/firebase/admin-operation'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import type { Trip } from '@/lib/core/types'
import logger from '@/lib/core/logger'

export async function GET(request: NextRequest) {
  try {
    logger.debug('Recommended trips API called')
    
    // Check if Firebase Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      logger.warn('Firebase Admin SDK not initialized, returning empty recommended trips')
      return NextResponse.json({ trips: [] })
    }

    logger.debug('Firebase Admin SDK is initialized')

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug('No authorization header')
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    logger.debug('ID token extracted', { length: idToken.length })
    
    // Verify the ID token
    logger.debug('Verifying ID token')
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid
    logger.debug('ID token verified', { userId })

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 6
    const excludeUserId = searchParams.get('excludeUserId') || userId

    // Get all public trips that are not created by the current user
    logger.debug('Fetching public trips from Firestore')
    const tripsSnapshot = await adminDb
      .collection('trips')
      .where('access_level', '==', 'public')
      .where('user_id', '!=', excludeUserId)
      .limit(limit * 3) // Get more to randomize
      .get()

    logger.debug('Public trips found', { count: tripsSnapshot.docs.length })

    const trips = tripsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Trip[]

    // Shuffle and limit
    const shuffledTrips = trips.sort(() => Math.random() - 0.5)
    const limitedTrips = shuffledTrips.slice(0, limit)

    logger.debug('Returning recommended trips', { count: limitedTrips.length })
    return NextResponse.json({ trips: limitedTrips })
  } catch (error) {
    logger.error('Error fetching recommended trips', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommended trips', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
