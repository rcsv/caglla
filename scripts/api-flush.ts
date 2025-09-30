/**
 * API経由でItinerariesデータを削除するスクリプト
 */

async function flushItinerariesViaAPI() {
  try {
    console.log('🚀 Starting Itineraries data flush via API...')
    
    // まず、すべてのItinerariesを取得
    console.log('📋 Fetching all itineraries...')
    const response = await fetch('http://localhost:3000/api/itineraries', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch itineraries: ${response.status}`)
    }
    
    const itineraries = await response.json()
    console.log(`📊 Found ${itineraries.length} itineraries to delete`)
    
    if (itineraries.length === 0) {
      console.log('✅ No itineraries found. Nothing to delete.')
      return
    }
    
    // 各Itineraryを削除
    let deletedCount = 0
    for (const itinerary of itineraries) {
      try {
        const deleteResponse = await fetch(`http://localhost:3000/api/itineraries/${itinerary.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (deleteResponse.ok) {
          deletedCount++
          console.log(`✅ Deleted itinerary ${deletedCount}/${itineraries.length}: ${itinerary.title}`)
        } else {
          console.error(`❌ Failed to delete itinerary ${itinerary.id}: ${deleteResponse.status}`)
        }
      } catch (error) {
        console.error(`❌ Error deleting itinerary ${itinerary.id}:`, error)
      }
    }
    
    console.log('🎉 Itineraries data flush completed!')
    console.log(`📊 Total deleted: ${deletedCount}/${itineraries.length} documents`)
    
  } catch (error) {
    console.error('❌ Error flushing itineraries data:', error)
    throw error
  }
}

// スクリプト実行
flushItinerariesViaAPI()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
