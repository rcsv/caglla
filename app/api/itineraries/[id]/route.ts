import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // reorderリクエストかどうかを判定
    if (body.day_id !== undefined && body.sort_number !== undefined) {
      // reorderリクエスト
      const { day_id, sort_number } = body
      
      const itineraryRef = adminDb.collection('itineraries').doc(id)
      
      const updateData = {
        day_id,
        sort_number,
        updated_at: new Date()
      }
      
      await itineraryRef.update(updateData)
      
      const updatedDoc = await itineraryRef.get()
      if (!updatedDoc.exists) {
        return NextResponse.json(
          { error: 'Itinerary not found' },
          { status: 404 }
        )
      }
      
      const updatedItinerary = {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }

      return NextResponse.json(updatedItinerary)
    } else {
      // 通常の更新リクエスト
      const { title, description, start_time, end_time, timezone, cost_amount, cost_currency } = body
      
      const itineraryRef = adminDb.collection('itineraries').doc(id)
      
      const updateData: any = {
        updated_at: new Date()
      }
      
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (start_time !== undefined) updateData.start_time = start_time
      if (end_time !== undefined) updateData.end_time = end_time
      if (timezone !== undefined) updateData.timezone = timezone
      if (cost_amount !== undefined) updateData.cost_amount = cost_amount
      if (cost_currency !== undefined) updateData.cost_currency = cost_currency
      
      await itineraryRef.update(updateData)
      
      const updatedDoc = await itineraryRef.get()
      if (!updatedDoc.exists) {
        return NextResponse.json(
          { error: 'Itinerary not found' },
          { status: 404 }
        )
      }
      
      const updatedItinerary = {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }

      return NextResponse.json(updatedItinerary)
    }
  } catch (error) {
    console.error('Error updating itinerary:', error)
    return NextResponse.json(
      { error: 'Failed to update itinerary' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const itineraryRef = adminDb.collection('itineraries').doc(id)
    
    // ハードデリート（実際にドキュメントを削除）
    await itineraryRef.delete()

    console.log(`Deleted itinerary: ${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting itinerary:', error)
    return NextResponse.json(
      { error: 'Failed to delete itinerary' },
      { status: 500 }
    )
  }
}
