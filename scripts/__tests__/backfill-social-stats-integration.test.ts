/**
 * バックフィルスクリプトの統合テスト
 * 
 * Phase 1-2: Firestoreスキーマ拡張とセキュリティルール（テストファースト）
 * 
 * 注意: これらのテストはFirestoreエミュレータを起動している必要があります。
 * エミュレータ起動: firebase emulators:start --only firestore
 * 
 * 使用方法:
 *   1. エミュレータを起動: pnpm emulators:start:firestore
 *   2. 別のターミナルでテスト実行: pnpm test:firestore
 */

import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import { createMockTrip, createMockPublicTrip } from '@/lib/__tests__/helpers/test-data'
import { backfillSocialStats } from '../backfill-social-stats'
import type { Trip } from '@/lib/core/types'
import type { Firestore } from 'firebase-admin/firestore'
import { COLLECTIONS } from '@/lib/firebase/firestore'

describe('backfillSocialStats integration', () => {
  let db: Firestore

  beforeAll(async () => {
    db = getTestFirestore() // エミュレータに接続
  })

  beforeEach(async () => {
    // テストデータをクリア
    const tripsSnapshot = await db.collection(COLLECTIONS.TRIPS).get()
    const batch = db.batch()
    tripsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    await batch.commit()
  })

  it('should add social_stats to trips without social_stats', async () => {
    // 1. social_statsがないTripを作成
    const tripWithoutStats = createMockTrip({
      id: 'trip-without-stats',
      user_id: 'user1',
      access_level: 'public',
    })

    // social_statsを削除
    const { social_stats, ...tripData } = tripWithoutStats
    await db.collection(COLLECTIONS.TRIPS).doc(tripWithoutStats.id).set(tripData)

    // 2. バックフィルスクリプトを実行（エミュレータに対して）
    const updatedCount = await backfillSocialStats(db, 500, false)

    // 3. social_statsが追加されたことを確認
    const updatedTrip = await db.collection(COLLECTIONS.TRIPS).doc(tripWithoutStats.id).get()
    const updatedData = updatedTrip.data() as Trip

    expect(updatedCount).toBe(1)
    expect(updatedData.social_stats).toBeDefined()
    expect(updatedData.social_stats?.likes_count).toBe(0)
    expect(updatedData.social_stats?.comments_count).toBe(0)
    expect(updatedData.social_stats?.shares_count).toBe(0)
    expect(updatedData.social_stats?.views_count).toBe(0)
    expect(updatedData.social_stats?.replicas_count).toBe(0)
  })

  it('should not modify trips with existing social_stats', async () => {
    // 1. social_statsがあるTripを作成
    const tripWithStats = createMockPublicTrip({
      id: 'trip-with-stats',
      user_id: 'user1',
      social_stats: {
        likes_count: 5,
        comments_count: 3,
        shares_count: 2,
        views_count: 100,
        replicas_count: 1,
      },
    })

    await db.collection(COLLECTIONS.TRIPS).doc(tripWithStats.id).set(tripWithStats)

    // 2. バックフィルスクリプトを実行
    const updatedCount = await backfillSocialStats(db, 500, false)

    // 3. social_statsが変更されていないことを確認
    const updatedTrip = await db.collection(COLLECTIONS.TRIPS).doc(tripWithStats.id).get()
    const updatedData = updatedTrip.data() as Trip

    expect(updatedCount).toBe(0) // 変更されていないため、更新数は0
    expect(updatedData.social_stats).toBeDefined()
    expect(updatedData.social_stats?.likes_count).toBe(5)
    expect(updatedData.social_stats?.comments_count).toBe(3)
    expect(updatedData.social_stats?.shares_count).toBe(2)
    expect(updatedData.social_stats?.views_count).toBe(100)
    expect(updatedData.social_stats?.replicas_count).toBe(1)
  })

  it('should handle partial social_stats (only some fields missing)', async () => {
    // 1. 部分的にsocial_statsがあるTripを作成
    const tripWithPartialStats = createMockTrip({
      id: 'trip-partial-stats',
      user_id: 'user1',
      access_level: 'public',
    })

    // 部分的にsocial_statsを設定
    const { social_stats, ...tripData } = tripWithPartialStats
    await db.collection(COLLECTIONS.TRIPS).doc(tripWithPartialStats.id).set({
      ...tripData,
      social_stats: {
        likes_count: 3,
        // comments_count, shares_count, views_count, replicas_count が欠けている
      },
    })

    // 2. バックフィルスクリプトを実行
    const updatedCount = await backfillSocialStats(db, 500, false)

    // 3. 欠けているフィールドが追加されたことを確認
    const updatedTrip = await db.collection(COLLECTIONS.TRIPS).doc(tripWithPartialStats.id).get()
    const updatedData = updatedTrip.data() as Trip

    expect(updatedCount).toBe(1)
    expect(updatedData.social_stats).toBeDefined()
    expect(updatedData.social_stats?.likes_count).toBe(3) // 既存の値は保持
    expect(updatedData.social_stats?.comments_count).toBe(0) // 追加
    expect(updatedData.social_stats?.shares_count).toBe(0) // 追加
    expect(updatedData.social_stats?.views_count).toBe(0) // 追加
    expect(updatedData.social_stats?.replicas_count).toBe(0) // 追加
  })

  it('should process multiple trips in batch', async () => {
    // 1. 複数のTripを作成（一部はsocial_statsあり、一部はなし）
    const trips = [
      createMockTrip({ id: 'trip1', user_id: 'user1' }), // social_statsなし
      createMockTrip({ id: 'trip2', user_id: 'user1' }), // social_statsなし
    ]
    
    // trip3は完全なsocial_statsを持つ
    const trip3WithStats = createMockPublicTrip({
      id: 'trip3',
      user_id: 'user1',
      social_stats: { likes_count: 1, comments_count: 0, shares_count: 0, views_count: 0, replicas_count: 0 },
    })

    // trip1とtrip2はsocial_statsを削除して保存
    const batch = db.batch()
    trips.forEach((trip) => {
      const { social_stats, ...tripData } = trip
      batch.set(db.collection(COLLECTIONS.TRIPS).doc(trip.id), tripData)
    })
    // trip3は完全なsocial_statsを持つので、そのまま保存
    batch.set(db.collection(COLLECTIONS.TRIPS).doc(trip3WithStats.id), trip3WithStats)
    await batch.commit()

    // 2. バックフィルスクリプトを実行
    const updatedCount = await backfillSocialStats(db, 500, false)

    // 3. すべてのTripが正しく更新されたことを確認
    expect(updatedCount).toBe(2) // trip1とtrip2が更新される（trip3は完全なので更新されない）

    const snapshots = await db.collection(COLLECTIONS.TRIPS).get()
    const updatedTrips = snapshots.docs.map((doc) => doc.data() as Trip)

    expect(updatedTrips).toHaveLength(3)
    updatedTrips.forEach((trip) => {
      expect(trip.social_stats).toBeDefined()
      expect(trip.social_stats?.likes_count).toBeDefined()
      expect(trip.social_stats?.comments_count).toBeDefined()
      expect(trip.social_stats?.shares_count).toBeDefined()
      expect(trip.social_stats?.views_count).toBeDefined()
      expect(trip.social_stats?.replicas_count).toBeDefined()
    })

    // trip3のsocial_statsが変更されていないことを確認
    const trip3 = updatedTrips.find((t) => t.id === 'trip3')
    expect(trip3?.social_stats?.likes_count).toBe(1)
  })

  it('should work with dry run mode', async () => {
    // 1. social_statsがないTripを作成
    const tripWithoutStats = createMockTrip({
      id: 'trip-dry-run',
      user_id: 'user1',
      access_level: 'public',
    })

    const { social_stats, ...tripData } = tripWithoutStats
    await db.collection(COLLECTIONS.TRIPS).doc(tripWithoutStats.id).set(tripData)

    // 2. バックフィルスクリプトをドライランモードで実行
    const updatedCount = await backfillSocialStats(db, 500, true) // dryRun = true

    // 3. ドライランモードでは更新されないことを確認
    expect(updatedCount).toBe(1) // 更新対象は1つ

    const trip = await db.collection(COLLECTIONS.TRIPS).doc(tripWithoutStats.id).get()
    const tripData_after = trip.data() as Trip

    expect(tripData_after.social_stats).toBeUndefined() // 更新されていない
  })
})

