import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { PlaceData } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore'

/**
 * 指定位置にスケジュールを挿入し、後続のスケジュールを再番号付けする
 */
export async function POST(request: NextRequest) {
  try {
    const { day_id, place_data, title, description, location, insert_after_index } = await request.json()
    
    if (!day_id || !place_data || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: day_id, place_data, title' },
        { status: 400 }
      )
    }

    const insertAfterIndex = insert_after_index !== undefined ? parseInt(insert_after_index) : -1

    // 同じday_idの既存のitinerariesを取得してsort_number順に並べる
    const itinerariesRef = adminDb.collection(COLLECTIONS.ITINERARIES)
    const existingItinerariesSnapshot = await itinerariesRef
      .where('day_id', '==', day_id)
      .orderBy('sort_number', 'asc')
      .get()
    
    const existingItineraries = existingItinerariesSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    // 挿入位置に基づいて新しいsort_numberを計算
    let newSortNumber: number
    
    console.log(`Insert API: insertAfterIndex=${insertAfterIndex}, existingItineraries.length=${existingItineraries.length}`)
    console.log(`Existing itineraries sort_numbers:`, existingItineraries.map(i => ({ id: i.id, title: i.title, sort_number: i.sort_number })))
    
    if (insertAfterIndex < 0 || insertAfterIndex >= existingItineraries.length) {
      // 最後に追加する場合
      newSortNumber = existingItineraries.length > 0 
        ? Math.max(...existingItineraries.map((i: any) => i.sort_number || 0)) + 1 
        : 1
    } else {
      // 指定位置に挿入する場合
      // insertAfterIndexは表示番号（1ベース）なので、配列インデックス（0ベース）に変換
      const targetIndex = insertAfterIndex - 1
      let itinerariesToUpdate: any[] = []
      
      if (targetIndex >= 0 && targetIndex < existingItineraries.length) {
        // 手前のItineraryのsort_number + 1を使用
        const previousItinerary = existingItineraries[targetIndex]
        newSortNumber = (previousItinerary.sort_number || 0) + 1
        
        console.log(`Insert after index ${insertAfterIndex}: previousItinerary sort_number=${previousItinerary.sort_number}, newSortNumber=${newSortNumber}`)
        
        // 後続のitinerariesのsort_numberを1つずつ増やす
        itinerariesToUpdate = existingItineraries.filter((i: any) => (i.sort_number || 0) >= newSortNumber)
      } else {
        // 範囲外の場合は最後に追加
        newSortNumber = existingItineraries.length > 0 
          ? Math.max(...existingItineraries.map((i: any) => i.sort_number || 0)) + 1 
          : 1
        itinerariesToUpdate = []
      }
      
      // バッチ処理で後続のitinerariesを更新
      const batch = adminDb.batch()
      
      for (const itinerary of itinerariesToUpdate) {
        const docRef = itinerariesRef.doc(itinerary.id)
        batch.update(docRef, { 
          sort_number: (itinerary as any).sort_number + 1,
          updated_at: new Date()
        })
      }
      
      // バッチ更新を実行
      if (itinerariesToUpdate.length > 0) {
        await batch.commit()
        console.log(`Updated ${itinerariesToUpdate.length} itineraries after insertion`)
      }
    }

    // 新しいitineraryを作成
    const itineraryData = {
      day_id,
      sort_number: newSortNumber,
      title,
      description: description || '',
      location: location || '',
      place_data: place_data as PlaceData,
      created_at: new Date(),
      updated_at: new Date()
    }

    // Firestoreに保存
    const docRef = await itinerariesRef.add(itineraryData)
    
    // 保存されたデータを返す
    const savedItinerary = {
      id: docRef.id,
      ...itineraryData
    }

    console.log(`Inserted itinerary at position ${newSortNumber} in day ${day_id}`)
    console.log(`Inserted itinerary details:`, { id: savedItinerary.id, title: savedItinerary.title, sort_number: savedItinerary.sort_number })

    return NextResponse.json(savedItinerary)
  } catch (error) {
    console.error('Error inserting itinerary:', error)
    return NextResponse.json(
      { error: 'Failed to insert itinerary' },
      { status: 500 }
    )
  }
}
