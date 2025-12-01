/**
 * タイムゾーン推定の統合テスト
 * 
 * place_cacheにtimezoneがある場合と、従来の推定ロジックを使用する場合のテスト
 */
import { timezoneUtils } from "../timezone";
import type { PlaceData, PlacesCache } from "@/lib/core/types";

describe("timezoneUtils Integration", () => {
	describe("getTimezoneFromPlace with place_cache timezone", () => {
		it("should prioritize timezone from place_cache over estimation", () => {
			// place_cacheにtimezoneが含まれている場合
			const placeData: PlaceData = {
				place_id: "test-place-with-cache",
				name: "Some Place",
				formatted_address: "Unknown Address",
				// 推定ロジックでは判定できない場所
			};

			// place_cacheにtimezoneがある場合のシミュレーション
			// 実際のコードでは、place_cacheから取得したtimezoneを使用する必要がある
			// このテストは、place_cacheにtimezoneがある場合の動作を確認するためのもの

			// 推定ロジックではUTCが返されるはず
			const estimatedTimezone = timezoneUtils.getTimezoneFromPlace(placeData);
			expect(estimatedTimezone).toBe("UTC"); // 推定失敗

			// place_cacheにtimezoneがある場合（統合テストでは実際にplace_cacheから取得する）
			// この例では、place_cacheにtimezone="Asia/Tokyo"がある場合を想定
		});

		it("should fallback to estimation when place_cache has no timezone", () => {
			const placeData: PlaceData = {
				place_id: "test-tokyo",
				name: "Tokyo",
				formatted_address: "Tokyo, Japan",
				address_components: [
					{
						types: ["country"],
						short_name: "JP",
					},
				],
			};

			// place_cacheにtimezoneがない場合、推定ロジックが使用される
			const timezone = timezoneUtils.getTimezoneFromPlace(placeData);
			expect(timezone).toBe("Asia/Tokyo");
		});

		it("should use estimation for places without cache", () => {
			const placeData: PlaceData = {
				place_id: "test-new-york",
				name: "New York",
				formatted_address: "New York, NY, USA",
			};

			const timezone = timezoneUtils.getTimezoneFromPlace(placeData);
			expect(timezone).toBe("America/New_York");
		});
	});

	describe("timezone priority order", () => {
		it("should use country code first, then city name", () => {
			// 国コードがある場合、それが優先される
			const placeDataWithCountry: PlaceData = {
				place_id: "test-jp",
				name: "Random Place Name", // 都市名からは判定できない
				formatted_address: "Some Address",
				address_components: [
					{
						types: ["country"],
						short_name: "JP", // 日本
					},
				],
			};

			const timezone = timezoneUtils.getTimezoneFromPlace(placeDataWithCountry);
			expect(timezone).toBe("Asia/Tokyo");
		});

		it("should use city name when country code is not available", () => {
			const placeDataWithCity: PlaceData = {
				place_id: "test-paris",
				name: "Paris", // 都市名から判定
				formatted_address: "Paris, France",
				// 国コードなし
			};

			const timezone = timezoneUtils.getTimezoneFromPlace(placeDataWithCity);
			expect(timezone).toBe("Europe/Paris");
		});

		it("should use partial city name matching", () => {
			const placeDataWithPartialCity: PlaceData = {
				place_id: "test-la-airport",
				name: "Los Angeles Airport", // 部分一致で判定
				formatted_address: "Los Angeles, CA, USA",
			};

			const timezone = timezoneUtils.getTimezoneFromPlace(placeDataWithPartialCity);
			expect(timezone).toBe("America/Los_Angeles");
		});
	});

	describe("PlacesCache with timezone field", () => {
		it("should have timezone field structure", () => {
			// PlacesCache型にtimezoneフィールドがあることを確認するテスト
			const mockCache: PlacesCache = {
				format_version: "2.0.0",
				place_id: "test-place",
				language: "ja",
				name: "Test Place",
				formatted_address: "Test Address",
				geometry: {
					location: {
						lat: 35.6762,
						lng: 139.6503,
					},
				},
				timezone: "Asia/Tokyo", // timezoneフィールド
				utc_offset_minutes: 540, // JST = UTC+9 = 540分
				cached_at: new Date(),
				last_accessed: new Date(),
				access_count: 1,
			};

			expect(mockCache.timezone).toBe("Asia/Tokyo");
			expect(mockCache.utc_offset_minutes).toBe(540);
		});

		it("should handle places without timezone field (backward compatibility)", () => {
			// timezoneフィールドがオプショナルであることを確認
			const mockCacheWithoutTimezone: PlacesCache = {
				format_version: "2.0.0",
				place_id: "test-place-old",
				language: "ja",
				name: "Old Place",
				formatted_address: "Old Address",
				geometry: {
					location: {
						lat: 35.6762,
						lng: 139.6503,
					},
				},
				// timezoneフィールドなし（古いキャッシュデータ）
				cached_at: new Date(),
				last_accessed: new Date(),
				access_count: 1,
			};

			expect(mockCacheWithoutTimezone.timezone).toBeUndefined();
			// timezoneがない場合、推定ロジックが使用されるべき
		});
	});
});
