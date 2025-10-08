import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Trip, Day, Itinerary, User } from '@/lib/firestore'
import { generateUniqueSlug } from '@/lib/slug-utils'

import { COLLECTIONS } from '@/lib/firestore'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params

    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      )
    }

    // Tripを取得
    const tripDoc = await adminDb.collection(COLLECTIONS.TRIPS).doc(tripId).get()
    
    if (!tripDoc.exists) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    const tripData = tripDoc.data()
    if (!tripData) {
      return NextResponse.json(
        { error: 'Trip data not found' },
        { status: 404 }
      )
    }

    // Convert Firestore Timestamps to Date objects
    const convertedTripData = {
      ...tripData,
      created_at: tripData.created_at?.toDate ? tripData.created_at.toDate() : tripData.created_at,
      updated_at: tripData.updated_at?.toDate ? tripData.updated_at.toDate() : tripData.updated_at,
      start_date: tripData.start_date?.toDate ? tripData.start_date.toDate() : tripData.start_date,
      end_date: tripData.end_date?.toDate ? tripData.end_date.toDate() : tripData.end_date,
    }

    // Daysを取得
    const daysSnapshot = await adminDb
      .collection(COLLECTIONS.DAYS)
      .where('trip_id', '==', tripId)
      .orderBy('day_number', 'asc')
      .get()

    const days = []
    for (const dayDoc of daysSnapshot.docs) {
      const dayData = dayDoc.data()
      
      // Convert Firestore Timestamps to Date objects for day data
      const convertedDayData = {
        ...dayData,
        created_at: dayData.created_at?.toDate ? dayData.created_at.toDate() : dayData.created_at,
        updated_at: dayData.updated_at?.toDate ? dayData.updated_at.toDate() : dayData.updated_at,
        date: dayData.date?.toDate ? dayData.date.toDate() : dayData.date,
      }
      
      // 各DayのItinerariesを取得
      const itinerariesSnapshot = await adminDb
        .collection(COLLECTIONS.ITINERARIES)
        .where('day_id', '==', dayDoc.id)
        .get()

      const itineraries = itinerariesSnapshot.docs
        .map((itineraryDoc: any) => {
          const itineraryData = itineraryDoc.data()
          return {
            id: itineraryDoc.id,
            ...itineraryData,
            created_at: itineraryData.created_at?.toDate ? itineraryData.created_at.toDate() : itineraryData.created_at,
            updated_at: itineraryData.updated_at?.toDate ? itineraryData.updated_at.toDate() : itineraryData.updated_at,
          } as Itinerary
        })
        .sort((a: Itinerary, b: Itinerary) => (a.sort_number || 0) - (b.sort_number || 0)) // sort_number順でソート

      days.push({
        id: dayDoc.id,
        ...convertedDayData,
        itineraries
      })
    }

    // 作成者情報を取得（google_idで検索）
    let creator = null
    if ((convertedTripData as Trip).user_id) {
      try {
        // google_idでusersコレクションを検索
        const usersSnapshot = await adminDb
          .collection('users')
          .where('google_id', '==', (convertedTripData as Trip).user_id)
          .limit(1)
          .get()
        
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0]
          const userData = userDoc.data()
          creator = {
            id: userDoc.id,
            name: userData?.name || 'Unknown User',
            email: userData?.email || '',
            avatar_url: userData?.avatar_url || null,
            slug: userData?.slug || null
          }
        }
      } catch (error) {
        console.error('Error fetching creator:', error)
      }
    }

    const trip = {
      id: tripDoc.id,
      ...convertedTripData,
      days,
      creator
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error('Error fetching trip:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params
    const body = await request.json()

    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      )
    }

    const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId)
    
    // Tripが存在するかチェック
    const tripDoc = await tripRef.get()
    if (!tripDoc.exists) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    const tripData = tripDoc.data()
    if (!tripData) {
      return NextResponse.json(
        { error: 'Trip data not found' },
        { status: 404 }
      )
    }

    // 日程が変更されたかチェック
    const originalStartDate = tripData.start_date?.toDate ? tripData.start_date.toDate() : tripData.start_date
    const originalEndDate = tripData.end_date?.toDate ? tripData.end_date.toDate() : tripData.end_date
    const newStartDate = body.startDate ? new Date(body.startDate) : undefined
    const newEndDate = body.endDate ? new Date(body.endDate) : undefined
    
    // 日付比較のヘルパー関数
    const compareDates = (date1: Date | undefined, date2: Date | undefined): boolean => {
      if (!date1 && !date2) return true // 両方ともundefined
      if (!date1 || !date2) return false // 片方だけundefined
      
      // 日付のみを比較（時刻は無視）
      const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
      const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
      
      return d1.getTime() === d2.getTime()
    }
    
    // 日程が変更された場合のみ、dayドキュメントを更新
    const datesChanged = !(
      compareDates(originalStartDate, newStartDate) &&
      compareDates(originalEndDate, newEndDate)
    )
    
    if (datesChanged && newStartDate && newEndDate) {
      console.log('日程が変更されました。daysドキュメントを更新します。')
      
      // 既存のdayドキュメントを削除
      const daysSnapshot = await adminDb
        .collection(COLLECTIONS.DAYS)
        .where('trip_id', '==', tripId)
        .get()
      
      for (const dayDoc of daysSnapshot.docs) {
        // 関連するitinerariesを削除
        const itinerariesSnapshot = await adminDb
          .collection(COLLECTIONS.ITINERARIES)
          .where('day_id', '==', dayDoc.id)
          .get()
        
        for (const itineraryDoc of itinerariesSnapshot.docs) {
          await itineraryDoc.ref.delete()
        }
        
        // dayドキュメントを削除
        await dayDoc.ref.delete()
      }
      
      // 新しい日程でdayドキュメントを作成
      const start = new Date(newStartDate)
      const end = new Date(newEndDate)
      
      let currentDate = new Date(start)
      let dayNumber = 1
      
      while (currentDate <= end) {
        const dayRef = adminDb.collection(COLLECTIONS.DAYS).doc()
        
        const dayData = {
          trip_id: tripId,
          day_number: dayNumber,
          date: new Date(currentDate),
          created_at: new Date(),
          updated_at: new Date()
        }
        
        await dayRef.set(dayData)
        
        currentDate.setDate(currentDate.getDate() + 1)
        dayNumber++
      }
    } else {
      console.log('日程に変更はありません。daysドキュメントは更新しません。')
    }

    // タイトルが変更された場合はスラッグを更新
    let slugUpdate = {}
    if (body.title && body.title !== tripData.title) {
      // ユーザーの既存旅行スラッグを取得（現在の旅行を除く）
      const userTripsSnapshot = await adminDb
        .collection(COLLECTIONS.TRIPS)
        .where('user_id', '==', tripData.user_id)
        .get()
      
      const existingSlugs = userTripsSnapshot.docs
        .filter(doc => doc.id !== tripId) // 現在の旅行を除外
        .map(doc => doc.data().slug)
        .filter(Boolean)
      
      // 新しいスラッグを生成
      const newSlug = generateUniqueSlug(body.title, existingSlugs)
      slugUpdate = { slug: newSlug }
    }

    const updateData = {
      ...body,
      ...slugUpdate,
      updated_at: new Date()
    }

    await tripRef.update(updateData)

    const updatedDoc = await tripRef.get()
    const updatedTripData = updatedDoc.data()
    
    if (!updatedTripData) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }
    
    // Convert Firestore Timestamps to Date objects
    const convertedUpdatedTripData = {
      ...updatedTripData,
      created_at: updatedTripData.created_at?.toDate ? updatedTripData.created_at.toDate() : updatedTripData.created_at,
      updated_at: updatedTripData.updated_at?.toDate ? updatedTripData.updated_at.toDate() : updatedTripData.updated_at,
      start_date: updatedTripData.start_date?.toDate ? updatedTripData.start_date.toDate() : updatedTripData.start_date,
      end_date: updatedTripData.end_date?.toDate ? updatedTripData.end_date.toDate() : updatedTripData.end_date,
    }
    
    const updatedTrip = {
      id: updatedDoc.id,
      ...convertedUpdatedTripData
    }

    return NextResponse.json(updatedTrip)
  } catch (error) {
    console.error('Error updating trip:', error)
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params

    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      )
    }

    const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId)
    
    // Tripが存在するかチェック
    const tripDoc = await tripRef.get()
    if (!tripDoc.exists) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // ソフトデリート（deleted_atを設定）
    await tripRef.update({
      deleted_at: new Date(),
      updated_at: new Date()
    })

    return NextResponse.json({ message: 'Trip deleted successfully' })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    )
  }
}
