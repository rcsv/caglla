/**
 * Directions API料金最適化ユーティリティ
 * デバウンス機能とキャッシュ機能でAPI呼び出しを最小化
 */

export interface RouteCacheKey {
  origin: string
  destination: string
  waypoints: string[]
  travelMode: string
}

export interface CachedRoute {
  result: any
  timestamp: number
  expiresAt: number
}

export interface RouteOptimizationConfig {
  debounceMs: number // デバウンス時間（ミリ秒）
  cacheExpiryMs: number // キャッシュ有効期限（ミリ秒）
  maxCacheSize: number // 最大キャッシュサイズ
}

export class RouteOptimizer {
  private cache = new Map<string, CachedRoute>()
  private debounceTimer: NodeJS.Timeout | null = null
  private config: RouteOptimizationConfig

  constructor(config: Partial<RouteOptimizationConfig> = {}) {
    this.config = {
      debounceMs: 500, // 500msのデバウンス
      cacheExpiryMs: 5 * 60 * 1000, // 5分間キャッシュ
      maxCacheSize: 100, // 最大100件のキャッシュ
      ...config
    }
  }

  /**
   * ルートキャッシュキーを生成
   */
  private generateCacheKey(key: RouteCacheKey): string {
    const waypointsStr = key.waypoints.sort().join('|')
    return `${key.origin}|${key.destination}|${waypointsStr}|${key.travelMode}`
  }

  /**
   * キャッシュからルートを取得
   */
  private getCachedRoute(key: RouteCacheKey): any | null {
    const cacheKey = this.generateCacheKey(key)
    const cached = this.cache.get(cacheKey)
    
    if (!cached) return null
    
    // キャッシュの有効期限をチェック
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(cacheKey)
      return null
    }
    
    return cached.result
  }

  /**
   * ルートをキャッシュに保存
   */
  private setCachedRoute(key: RouteCacheKey, result: any): void {
    const cacheKey = this.generateCacheKey(key)
    
    // キャッシュサイズ制限
    if (this.cache.size >= this.config.maxCacheSize) {
      // 最も古いキャッシュを削除
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
    
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.cacheExpiryMs
    })
  }

  /**
   * デバウンス付きルート計算
   */
  public async calculateRouteDebounced(
    key: RouteCacheKey,
    directionsService: any,
    callback: (result: any, status: any) => void
  ): Promise<void> {
    // 既存のタイマーをクリア
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    // キャッシュをチェック
    const cachedResult = this.getCachedRoute(key)
    if (cachedResult) {
      callback(cachedResult, 'OK')
      return
    }

    // デバウンスタイマーを設定
    this.debounceTimer = setTimeout(async () => {
      try {
        const request = {
          origin: key.origin,
          destination: key.destination,
          waypoints: key.waypoints.map(wp => ({ location: wp })),
          travelMode: key.travelMode,
          optimizeWaypoints: true,
        }

        directionsService.route(request, (result: any, status: any) => {
          if (status === 'OK') {
            // 成功した場合のみキャッシュに保存
            this.setCachedRoute(key, result)
          }
          callback(result, status)
        })
      } catch (error) {
        console.error('Route calculation error:', error)
        callback(null, 'ERROR')
      }
    }, this.config.debounceMs)
  }

  /**
   * キャッシュをクリア
   */
  public clearCache(): void {
    this.cache.clear()
  }

  /**
   * キャッシュ統計を取得
   */
  public getCacheStats(): {
    size: number
    maxSize: number
    hitRate: number
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize,
      hitRate: 0 // TODO: ヒット率の計算を実装
    }
  }

  /**
   * 期限切れキャッシュをクリーンアップ
   */
  public cleanupExpiredCache(): void {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// シングルトンインスタンス
export const routeOptimizer = new RouteOptimizer()

/**
 * ルート最適化の設定を更新
 */
export const updateRouteOptimizationConfig = (config: Partial<RouteOptimizationConfig>) => {
  Object.assign(routeOptimizer['config'], config)
}

/**
 * ルート計算のコスト見積もり
 */
export const estimateRouteCost = (waypointCount: number): number => {
  // Google Directions API料金: $0.005 per request
  // 1リクエストあたり最大23のwaypointまで
  const requestsNeeded = Math.ceil(waypointCount / 23)
  return requestsNeeded * 0.005
}

/**
 * 料金削減の提案
 */
export const getCostOptimizationSuggestions = (waypointCount: number): string[] => {
  const suggestions: string[] = []
  
  if (waypointCount > 10) {
    suggestions.push('多数の地点があります。日程別に分けて表示すると料金を削減できます。')
  }
  
  if (waypointCount > 20) {
    suggestions.push('20地点を超えています。ルート絞り込み機能の使用を推奨します。')
  }
  
  return suggestions
}
