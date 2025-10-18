import { NextRequest, NextResponse } from 'next/server'
import { validateServerEnvironment } from '@/lib/core/env-validation'

// PoC フェーズのため、ストレージ連携は一時的に無効化し 501 を返す
export async function POST(request: NextRequest) {
  validateServerEnvironment()
  return NextResponse.json({ error: 'Image cache API is temporarily disabled for build verification' }, { status: 501 })
}

export async function GET(request: NextRequest) {
  validateServerEnvironment()
  return NextResponse.json({ error: 'Image cache API is temporarily disabled for build verification' }, { status: 501 })
}

export async function DELETE(request: NextRequest) {
  validateServerEnvironment()
  return NextResponse.json({ error: 'Image cache API is temporarily disabled for build verification' }, { status: 501 })
}
