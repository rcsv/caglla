#!/usr/bin/env ts-node

/**
 * ダミートリップデータ作成スクリプト
 * 
 * 2名のユーザーに対して以下のダミーデータを作成（各ユーザー各5件）:
 * - 執筆中のガイド（is_template: true, access_level: 'private'）x 5
 * - 公開中のガイド（is_template: true, access_level: 'public'）x 5
 * - オングーイング（進行中、is_template: false, status: 'ONGOING'）x 5
 * - アップカミング（これから先、is_template: false, status: 'PLANNING'）x 5
 * - プライベート旅行でシェアしていない（is_template: false, access_level: 'private', status: 'COMPLETED'）x 5
 * - プライベート旅行だけどシェアしている（is_template: false, access_level: 'public', status: 'COMPLETED'）x 5
 * 
 * 合計: 各ユーザー30件、2ユーザーで60件
 * 
 * 使用方法:
 *   pnpm create-dummy-trips
 * 
 * 環境変数:
 *   - FIREBASE_PROJECT_ID: Firebase プロジェクトID
 *   - FIREBASE_CLIENT_EMAIL: Firebase Admin SDK のクライアントメール
 *   - FIREBASE_PRIVATE_KEY: Firebase Admin SDK の秘密鍵
 */

// 環境変数を読み込む
import dotenv from 'dotenv'
import { resolve } from 'path'

// .env.local ファイルを優先的に読み込む
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
// .env.local がない場合は .env を読み込む
dotenv.config({ path: resolve(process.cwd(), '.env') })

import { adminUserOperations, adminTripOperations, adminDayOperations } from '@/lib/firebase/admin-operation'
import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import { generateUniqueSlug } from '@/lib/utils/slug'
import logger from '@/lib/core/logger'
import type { Trip, User } from '@/lib/core/types'

// ユーザー情報
const USERS = [
  { id: 'faRoL34yjICfd6v21VMr', name: 'ユーザー A' },
  { id: 'HgzuIGgP4VH6wJqZE6Ib', name: 'ユーザー B' },
]

/**
 * 日付を取得（時分秒を0にリセット）
 */
function getDateOnly(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * 今日の日付を取得
 */
function getToday(): Date {
  return getDateOnly(new Date())
}

/**
 * 日数を加算
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * 旅行を作成
 */
async function createTrip(
  userId: string,
  tripData: {
    title: string
    destination?: string
    description?: string
    startDate?: Date
    endDate?: Date
    accessLevel?: 'private' | 'public'
    isTemplate?: boolean
    status?: 'PLANNING' | 'ONGOING' | 'COMPLETED'
    dayCount?: number
  }
): Promise<Trip> {
  // 既存の旅行スラッグを取得
  const existingTrips = await adminTripOperations.getTripsByUserId(userId)
  const existingSlugs = existingTrips.map(t => t.slug).filter((slug): slug is string => Boolean(slug))

  // スラッグを生成
  const tripSlug = generateUniqueSlug(tripData.title, existingSlugs)

  const cleanTripData: any = {
    user_id: userId,
    title: tripData.title,
    slug: tripSlug,
    access_level: tripData.accessLevel || 'private',
    is_template: tripData.isTemplate || false,
    status: tripData.status || 'PLANNING',
    default_currency: 'JPY',
  }

  if (tripData.description !== undefined) {
    cleanTripData.description = tripData.description
  }
  if (tripData.destination !== undefined) {
    cleanTripData.destination = tripData.destination
  }
  if (tripData.startDate !== undefined) {
    cleanTripData.start_date = tripData.startDate
  }
  if (tripData.endDate !== undefined) {
    cleanTripData.end_date = tripData.endDate
  }
  if (tripData.startDate && tripData.endDate) {
    const dayCount = Math.ceil((tripData.endDate.getTime() - tripData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    cleanTripData.day_count = dayCount
  } else if (tripData.isTemplate && tripData.dayCount) {
    // テンプレートの場合は day_count を直接設定
    cleanTripData.day_count = tripData.dayCount
  }

  const trip = await adminTripOperations.createTrip(cleanTripData)

  // 日付が指定されている場合はDayレコードを作成
  if (tripData.startDate && tripData.endDate) {
    await adminDayOperations.updateDaysForTrip(trip.id, tripData.startDate, tripData.endDate)
  }

  return trip
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.log('🚀 Starting dummy trip creation...')
    logger.info('🚀 Starting dummy trip creation...')

    const today = getToday()
    console.log(`Today: ${today.toISOString()}`)
    const createdTrips: Array<{ userId: string; userName: string; type: string; tripId: string; title: string }> = []

    // 各カテゴリのデータ定義（各5件）
    const categories = [
      {
        name: '執筆中のガイド',
        type: 'draft_guide',
        count: 5,
        data: [
          { title: '執筆中：鎌倉・江ノ島1日観光', destination: '神奈川県鎌倉市', days: 1 },
          { title: '執筆中：伊豆・熱海温泉旅2日間', destination: '静岡県熱海市', days: 2 },
          { title: '執筆中：高知・四万十川3日間', destination: '高知県高知市', days: 3 },
          { title: '執筆中：熊本・阿蘇2日間', destination: '熊本県熊本市', days: 2 },
          { title: '執筆中：鹿児島・桜島1泊2日', destination: '鹿児島県鹿児島市', days: 2 },
        ],
        createFn: async (user: typeof USERS[0], tripData: any, index: number, total: number) => {
          return await createTrip(user.id, {
            title: tripData.title,
            destination: tripData.destination,
            description: `[スタブ ${index + 1}/${total}] ${tripData.destination}への${tripData.days}日間のプラン（執筆中）`,
            dayCount: tripData.days,
            accessLevel: 'private',
            isTemplate: true,
            status: 'PLANNING',
          })
        },
      },
      {
        name: '公開中のガイド',
        type: 'published_guide',
        count: 5,
        data: [
          { title: '東京3日間観光プラン', destination: '東京都', days: 3 },
          { title: '京都・奈良2泊3日', destination: '京都府', days: 3 },
          { title: '沖縄リゾート5日間', destination: '沖縄県那覇市', days: 5 },
          { title: '北海道冬の旅4日間', destination: '北海道札幌市', days: 4 },
          { title: '大阪・神戸グルメ旅2日間', destination: '大阪府', days: 2 },
        ],
        createFn: async (user: typeof USERS[0], tripData: any, index: number, total: number) => {
          return await createTrip(user.id, {
            title: tripData.title,
            destination: tripData.destination,
            description: `[スタブ ${index + 1}/${total}] ${tripData.destination}への${tripData.days}日間のプラン（公開中）`,
            dayCount: tripData.days,
            accessLevel: 'public',
            isTemplate: true,
            status: 'PLANNING',
          })
        },
      },
      {
        name: 'オングーイング',
        type: 'ongoing',
        count: 5,
        data: [
          { title: '現在の東京観光', destination: '東京都', days: 3, startOffset: -1 },
          { title: '現在の大阪旅行', destination: '大阪府', days: 4, startOffset: -2 },
          { title: '現在の沖縄旅行', destination: '沖縄県那覇市', days: 5, startOffset: -3 },
          { title: '現在の京都観光', destination: '京都府', days: 3, startOffset: 0 },
          { title: '現在の北海道旅行', destination: '北海道札幌市', days: 7, startOffset: -4 },
        ],
        createFn: async (user: typeof USERS[0], tripData: any, index: number, total: number) => {
          const startDate = addDays(today, tripData.startOffset)
          const endDate = addDays(startDate, tripData.days - 1)
          return await createTrip(user.id, {
            title: tripData.title,
            destination: tripData.destination,
            description: `[スタブ ${index + 1}/${total}] ${tripData.destination}への${tripData.days}日間の旅行（進行中）`,
            startDate,
            endDate,
            accessLevel: 'private',
            isTemplate: false,
            status: 'ONGOING',
          })
        },
      },
      {
        name: 'アップカミング',
        type: 'upcoming',
        count: 5,
        data: [
          { title: '来月の沖縄旅行', destination: '沖縄県那覇市', days: 5, offset: 30 },
          { title: '夏の北海道旅行', destination: '北海道札幌市', days: 7, offset: 60 },
          { title: '秋の京都観光', destination: '京都府', days: 4, offset: 90 },
          { title: '冬の東京観光', destination: '東京都', days: 3, offset: 120 },
          { title: '春の大阪旅行', destination: '大阪府', days: 4, offset: 150 },
        ],
        createFn: async (user: typeof USERS[0], tripData: any, index: number, total: number) => {
          const startDate = addDays(today, tripData.offset)
          const endDate = addDays(startDate, tripData.days - 1)
          return await createTrip(user.id, {
            title: tripData.title,
            destination: tripData.destination,
            description: `[スタブ ${index + 1}/${total}] ${tripData.destination}への${tripData.days}日間の旅行（予定）`,
            startDate,
            endDate,
            accessLevel: 'private',
            isTemplate: false,
            status: 'PLANNING',
          })
        },
      },
      {
        name: 'プライベート旅行でシェアしていない',
        type: 'private_not_shared',
        count: 5,
        data: [
          { title: '2024年3月の沖縄旅行', destination: '沖縄県那覇市', days: 5, offset: -240 },
          { title: '2024年4月の京都観光', destination: '京都府', days: 3, offset: -210 },
          { title: '2024年5月の北海道旅行', destination: '北海道札幌市', days: 7, offset: -180 },
          { title: '2024年6月の東京観光', destination: '東京都', days: 4, offset: -150 },
          { title: '2024年7月の大阪旅行', destination: '大阪府', days: 3, offset: -120 },
        ],
        createFn: async (user: typeof USERS[0], tripData: any, index: number, total: number) => {
          const startDate = addDays(today, tripData.offset)
          const endDate = addDays(startDate, tripData.days - 1)
          return await createTrip(user.id, {
            title: tripData.title,
            destination: tripData.destination,
            description: `[スタブ ${index + 1}/${total}] ${tripData.destination}への${tripData.days}日間の旅行（プライベート・非共有）`,
            startDate,
            endDate,
            accessLevel: 'private',
            isTemplate: false,
            status: 'COMPLETED',
          })
        },
      },
      {
        name: 'プライベート旅行だけどシェアしている',
        type: 'private_shared',
        count: 5,
        data: [
          { title: '2023年12月の沖縄リゾート', destination: '沖縄県那覇市', days: 5, offset: -330 },
          { title: '2024年1月の京都・奈良観光', destination: '京都府', days: 4, offset: -300 },
          { title: '2024年2月の北海道スキー旅行', destination: '北海道札幌市', days: 6, offset: -270 },
          { title: '2024年3月の東京ディズニー', destination: '千葉県浦安市', days: 3, offset: -240 },
          { title: '2024年4月の大阪・神戸グルメ旅', destination: '大阪府', days: 4, offset: -210 },
        ],
        createFn: async (user: typeof USERS[0], tripData: any, index: number, total: number) => {
          const startDate = addDays(today, tripData.offset)
          const endDate = addDays(startDate, tripData.days - 1)
          return await createTrip(user.id, {
            title: tripData.title,
            destination: tripData.destination,
            description: `[スタブ ${index + 1}/${total}] ${tripData.destination}への${tripData.days}日間の旅行（プライベート・共有中）`,
            startDate,
            endDate,
            accessLevel: 'public',
            isTemplate: false,
            status: 'COMPLETED',
          })
        },
      },
    ]

    for (const user of USERS) {
      console.log(`📝 Creating trips for user: ${user.name} (${user.id})`)
      logger.info(`📝 Creating trips for user: ${user.name} (${user.id})`)

      // ユーザーが存在するか確認（users ドキュメントIDで直接取得）
      const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.id).get()
      if (!userDoc.exists) {
        console.log(`⚠️  User not found: ${user.id}, skipping...`)
        logger.warn(`⚠️  User not found: ${user.id}, skipping...`)
        continue
      }
      const userData = { id: userDoc.id, ...userDoc.data() } as User
      console.log(`  ✅ User found: ${userData.name} (${userData.slug})`)
      logger.info(`  ✅ User found: ${userData.name} (${userData.slug})`)

      // 各カテゴリのデータを作成
      for (const category of categories) {
        console.log(`  Creating ${category.name}...`)
        logger.info(`  Creating ${category.name}...`)

        for (let i = 0; i < category.data.length; i++) {
          const tripData = category.data[i]
          const trip = await category.createFn(user, tripData, i, category.count)
          createdTrips.push({ 
            userId: user.id, 
            userName: user.name, 
            type: category.type, 
            tripId: trip.id, 
            title: trip.title 
          })
          console.log(`    ✅ Created ${category.name}: ${trip.title}`)
          logger.info(`    ✅ Created ${category.name}: ${trip.title}`)
        }
      }
    }

    console.log('🎉 Dummy trip creation completed!')
    logger.info('🎉 Dummy trip creation completed!')
    console.log('Summary:', {
      totalTrips: createdTrips.length,
      byType: {
        draft_guide: createdTrips.filter(t => t.type === 'draft_guide').length,
        published_guide: createdTrips.filter(t => t.type === 'published_guide').length,
        ongoing: createdTrips.filter(t => t.type === 'ongoing').length,
        upcoming: createdTrips.filter(t => t.type === 'upcoming').length,
        private_not_shared: createdTrips.filter(t => t.type === 'private_not_shared').length,
        private_shared: createdTrips.filter(t => t.type === 'private_shared').length,
      },
      byUser: USERS.map(u => ({
        userId: u.id,
        userName: u.name,
        count: createdTrips.filter(t => t.userId === u.id).length,
      })),
      trips: createdTrips,
    })
    logger.info('Summary:', {
      totalTrips: createdTrips.length,
      byType: {
        draft_guide: createdTrips.filter(t => t.type === 'draft_guide').length,
        published_guide: createdTrips.filter(t => t.type === 'published_guide').length,
        ongoing: createdTrips.filter(t => t.type === 'ongoing').length,
        upcoming: createdTrips.filter(t => t.type === 'upcoming').length,
        private_not_shared: createdTrips.filter(t => t.type === 'private_not_shared').length,
        private_shared: createdTrips.filter(t => t.type === 'private_shared').length,
      },
      byUser: USERS.map(u => ({
        userId: u.id,
        userName: u.name,
        count: createdTrips.filter(t => t.userId === u.id).length,
      })),
      trips: createdTrips,
    })

  } catch (error) {
    console.error('❌ Error creating dummy trips:', error)
    logger.error('❌ Error creating dummy trips:', error)
    throw error
  }
}

// スクリプト実行
main()
  .then(() => {
    console.log('✅ Script completed successfully')
    logger.info('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    logger.error('❌ Script failed:', error)
    process.exit(1)
  })
