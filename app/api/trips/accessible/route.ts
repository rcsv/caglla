import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations, adminTripUserOperations, adminUserOperations } from '@/lib/firebase/admin-operation'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import type { Trip, User } from '@/lib/core/types'
import logger from '@/lib/core/logger'

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      logger.warn('Firebase Admin SDK not initialized, returning empty trips')
      return NextResponse.json({ trips: [] })
    }

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
    const includeShared = searchParams.get('includeShared') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    let trips: Trip[] = []

    if (includeShared) {
      // Get trips where user is owner
      const ownedTrips = await adminTripOperations.getTripsByUserId(userId)
      
      // Get trips where user has access through trip_users
      const sharedTripUsers = await adminTripUserOperations.getTripsByUserId(userId)
      const sharedTripIds = sharedTripUsers.map(tu => tu.trip_id)
      
      // Get shared trips
      const sharedTrips = await Promise.all(
        sharedTripIds.map(async (tripId) => {
          try {
            return await adminTripOperations.getTripById(tripId)
          } catch (error) {
            logger.error('Error fetching shared trip', error, { tripId })
            return null
          }
        })
      )
      
      // Filter out null values and combine
      const validSharedTrips = sharedTrips.filter((trip): trip is Trip => trip !== null)
      trips = [...ownedTrips, ...validSharedTrips]
      
      // Remove duplicates (in case user is both owner and shared)
      const uniqueTrips = trips.filter((trip, index, self) => 
        index === self.findIndex(t => t.id === trip.id)
      )
      trips = uniqueTrips
    } else {
      // Only get owned trips
      trips = await adminTripOperations.getTripsByUserId(userId)
    }

    // Apply limit if specified
    if (limit && limit > 0) {
      trips = trips.slice(0, limit)
    }

    // Add creator information to trips
    const tripsWithCreator = await Promise.all(
      trips.map(async (trip) => {
        try {
          const creator = await adminUserOperations.getUserByGoogleId(trip.user_id)
          return {
            ...trip,
            creator
          }
        } catch (error) {
          logger.error('Error fetching creator for trip', error, { tripId: trip.id })
          return trip
        }
      })
    )

    return NextResponse.json({ trips: tripsWithCreator })
  } catch (error) {
    logger.error('Error fetching trips', error)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}
