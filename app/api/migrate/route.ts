import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const pool = getPool()
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations/20241201_create_nextjs_schema.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.execute(statement.trim())
      }
    }
    
    return NextResponse.json({ success: true, message: 'Migration completed successfully' })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { success: false, error: 'Migration failed' },
      { status: 500 }
    )
  }
}
