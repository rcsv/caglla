#!/usr/bin/env ts-node
/**
 * Google Places API v1のpriceLevel取得をテストするスクリプト
 *
 * 実行方法:
 *   pnpm exec ts-node scripts/test-price-level-api.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// テスト対象のplace_id（レストラン・カフェ・ホテルなど価格情報があるはず）
const TEST_PLACES = [
	{
		name: "Starbucks Reserve Roastery Tokyo",
		place_id: "ChIJi4SboZmMGGAR3FqHJHQM9gU", // スターバックスリザーブ東京
	},
	{
		name: "Hamazushi Toyota Takaoka (from cache)",
		place_id: "ChIJ6T6wt0SeBGAR0G87mrRGeFw", // 回転寿司（キャッシュに存在）
	},
	{
		name: "Tokyo Disneyland Hotel",
		place_id: "ChIJH8xMqY-BGGARt3qHmLRZTFc", // ディズニーランドホテル
	},
];

async function testPriceLevelAPI(): Promise<void> {
	const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

	if (!apiKey) {
		console.error("❌ NEXT_PUBLIC_GOOGLE_PLACES_API_KEY is not set");
		process.exit(1);
	}

	console.log("🧪 Testing Google Places API v1 priceLevel field...\n");
	console.log("=".repeat(80));

	for (const testPlace of TEST_PLACES) {
		console.log(`\n📍 Testing: ${testPlace.name}`);
		console.log(`   place_id: ${testPlace.place_id}`);

		try {
			const response = await fetch(
				`https://places.googleapis.com/v1/places/${testPlace.place_id}?languageCode=ja`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						"X-Goog-Api-Key": apiKey,
						"X-Goog-FieldMask":
							"id,displayName,priceLevel,rating,userRatingCount",
						"Accept-Language": "ja",
					},
				},
			);

			if (!response.ok) {
				console.error(`   ❌ API Error: ${response.status}`);
				const errorData = await response.json().catch(() => ({}));
				console.error(`   Error details:`, errorData);
				continue;
			}

			const data = await response.json();

			console.log(`   ✅ API Response:`);
			console.log(
				`      - displayName: ${data.displayName?.text || data.displayName}`,
			);
			console.log(`      - priceLevel: ${data.priceLevel || "undefined"}`);
			console.log(`      - priceLevel type: ${typeof data.priceLevel}`);
			console.log(`      - rating: ${data.rating || "undefined"}`);
			console.log(
				`      - userRatingCount: ${data.userRatingCount || "undefined"}`,
			);

			// 変換ロジックのテスト
			if (data.priceLevel) {
				// ❌ 旧ロジック（バグ）
				const oldPriceLevels = [
					"FREE",
					"INEXPENSIVE",
					"MODERATE",
					"EXPENSIVE",
					"VERY_EXPENSIVE",
				];
				const oldIndex = oldPriceLevels.indexOf(data.priceLevel);
				console.log(
					`      - OLD conversion (buggy): ${oldIndex >= 0 ? oldIndex : "undefined"} ❌`,
				);

				// ✅ 新ロジック（修正済み）
				const newPriceLevels = [
					"PRICE_LEVEL_FREE",
					"PRICE_LEVEL_INEXPENSIVE",
					"PRICE_LEVEL_MODERATE",
					"PRICE_LEVEL_EXPENSIVE",
					"PRICE_LEVEL_VERY_EXPENSIVE",
				];
				const newIndex = newPriceLevels.indexOf(data.priceLevel);
				console.log(
					`      - NEW conversion (fixed): ${newIndex >= 0 ? newIndex : "undefined"} ✅`,
				);
				console.log(
					`      - As dollar signs: ${"$".repeat((newIndex >= 0 ? newIndex : 0) + 1)}`,
				);
			} else {
				console.log(`      ⚠️  priceLevel not returned by API`);
			}
		} catch (error) {
			console.error(`   ❌ Error:`, error);
		}
	}

	console.log("\n" + "=".repeat(80));
	console.log("✅ Test complete!\n");
}

testPriceLevelAPI()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("❌ Script failed:", error);
		process.exit(1);
	});
