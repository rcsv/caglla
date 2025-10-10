import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'

export async function POST(request: NextRequest) {
  try {
    const { dayId, itineraryIds } = await request.json()
    
    logger.debug('Reorder API called', { dayId, itineraryCount: itineraryIds?.length })
    
    if (!dayId || !itineraryIds || !Array.isArray(itineraryIds)) {
      return NextResponse.json(
        { error: 'Day ID and itinerary IDs array are required' },
        { status: 400 }
      )
    }

    // Firebase Admin SDKが利用できない場合は、クライアントサイドの更新のみ実行
    if (!adminDb) {
      logger.warn('Firebase Admin SDK not available, skipping server-side update')
      return NextResponse.json({ 
        success: true, 
        message: 'Client-side reordering completed (server update skipped)',
        reorderedCount: itineraryIds.length
      })
    }

    logger.debug('Using Firebase Admin SDK for reordering')

    // 各itineraryのsort_numberを更新
    const batch = adminDb.batch()
    
    itineraryIds.forEach((itineraryId: string, index: number) => {
      const itineraryRef = adminDb.collection('itineraries').doc(itineraryId)
      batch.update(itineraryRef, { 
        sort_number: index + 1,
        updated_at: new Date()
      })
    })

    await batch.commit()

    logger.info('Itineraries reordered successfully', { 
      reorderedCount: itineraryIds.length 
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Itineraries reordered successfully',
      reorderedCount: itineraryIds.length
    })
  } catch (error) {
    logger.error('Error reordering itineraries', error)
    return NextResponse.json(
      { error: `Failed to reorder itineraries: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}