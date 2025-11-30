/**
 * Directions API料金最適化ユーティリティ
 * デバウンス機能とキャッシュ機能でAPI呼び出しを最小化
 */

import logger from "@/lib/core/logger";

export interface RouteCacheKey {
	origin: string;
	destination: string;
	waypoints: string[];
	travelMode: string;
	avoidHighways?: boolean;
	avoidTolls?: boolean;
	avoidFerries?: boolean;
}

export interface CachedRoute {
	result: any;
	timestamp: number;
	expiresAt: number;
}

export interface RouteOptimizationConfig {
	debounceMs: number; // デバウンス時間（ミリ秒）
	cacheExpiryMs: number; // キャッシュ有効期限（ミリ秒）
	maxCacheSize: number; // 最大キャッシュサイズ
	useServerSideOptimization: boolean; // サーバーサイド最適化を使用するか
}

export interface RouteOptimizationRequest {
	origin: string | { lat: number; lng: number };
	destination: string | { lat: number; lng: number };
	waypoints: Array<string | { lat: number; lng: number }>;
	travelMode?: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";
	optimizeWaypoints?: boolean;
	avoidHighways?: boolean;
	avoidTolls?: boolean;
	avoidFerries?: boolean;
}

export interface RouteOptimizationResponse {
	routes: any[];
	status: string;
	optimizedOrder?: number[];
	totalDistance?: { meters: number; text: string };
	totalDuration?: { seconds: number; text: string };
	costEstimate?: {
		apiCalls: number;
		estimatedCost: number;
		currency: string;
	};
}

export class RouteOptimizer {
	private cache = new Map<string, CachedRoute>();
	private debounceTimer: NodeJS.Timeout | null = null;
	private config: RouteOptimizationConfig;

	constructor(config: Partial<RouteOptimizationConfig> = {}) {
		this.config = {
			debounceMs: 500, // 500msのデバウンス
			cacheExpiryMs: 5 * 60 * 1000, // 5分間キャッシュ
			maxCacheSize: 100, // 最大100件のキャッシュ
			useServerSideOptimization: true, // サーバーサイド最適化をデフォルトで有効
			...config,
		};
	}

	/**
	 * ルートキャッシュキーを生成
	 */
	private generateCacheKey(key: RouteCacheKey): string {
		const waypointsStr = key.waypoints.sort().join("|");
		const avoidOptions = [];
		if (key.avoidHighways) avoidOptions.push("highways");
		if (key.avoidTolls) avoidOptions.push("tolls");
		if (key.avoidFerries) avoidOptions.push("ferries");
		const avoidStr = avoidOptions.join("|");
		return `${key.origin}|${key.destination}|${waypointsStr}|${key.travelMode}|${avoidStr}`;
	}

	/**
	 * キャッシュからルートを取得
	 */
	private getCachedRoute(key: RouteCacheKey): any | null {
		const cacheKey = this.generateCacheKey(key);
		const cached = this.cache.get(cacheKey);

		if (!cached) return null;

		// キャッシュの有効期限をチェック
		if (Date.now() > cached.expiresAt) {
			this.cache.delete(cacheKey);
			return null;
		}

		return cached.result;
	}

	/**
	 * ルートをキャッシュに保存
	 */
	private setCachedRoute(key: RouteCacheKey, result: any): void {
		const cacheKey = this.generateCacheKey(key);

		// キャッシュサイズ制限
		if (this.cache.size >= this.config.maxCacheSize) {
			// 最も古いキャッシュを削除
			const oldestKey = this.cache.keys().next().value;
			this.cache.delete(oldestKey);
		}

		this.cache.set(cacheKey, {
			result,
			timestamp: Date.now(),
			expiresAt: Date.now() + this.config.cacheExpiryMs,
		});
	}

	/**
	 * デバウンス付きルート計算（従来のクライアントサイド版）
	 */
	public async calculateRouteDebounced(
		key: RouteCacheKey,
		directionsService: any,
		callback: (result: any, status: any) => void,
	): Promise<void> {
		// 既存のタイマーをクリア
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		// キャッシュをチェック
		const cachedResult = this.getCachedRoute(key);
		if (cachedResult) {
			callback(cachedResult, "OK");
			return;
		}

		// デバウンスタイマーを設定
		this.debounceTimer = setTimeout(async () => {
			try {
				const request = {
					origin: key.origin,
					destination: key.destination,
					waypoints: key.waypoints.map((wp) => ({ location: wp })),
					travelMode: key.travelMode,
					optimizeWaypoints: true,
				};

				directionsService.route(request, (result: any, status: any) => {
					if (status === "OK") {
						// 成功した場合のみキャッシュに保存
						this.setCachedRoute(key, result);
					}
					callback(result, status);
				});
			} catch (error) {
				logger.error("Route calculation error:", error);
				callback(null, "ERROR");
			}
		}, this.config.debounceMs);
	}

	/**
	 * サーバーサイド最適化を使用したルート計算
	 */
	public async calculateRouteOptimized(
		request: RouteOptimizationRequest,
		callback: (
			result: RouteOptimizationResponse | null,
			status: string,
		) => void,
	): Promise<void> {
		// キャッシュキーを生成
		const cacheKey: RouteCacheKey = {
			origin:
				typeof request.origin === "string"
					? request.origin
					: `${request.origin.lat},${request.origin.lng}`,
			destination:
				typeof request.destination === "string"
					? request.destination
					: `${request.destination.lat},${request.destination.lng}`,
			waypoints: request.waypoints.map((wp) =>
				typeof wp === "string" ? wp : `${wp.lat},${wp.lng}`,
			),
			travelMode: request.travelMode || "DRIVING",
			avoidHighways: request.avoidHighways,
			avoidTolls: request.avoidTolls,
			avoidFerries: request.avoidFerries,
		};

		// キャッシュをチェック
		const cachedResult = this.getCachedRoute(cacheKey);
		if (cachedResult) {
			callback(cachedResult, "OK");
			return;
		}

		try {
			const response = await fetch("/api/route-optimization", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(request),
				signal: AbortSignal.timeout(15000), // 15秒でタイムアウト
			});

			if (!response.ok) {
				throw new Error(`Route optimization API error: ${response.status}`);
			}

			const result: RouteOptimizationResponse = await response.json();

			if (result.status === "OK") {
				// 成功した場合のみキャッシュに保存
				this.setCachedRoute(cacheKey, result);
			}

			callback(result, result.status);
		} catch (error) {
			logger.error("Route optimization error:", error);
			callback(null, "ERROR");
		}
	}

	/**
	 * デバウンス付きサーバーサイド最適化ルート計算
	 */
	public async calculateRouteOptimizedDebounced(
		request: RouteOptimizationRequest,
		callback: (
			result: RouteOptimizationResponse | null,
			status: string,
		) => void,
	): Promise<void> {
		// 既存のタイマーをクリア
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		// デバウンスタイマーを設定
		this.debounceTimer = setTimeout(async () => {
			await this.calculateRouteOptimized(request, callback);
		}, this.config.debounceMs);
	}

	/**
	 * キャッシュをクリア
	 */
	public clearCache(): void {
		this.cache.clear();
	}

	/**
	 * キャッシュ統計を取得
	 */
	public getCacheStats(): {
		size: number;
		maxSize: number;
		hitRate: number;
	} {
		return {
			size: this.cache.size,
			maxSize: this.config.maxCacheSize,
			hitRate: 0, // TODO: ヒット率の計算を実装
		};
	}

	/**
	 * 期限切れキャッシュをクリーンアップ
	 */
	public cleanupExpiredCache(): void {
		const now = Date.now();
		for (const [key, cached] of this.cache.entries()) {
			if (now > cached.expiresAt) {
				this.cache.delete(key);
			}
		}
	}
}

// シングルトンインスタンス
export const routeOptimizer = new RouteOptimizer();

/**
 * ルート最適化の設定を更新
 */
export const updateRouteOptimizationConfig = (
	config: Partial<RouteOptimizationConfig>,
) => {
	Object.assign(routeOptimizer["config"], config);
};

/**
 * ルート計算のコスト見積もり（改善版）
 */
export const estimateRouteCost = async (
	waypointCount: number,
): Promise<{
	waypointCount: number;
	requestsNeeded: number;
	estimatedCost: number;
	currency: string;
	suggestions: string[];
}> => {
	try {
		const response = await fetch(
			`/api/route-optimization?waypoints=${waypointCount}`,
		);
		if (response.ok) {
			return await response.json();
		}
	} catch (error) {
		logger.error("Error fetching cost estimate:", error);
	}

	// フォールバック: ローカル計算
	const requestsNeeded = Math.ceil(waypointCount / 23);
	const estimatedCost = requestsNeeded * 0.005;

	const suggestions: string[] = [];
	if (waypointCount > 10) {
		suggestions.push(
			"多数の地点があります。日程別に分けて表示すると料金を削減できます。",
		);
	}
	if (waypointCount > 20) {
		suggestions.push(
			"20地点を超えています。ルート絞り込み機能の使用を推奨します。",
		);
	}

	return {
		waypointCount,
		requestsNeeded,
		estimatedCost,
		currency: "USD",
		suggestions,
	};
};

/**
 * waypointの最適化ロジック（改善版）
 */
export const optimizeWaypoints = async (
	waypoints: Array<string | { lat: number; lng: number }>,
	origin: string | { lat: number; lng: number },
	destination: string | { lat: number; lng: number },
	options: {
		travelMode?: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";
		avoidHighways?: boolean;
		avoidTolls?: boolean;
		avoidFerries?: boolean;
	} = {},
): Promise<{
	optimizedWaypoints: Array<string | { lat: number; lng: number }>;
	optimizedOrder: number[];
	totalDistance: { meters: number; text: string };
	totalDuration: { seconds: number; text: string };
	costEstimate: { apiCalls: number; estimatedCost: number; currency: string };
} | null> => {
	try {
		const request: RouteOptimizationRequest = {
			origin,
			destination,
			waypoints,
			travelMode: options.travelMode || "DRIVING",
			optimizeWaypoints: true,
			avoidHighways: options.avoidHighways,
			avoidTolls: options.avoidTolls,
			avoidFerries: options.avoidFerries,
		};

		const response = await fetch("/api/route-optimization", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(request),
			signal: AbortSignal.timeout(15000),
		});

		if (!response.ok) {
			throw new Error(`Route optimization API error: ${response.status}`);
		}

		const result: RouteOptimizationResponse = await response.json();

		if (result.status !== "OK") {
			return null;
		}

		// 最適化されたwaypointの順序を取得
		const optimizedOrder = result.optimizedOrder || [];

		logger.debug("Google API optimizedOrder:", optimizedOrder);
		logger.debug("Waypoints length:", waypoints.length);
		logger.debug(
			"Original waypoints:",
			waypoints.map((wp, i) => ({ index: i, location: wp })),
		);
		logger.debug("Origin:", origin);
		logger.debug("Destination:", destination);

		// Google APIのoptimizedOrderは、waypointのみの最適化順序
		// 例: waypoints = [A, B, C, D] で optimizedOrder = [2, 0, 3, 1] の場合
		// 実際の順序は: origin → C → A → D → B → destination

		const fullOptimizedOrder = [0]; // originは常に最初

		// waypointの最適化された順序を追加
		optimizedOrder.forEach((index) => {
			fullOptimizedOrder.push(index + 1); // waypointのインデックスを+1
		});

		// destinationは常に最後
		fullOptimizedOrder.push(waypoints.length + 1);

		logger.debug("Full optimized order:", fullOptimizedOrder);

		return {
			optimizedWaypoints: fullOptimizedOrder.map((index) => {
				if (index === 0) return origin;
				if (index === waypoints.length + 1) return destination;
				return waypoints[index - 1];
			}),
			optimizedOrder: fullOptimizedOrder,
			totalDistance: result.totalDistance || { meters: 0, text: "0 km" },
			totalDuration: result.totalDuration || { seconds: 0, text: "0 分" },
			costEstimate: result.costEstimate || {
				apiCalls: 1,
				estimatedCost: 0.005,
				currency: "USD",
			},
		};
	} catch (error) {
		logger.error("Waypoint optimization error:", error);
		return null;
	}
};

/**
 * 複数のルート候補を比較して最適なものを選択
 */
export const compareRouteOptions = async (
	waypoints: Array<string | { lat: number; lng: number }>,
	origin: string | { lat: number; lng: number },
	destination: string | { lat: number; lng: number },
): Promise<{
	fastestRoute: any;
	shortestRoute: any;
	cheapestRoute: any;
	recommendations: string[];
} | null> => {
	try {
		const options = [
			{
				travelMode: "DRIVING" as const,
				avoidHighways: false,
				avoidTolls: false,
			},
			{
				travelMode: "DRIVING" as const,
				avoidHighways: true,
				avoidTolls: false,
			},
			{
				travelMode: "DRIVING" as const,
				avoidHighways: false,
				avoidTolls: true,
			},
			{ travelMode: "WALKING" as const },
			{ travelMode: "BICYCLING" as const },
			{ travelMode: "TRANSIT" as const },
		];

		const results = await Promise.allSettled(
			options.map((option) =>
				optimizeWaypoints(waypoints, origin, destination, option),
			),
		);

		const validResults = results
			.filter(
				(result): result is PromiseFulfilledResult<any> =>
					result.status === "fulfilled" && result.value !== null,
			)
			.map((result) => result.value);

		if (validResults.length === 0) {
			return null;
		}

		// 最速ルート
		const fastestRoute = validResults.reduce((fastest, current) =>
			current.totalDuration.seconds < fastest.totalDuration.seconds
				? current
				: fastest,
		);

		// 最短ルート
		const shortestRoute = validResults.reduce((shortest, current) =>
			current.totalDistance.meters < shortest.totalDistance.meters
				? current
				: shortest,
		);

		// 最安ルート（APIコストベース）
		const cheapestRoute = validResults.reduce((cheapest, current) =>
			current.costEstimate.estimatedCost < cheapest.costEstimate.estimatedCost
				? current
				: cheapest,
		);

		const recommendations: string[] = [];
		if (
			fastestRoute.totalDuration.seconds <
			shortestRoute.totalDuration.seconds * 0.8
		) {
			recommendations.push("最速ルートが大幅に時間短縮できます");
		}
		if (
			shortestRoute.totalDistance.meters <
			fastestRoute.totalDistance.meters * 0.8
		) {
			recommendations.push("最短ルートが大幅に距離短縮できます");
		}
		if (
			cheapestRoute.costEstimate.estimatedCost <
			fastestRoute.costEstimate.estimatedCost * 0.5
		) {
			recommendations.push("コスト削減のため、代替ルートの検討をお勧めします");
		}

		return {
			fastestRoute,
			shortestRoute,
			cheapestRoute,
			recommendations,
		};
	} catch (error) {
		logger.error("Route comparison error:", error);
		return null;
	}
};

/**
 * 料金削減の提案（改善版）
 */
export const getCostOptimizationSuggestions = async (
	waypointCount: number,
): Promise<string[]> => {
	try {
		const costEstimate = await estimateRouteCost(waypointCount);
		return costEstimate.suggestions;
	} catch (error) {
		logger.error("Error getting cost optimization suggestions:", error);
		return [];
	}
};
