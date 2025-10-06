import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations } from '@/lib/firestore-admin-operations'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import type { Trip } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Recommended trips API called')
    
    // Check if Firebase Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      console.warn('⚠️ Firebase Admin SDK not initialized, returning empty recommended trips')
      return NextResponse.json({ trips: [] })
    }

    console.log('✅ Firebase Admin SDK is initialized')

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header')
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    console.log('🔑 ID token extracted, length:', idToken.length)
    
    // Verify the ID token
    console.log('🔍 Verifying ID token...')
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid
    console.log('✅ ID token verified, userId:', userId)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 6
    const excludeUserId = searchParams.get('excludeUserId') || userId

    // Get all public trips that are not created by the current user
    console.log('🔍 Fetching trips from Firestore...')
    const tripsSnapshot = await adminDb
      .collection('trips')
      .where('access_level', '==', 'public')
      .where('user_id', '!=', excludeUserId)
      .limit(limit * 3) // Get more to randomize
      .get()

    console.log('📊 Found', tripsSnapshot.docs.length, 'trips')

    const trips = tripsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Trip[]

    // Shuffle and limit
    const shuffledTrips = trips.sort(() => Math.random() - 0.5)
    const limitedTrips = shuffledTrips.slice(0, limit)

    console.log('✅ Returning', limitedTrips.length, 'recommended trips')
    return NextResponse.json({ trips: limitedTrips })
  } catch (error) {
    console.error('❌ Error fetching recommended trips:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { error: 'Failed to fetch recommended trips', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
