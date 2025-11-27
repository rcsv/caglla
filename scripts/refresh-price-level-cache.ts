#!/usr/bin/env ts-node
/**
 * 既存のplaces_cacheのprice_levelを再取得して更新するスクリプト
 * 
 * 実行方法:
 *   pnpm exec ts-node scripts/refresh-price-level-cache.ts --dry-run
 *   pnpm exec ts-node scripts/refresh-price-level-cache.ts --limit 10
 * 
 * オプション:
 *   --dry-run: 実際には更新せずにログのみ出力
 *   --limit <number>: 更新する最大件数（デフォルト: すべて）
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'

const isDryRun = process.argv.includes('--dry-run')
const limitArg = process.argv.find(arg => arg.startsWith('--limit'))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined

async function refreshPriceLevelCache(): Promise<void> {
  logger.info('🔄 Refreshing price_level in places_cache...')
  logger.info(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '✏️  UPDATE'}`)
  if (limit) {
    logger.info(`Limit: ${limit} documents`)
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GOOGLE_PLACES_API_KEY is not set')
  }

  let stats = {
    total: 0,
    updated: 0,
    alreadyHasPriceLevel: 0,
    apiError: 0,
    stillNoPriceLevel: 0
  }

  try {
    // places_cacheコレクションの全ドキュメントを取得
    let query: any = adminDb.collection('places_cache')
    if (limit) {
      query = query.limit(limit)
    }
    const snapshot = await query.get()
    
    stats.total = snapshot.size
    logger.info(`📊 Total documents to process: ${stats.total}`)

    // 各ドキュメントを処理
    for (const doc of snapshot.docs) {
      const data = doc.data()
      const placeId = data.place_id || doc.id.split('_')[0]
      const language = data.language || 'ja'
      
      // 既にprice_levelがある場合はスキップ
      if (data.price_level !== undefined && data.price_level !== null) {
        stats.alreadyHasPriceLevel++
        logger.debug(`✅ Skipping ${data.name} - already has price_level: ${data.price_level}`)
        continue
      }

      logger.info(`🔍 Processing: ${data.name} (${placeId})`)

      if (isDryRun) {
        logger.info(`   [DRY RUN] Would fetch price_level from API`)
        continue
      }

      try {
        // Google Places API v1からpriceLevelを取得
        const response = await fetch(
          `https://places.googleapis.com/v1/places/${placeId}?languageCode=${language}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'id,priceLevel',
              'Accept-Language': language
            }
          }
        )

        if (!response.ok) {
          logger.warn(`   ⚠️  API Error: ${response.status}`)
          stats.apiError++
          continue
        }

        const apiData = await response.json()
        
        if (apiData.priceLevel) {
          // priceLevelを数値に変換
          const priceLevels = ['PRICE_LEVEL_FREE', 'PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_MODERATE', 'PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE']
          const priceLevel = priceLevels.indexOf(apiData.priceLevel)
          
          if (priceLevel >= 0) {
            // Firestoreに保存
            await doc.ref.update({
              price_level: priceLevel,
              last_accessed: new Date()
            })
            
            logger.info(`   ✅ Updated price_level: ${priceLevel} (${'$'.repeat(priceLevel + 1)})`)
            stats.updated++
          }
        } else {
          logger.info(`   ℹ️  No price_level in API response (observation/landmark)`)
          stats.stillNoPriceLevel++
          
          // missing_data_flagsを設定
          await doc.ref.update({
            'missing_data_flags.price_level': true,
            last_accessed: new Date()
          })
        }

        // Rate limiting（10 requests/second）
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        logger.error(`   ❌ Error processing ${data.name}:`, error)
        stats.apiError++
      }
    }

    // 結果を表示
    console.log('\n' + '='.repeat(80))
    console.log('📊 Refresh Results')
    console.log('='.repeat(80))
    console.log(`Total documents processed:     ${stats.total}`)
    console.log(`Already had price_level:       ${stats.alreadyHasPriceLevel}`)
    console.log(`Successfully updated:          ${stats.updated}`)
    console.log(`Still no price_level:          ${stats.stillNoPriceLevel} (observation/landmark)`)
    console.log(`API errors:                    ${stats.apiError}`)
    console.log('='.repeat(80) + '\n')

  } catch (error) {
    logger.error('❌ Error refreshing price_level cache:', error)
    throw error
  }
}

// スクリプト実行
refreshPriceLevelCache()
  .then(() => {
    logger.info('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('❌ Script failed:', error)
    process.exit(1)
  })

