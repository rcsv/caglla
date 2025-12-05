import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import logger from "@/lib/core/logger";
import { composeMiddleware } from "@/lib/core/middleware";
import {
	withBodyValidation,
	withQueryValidation,
	withGoogleMapsKey,
} from "@/lib/api/middleware";
import {
	RouteOptimizationRequestSchema,
	RouteOptimizationCostEstimateQuerySchema,
} from "@/lib/schemas/route-optimization";
import { withExternalApiErrorHandler } from "@/lib/api/external-api-helpers";

const GOOGLE_DIRECTIONS_API_URL =
	"https://maps.googleapis.com/maps/api/directions/json";

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

/**
 * POST /api/route-optimization - ルート最適化
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<RouteOptimizationRequest>(request)
 * if (!body.origin || !body.destination || !body.waypoints) {
 *   return badRequest('Origin, destination, and waypoints are required')
 * }
 * ```
 *
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const POST = composeMiddleware(
	withGoogleMapsKey(),
	withBodyValidation(RouteOptimizationRequestSchema),
)(async (request: NextRequest, ctx) => {
	try {
		// ctx.apiKeys, ctx.body が保証されている（型推論が効く）
		const GOOGLE_MAPS_API_KEY = ctx.apiKeys!.GOOGLE_MAPS!;

		// zod スキーマでバリデーション済み & 型推論
		type BodyType = z.infer<typeof RouteOptimizationRequestSchema>;
		const body = ctx.body as BodyType;

		// 座標を文字列に変換するヘルパー関数
		const formatLocation = (
			location: string | { lat: number; lng: number },
		): string => {
			if (typeof location === "string") {
				return location;
			}
			return `${location.lat},${location.lng}`;
		};

		// waypointの最適化戦略を決定
		const waypointCount = body.waypoints.length;
		const shouldOptimize =
			body.optimizeWaypoints !== false && waypointCount > 1;

		// Google Directions APIのリクエストパラメータを構築
		const params = new URLSearchParams({
			origin: formatLocation(body.origin),
			destination: formatLocation(body.destination),
			waypoints: body.waypoints.map(formatLocation).join("|"),
			travelMode: body.travelMode || "DRIVING",
			language: "ja",
			region: "jp",
			key: GOOGLE_MAPS_API_KEY,
		});

		// 最適化オプションを追加
		if (shouldOptimize) {
			params.append("optimizeWaypoints", "true");
		}

		// 回避オプションを追加
		const avoidOptions = [];
		if (body.avoidHighways) avoidOptions.push("highways");
		if (body.avoidTolls) avoidOptions.push("tolls");
		if (body.avoidFerries) avoidOptions.push("ferries");
		if (avoidOptions.length > 0) {
			params.append("avoid", avoidOptions.join("|"));
		}

		logger.debug("Route optimization request", {
			origin: formatLocation(body.origin),
			destination: formatLocation(body.destination),
			waypointCount,
			shouldOptimize,
			avoidOptions,
		});

		// Google Directions APIを呼び出し（エラーハンドリング付き）
		const data = await withExternalApiErrorHandler(
			async () => {
				const response = await fetch(`${GOOGLE_DIRECTIONS_API_URL}?${params}`, {
					signal: AbortSignal.timeout(15000), // 15秒でタイムアウト
				});

				if (!response.ok) {
					throw new Error(`Google Directions API error: ${response.status}`);
				}

				const result = await response.json();

				if (result.status !== "OK") {
					throw new Error(`Google Directions API error: ${result.status}`);
				}

				return result;
			},
			"Google Directions API",
			"/api/route-optimization",
		);

		if (data instanceof NextResponse) {
			return data;
		}

		// レスポンスを処理して最適化された情報を追加
		const optimizedResponse: RouteOptimizationResponse = {
			routes: data.routes,
			status: data.status,
			optimizedOrder: data.routes[0]?.waypoint_order,
			totalDistance: data.routes[0]?.legs?.reduce(
				(total: any, leg: any) => ({
					meters: total.meters + leg.distance.value,
					text: `${Math.round(((total.meters + leg.distance.value) / 1000) * 10) / 10} km`,
				}),
				{ meters: 0, text: "0 km" },
			),
			totalDuration: data.routes[0]?.legs?.reduce(
				(total: any, leg: any) => ({
					seconds: total.seconds + leg.duration.value,
					text: `${Math.round((total.seconds + leg.duration.value) / 60)} 分`,
				}),
				{ seconds: 0, text: "0 分" },
			),
			costEstimate: {
				apiCalls: 1,
				estimatedCost: 0.005, // Google Directions API料金: $0.005 per request
				currency: "USD",
			},
		};

		return NextResponse.json(optimizedResponse);
	} catch (error) {
		// エラーハンドリングは composeMiddleware 側で自動的に適用される
		// ただし、このエンドポイントは外部API呼び出しを含むため、詳細なエラーハンドリングが必要
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error("Error in route-optimization:", error);
		return NextResponse.json(
			{ error: "Failed to optimize route", details: errorMessage },
			{ status: 500 },
		);
	}
});

/**
 * GET /api/route-optimization - ルート最適化コスト見積もり
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 */
export const GET = composeMiddleware(
	withQueryValidation(RouteOptimizationCostEstimateQuerySchema),
)(async (request: NextRequest, ctx) => {
	try {
		// ctx.query が保証されている（型推論が効く）

		// zod スキーマでバリデーション済み & 型推論
		type QueryType = z.infer<typeof RouteOptimizationCostEstimateQuerySchema>;
		const query = ctx.query as QueryType;
		const waypointCount = query.waypoints;

		// Google Directions API料金計算
		const requestsNeeded = Math.ceil(waypointCount / 23); // 1リクエストあたり最大23のwaypoint
		const estimatedCostValue = requestsNeeded * 0.005; // $0.005 per request

		const costEstimate: {
			waypointCount: number;
			requestsNeeded: number;
			estimatedCost: string;
			currency: string;
			suggestions: string[];
		} = {
			waypointCount,
			requestsNeeded,
			estimatedCost: `$${estimatedCostValue.toFixed(3)}`,
			currency: "USD",
			suggestions: [],
		};

		// コスト削減の提案を追加
		if (waypointCount > 10) {
			costEstimate.suggestions.push(
				"多数の地点があります。日程別に分けて表示すると料金を削減できます。",
			);
		}

		if (waypointCount > 20) {
			costEstimate.suggestions.push(
				"20地点を超えています。ルート絞り込み機能の使用を推奨します。",
			);
		}

		return NextResponse.json(costEstimate);
	} catch (error) {
		// エラーハンドリングは composeMiddleware 側で自動的に適用される
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error("Error in cost estimation API", error);
		const { handleApiError } = await import("@/lib/core/error-handler");
		return handleApiError(
			error instanceof Error ? error : new Error(String(error)),
			"/api/route-optimization",
		);
	}
});
