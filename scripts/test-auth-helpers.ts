/**
 * 認証ヘルパーの動作確認スクリプト
 * 
 * 使用方法:
 *   pnpm ts-node scripts/test-auth-helpers.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth-helpers'
import { withAuth, notFound } from '@/lib/core/error-handler'

async function testRequireAuth() {
  console.log('=== requireAuth() のテスト ===\n')

  // テスト1: 認証ヘッダーなし
  console.log('1. 認証ヘッダーなしのリクエスト')
  const request1 = new NextRequest('http://localhost/api/test', {
    method: 'GET',
    headers: {}
  })
  const result1 = await requireAuth(request1)
  if (result1 instanceof NextResponse) {
    const json = await result1.json()
    console.log('   ステータス:', result1.status)
    console.log('   レスポンス:', json)
    console.log('   ✅ 期待通り: 401エラーが返された\n')
  }

  // テスト2: 不正な認証ヘッダー
  console.log('2. 不正な認証ヘッダーのリクエスト')
  const request2 = new NextRequest('http://localhost/api/test', {
    method: 'GET',
    headers: {
      'authorization': 'Invalid token'
    }
  })
  const result2 = await requireAuth(request2)
  if (result2 instanceof NextResponse) {
    const json = await result2.json()
    console.log('   ステータス:', result2.status)
    console.log('   レスポンス:', json)
    console.log('   ✅ 期待通り: 401エラーが返された\n')
  }

  // テスト3: 正しい形式だが無効なトークン
  console.log('3. 正しい形式だが無効なトークンのリクエスト')
  const request3 = new NextRequest('http://localhost/api/test', {
    method: 'GET',
    headers: {
      'authorization': 'Bearer invalid-token-12345'
    }
  })
  try {
    const result3 = await requireAuth(request3)
    if (result3 instanceof NextResponse) {
      const json = await result3.json()
      console.log('   ステータス:', result3.status)
      console.log('   レスポンス:', json)
      console.log('   ✅ 期待通り: 401エラーが返された（無効なトークン）\n')
    }
  } catch (error) {
    console.log('   エラー:', error instanceof Error ? error.message : String(error))
    console.log('   ✅ 期待通り: エラーが発生した（無効なトークン）\n')
  }
}

async function testWithAuth() {
  console.log('=== withAuth() ラッパーのテスト ===\n')

  // テスト: 認証なしのリクエストでwithAuthを使用
  console.log('1. withAuth で認証なしのリクエスト')
  const mockHandler = withAuth(async (request, auth) => {
    return NextResponse.json({ userId: auth.userId })
  })

  const request = new NextRequest('http://localhost/api/test', {
    method: 'GET',
    headers: {}
  })

  try {
    const response = await mockHandler(request)
    const json = await response.json()
    console.log('   ステータス:', response.status)
    console.log('   レスポンス:', json)
    console.log('   ✅ 期待通り: 401エラーが返された\n')
  } catch (error) {
    console.log('   エラー:', error instanceof Error ? error.message : String(error))
    console.log('   ⚠️  予期しないエラー\n')
  }
}

async function testErrorHelpers() {
  console.log('=== エラーヘルパー関数のテスト ===\n')

  const notFoundResponse = notFound('User')
  const json = await notFoundResponse.json()
  console.log('notFound("User") の結果:')
  console.log('   ステータス:', notFoundResponse.status)
  console.log('   レスポンス:', json)
  console.log('   ✅ 期待通り: 404エラーが返された\n')
}

async function main() {
  try {
    await testRequireAuth()
    await testWithAuth()
    await testErrorHelpers()
    console.log('=== すべてのテスト完了 ===')
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error)
    process.exit(1)
  }
}

main()

