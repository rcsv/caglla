import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations } from '@/lib/firestore-admin-operations'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import type { Trip } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 6
    const excludeUserId = searchParams.get('excludeUserId') || userId

    // Get all public trips that are not created by the current user
    const tripsSnapshot = await adminDb
      .collection('trips')
      .where('access_level', '==', 'public')
      .where('user_id', '!=', excludeUserId)
      .limit(limit * 3) // Get more to randomize
      .get()

    const trips = tripsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Trip[]

    // Shuffle and limit
    const shuffledTrips = trips.sort(() => Math.random() - 0.5)
    const limitedTrips = shuffledTrips.slice(0, limit)

    return NextResponse.json({ trips: limitedTrips })
  } catch (error) {
    console.error('Error fetching recommended trips:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommended trips' },
      { status: 500 }
    )
  }
}
