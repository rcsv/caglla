#!/usr/bin/env ts-node
/**
 * Places Cacheのprice_level取得状況を分析するスクリプト
 * 
 * 実行方法:
 *   pnpm exec ts-node scripts/analyze-price-level-cache.ts
 *   または
 *   pnpm analyze:price-level (package.jsonにスクリプト追加後)
 */

import dotenv from 'dotenv'
// Next.js と同じくプロジェクトルートの `.env.local` を優先して読み込む
dotenv.config({ path: '.env.local' })

import { adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'

interface PriceLevelStats {
  totalDocuments: number
  withPriceLevel: number
  withoutPriceLevel: number
  priceLevelDistribution: {
    0: number // Free
    1: number // Inexpensive
    2: number // Moderate
    3: number // Expensive
    4: number // Very Expensive
  }
  missingDataFlagsCount: number
  persistentlyMissingPriceLevel: number
  samplePlacesWithPriceLevel: Array<{
    place_id: string
    name: string
    price_level: number
    language: string
  }>
  samplePlacesWithoutPriceLevel: Array<{
    place_id: string
    name: string
    language: string
    has_missing_flag: boolean
  }>
}

async function analyzePriceLevelCache(): Promise<void> {
  logger.info('🔍 Analyzing price_level in places_cache...')
  
  const stats: PriceLevelStats = {
    totalDocuments: 0,
    withPriceLevel: 0,
    withoutPriceLevel: 0,
    priceLevelDistribution: {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0
    },
    missingDataFlagsCount: 0,
    persistentlyMissingPriceLevel: 0,
    samplePlacesWithPriceLevel: [],
    samplePlacesWithoutPriceLevel: []
  }

  try {
    // places_cacheコレクションの全ドキュメントを取得
    const snapshot = await adminDb.collection('places_cache').get()
    
    stats.totalDocuments = snapshot.size
    logger.info(`📊 Total documents: ${stats.totalDocuments}`)

    // 各ドキュメントを分析
    snapshot.docs.forEach((doc: any) => {
      const data = doc.data()
      
      // price_levelの存在チェック
      if (data.price_level !== undefined && data.price_level !== null) {
        stats.withPriceLevel++
        
        // 価格レベルの分布
        const level = data.price_level
        if (level >= 0 && level <= 4) {
          stats.priceLevelDistribution[level as keyof typeof stats.priceLevelDistribution]++
        }
        
        // サンプルを収集（最大10件）
        if (stats.samplePlacesWithPriceLevel.length < 10) {
          stats.samplePlacesWithPriceLevel.push({
            place_id: data.place_id || doc.id,
            name: data.name || 'Unknown',
            price_level: data.price_level,
            language: data.language || 'unknown'
          })
        }
      } else {
        stats.withoutPriceLevel++
        
        // サンプルを収集（最大10件）
        if (stats.samplePlacesWithoutPriceLevel.length < 10) {
          const hasMissingFlag = data.missing_data_flags?.price_level === true
          stats.samplePlacesWithoutPriceLevel.push({
            place_id: data.place_id || doc.id,
            name: data.name || 'Unknown',
            language: data.language || 'unknown',
            has_missing_flag: hasMissingFlag
          })
        }
      }
      
      // missing_data_flagsの統計
      if (data.missing_data_flags) {
        stats.missingDataFlagsCount++
        
        if (data.missing_data_flags.price_level === true) {
          stats.persistentlyMissingPriceLevel++
        }
      }
    })

    // 結果を表示
    console.log('\n' + '='.repeat(80))
    console.log('📊 Price Level Cache Analysis Results')
    console.log('='.repeat(80))
    
    console.log('\n📈 Overall Statistics:')
    console.log(`  Total Documents:           ${stats.totalDocuments}`)
    console.log(`  With price_level:          ${stats.withPriceLevel} (${((stats.withPriceLevel / stats.totalDocuments) * 100).toFixed(2)}%)`)
    console.log(`  Without price_level:       ${stats.withoutPriceLevel} (${((stats.withoutPriceLevel / stats.totalDocuments) * 100).toFixed(2)}%)`)
    
    console.log('\n💰 Price Level Distribution:')
    console.log(`  Level 0 (Free):            ${stats.priceLevelDistribution[0]} places`)
    console.log(`  Level 1 (Inexpensive):     ${stats.priceLevelDistribution[1]} places`)
    console.log(`  Level 2 (Moderate):        ${stats.priceLevelDistribution[2]} places`)
    console.log(`  Level 3 (Expensive):       ${stats.priceLevelDistribution[3]} places`)
    console.log(`  Level 4 (Very Expensive):  ${stats.priceLevelDistribution[4]} places`)
    
    console.log('\n🚫 Missing Data Flags:')
    console.log(`  Documents with missing_data_flags:        ${stats.missingDataFlagsCount} (${((stats.missingDataFlagsCount / stats.totalDocuments) * 100).toFixed(2)}%)`)
    console.log(`  Persistently missing price_level:         ${stats.persistentlyMissingPriceLevel} (${((stats.persistentlyMissingPriceLevel / stats.totalDocuments) * 100).toFixed(2)}%)`)
    
    console.log('\n✅ Sample Places WITH price_level:')
    stats.samplePlacesWithPriceLevel.forEach((place, index) => {
      console.log(`  ${index + 1}. ${place.name} (${place.language})`)
      console.log(`     place_id: ${place.place_id}`)
      console.log(`     price_level: ${place.price_level} (${'$'.repeat(place.price_level + 1)})`)
    })
    
    console.log('\n❌ Sample Places WITHOUT price_level:')
    stats.samplePlacesWithoutPriceLevel.forEach((place, index) => {
      console.log(`  ${index + 1}. ${place.name} (${place.language})`)
      console.log(`     place_id: ${place.place_id}`)
      console.log(`     has_missing_flag: ${place.has_missing_flag ? '✅ Yes (永続的欠損)' : '❌ No'}`)
    })
    
    console.log('\n' + '='.repeat(80))
    console.log('✅ Analysis complete!')
    console.log('='.repeat(80) + '\n')

  } catch (error) {
    logger.error('❌ Error analyzing price_level cache:', error)
    throw error
  }
}

// スクリプト実行
analyzePriceLevelCache()
  .then(() => {
    logger.info('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('❌ Script failed:', error)
    process.exit(1)
  })

