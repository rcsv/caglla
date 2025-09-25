import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pool = getPool()
    const tripId = params.id

    const [rows] = await pool.execute(
      `SELECT id, trip_id, day_number, date, description, created_at, updated_at
       FROM days 
       WHERE trip_id = ? 
       ORDER BY day_number`,
      [tripId]
    )

    return NextResponse.json({ days: rows })
  } catch (error) {
    console.error('Error fetching days:', error)
    return NextResponse.json(
      { error: 'Failed to fetch days' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pool = getPool()
    const tripId = params.id
    const body = await request.json()
    
    const { dayNumber, date, description } = body

    if (!dayNumber || !date) {
      return NextResponse.json(
        { error: 'Day number and date are required' },
        { status: 400 }
      )
    }

    const dayId = `${tripId}_day_${dayNumber}`
    const now = new Date()

    await pool.execute(
      `INSERT INTO days (id, trip_id, day_number, date, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [dayId, tripId, dayNumber, date, description, now, now]
    )

    return NextResponse.json({
      id: dayId,
      trip_id: tripId,
      day_number: dayNumber,
      date,
      description,
      created_at: now,
      updated_at: now
    })
  } catch (error) {
    console.error('Error creating day:', error)
    return NextResponse.json(
      { error: 'Failed to create day' },
      { status: 500 }
    )
  }
}
