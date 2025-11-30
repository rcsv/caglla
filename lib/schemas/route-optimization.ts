/**
 * Route Optimization（ルート最適化）スキーマ
 *
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from "zod";

/**
 * Location スキーマ（文字列または座標オブジェクト）
 */
const LocationSchema = z.union([
	z.string().min(1, "Location string cannot be empty"),
	z.object({
		lat: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
		lng: z
			.number()
			.min(-180)
			.max(180, "Longitude must be between -180 and 180"),
	}),
]);

/**
 * Travel Mode スキーマ
 */
const TravelModeSchema = z
	.enum(["DRIVING", "WALKING", "BICYCLING", "TRANSIT"])
	.optional();

/**
 * Route Optimization リクエストスキーマ
 *
 * `app/api/route-optimization/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
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
export const RouteOptimizationRequestSchema = z.object({
	origin: LocationSchema,
	destination: LocationSchema,
	waypoints: z
		.array(LocationSchema)
		.min(1, "At least one waypoint is required"),
	travelMode: TravelModeSchema,
	optimizeWaypoints: z.boolean().optional(),
	avoidHighways: z.boolean().optional(),
	avoidTolls: z.boolean().optional(),
	avoidFerries: z.boolean().optional(),
});

/**
 * ルート最適化コスト見積もりリクエストスキーマ（GET クエリパラメータ用）
 *
 * `app/api/route-optimization/route.ts` GET エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * const waypointCount = parseInt(searchParams.get('waypoints') || '0')
 * if (waypointCount < 0) {
 *   return NextResponse.json({ error: 'Waypoint count must be non-negative' }, { status: 400 })
 * }
 * ```
 *
 * After:
 * - zod の `.int().min(0)` で waypointCount を非負整数に
 */
export const RouteOptimizationCostEstimateQuerySchema = z.object({
	waypoints: z.coerce
		.number()
		.int()
		.min(0, "Waypoint count must be non-negative"),
});

/**
 * 型推論
 */
export type RouteOptimizationRequestInput = z.infer<
	typeof RouteOptimizationRequestSchema
>;
export type RouteOptimizationCostEstimateQueryInput = z.infer<
	typeof RouteOptimizationCostEstimateQuerySchema
>;
