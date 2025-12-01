import { timezoneApiHelpers } from "../timezone";
import type { TimezoneResult } from "../timezone";

// fetchをモック
global.fetch = jest.fn();

describe("timezoneApiHelpers", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...originalEnv };
		(global.fetch as jest.Mock).mockClear();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("getTimezone", () => {
		it("should return timezone information for valid coordinates", async () => {
			process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-api-key";

			const mockResponse: TimezoneResult = {
				timeZoneId: "Asia/Tokyo",
				timeZoneName: "Japan Standard Time",
				rawOffset: 32400, // 9時間 = 32400秒
				dstOffset: 0,
			};

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					status: "OK",
					timeZoneId: mockResponse.timeZoneId,
					timeZoneName: mockResponse.timeZoneName,
					rawOffset: mockResponse.rawOffset,
					dstOffset: mockResponse.dstOffset,
				}),
			});

			const result = await timezoneApiHelpers.getTimezone(35.6762, 139.6503);

			expect(result).toEqual(mockResponse);
			expect(global.fetch).toHaveBeenCalledTimes(1);
			// URLエンコードされるため、デコードしてチェック
			const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
			const url = new URL(calledUrl);
			expect(url.searchParams.get("location")).toBe("35.6762,139.6503");
			expect(url.searchParams.get("key")).toBe("test-api-key");
		});

		it("should return timezone for New York coordinates", async () => {
			process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-api-key";

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					status: "OK",
					timeZoneId: "America/New_York",
					timeZoneName: "Eastern Standard Time",
					rawOffset: -18000, // UTC-5時間
					dstOffset: 3600, // サマータイム +1時間
				}),
			});

			const result = await timezoneApiHelpers.getTimezone(40.7128, -74.006);

			expect(result?.timeZoneId).toBe("America/New_York");
			expect(result?.rawOffset).toBe(-18000);
			expect(result?.dstOffset).toBe(3600);
		});

		it("should return null when API key is not configured", async () => {
			delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
			delete process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

			const result = await timezoneApiHelpers.getTimezone(35.6762, 139.6503);

			expect(result).toBeNull();
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it("should return null when API returns error status", async () => {
			process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-api-key";

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					status: "INVALID_REQUEST",
					errorMessage: "Invalid location",
				}),
			});

			const result = await timezoneApiHelpers.getTimezone(999, 999);

			expect(result).toBeNull();
		});

		it("should return null when API request fails", async () => {
			process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-api-key";

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
			});

			const result = await timezoneApiHelpers.getTimezone(35.6762, 139.6503);

			expect(result).toBeNull();
		});

		it("should use custom timestamp when provided", async () => {
			process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-api-key";
			const customTimestamp = 1331161200; // March 8, 2012

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					status: "OK",
					timeZoneId: "America/Los_Angeles",
					timeZoneName: "Pacific Standard Time",
					rawOffset: -28800,
					dstOffset: 0,
				}),
			});

			await timezoneApiHelpers.getTimezone(39.6035, -119.6823, customTimestamp);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining(`timestamp=${customTimestamp}`),
			);
		});

		it("should use current timestamp when not provided", async () => {
			process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-api-key";
			const beforeCall = Math.floor(Date.now() / 1000);

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					status: "OK",
					timeZoneId: "Asia/Tokyo",
					timeZoneName: "Japan Standard Time",
					rawOffset: 32400,
					dstOffset: 0,
				}),
			});

			await timezoneApiHelpers.getTimezone(35.6762, 139.6503);

			const afterCall = Math.floor(Date.now() / 1000);
			const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
			const url = new URL(callUrl);
			const timestamp = parseInt(url.searchParams.get("timestamp") || "0", 10);

			expect(timestamp).toBeGreaterThanOrEqual(beforeCall);
			expect(timestamp).toBeLessThanOrEqual(afterCall);
		});

		it("should return null when response is missing required fields", async () => {
			process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-api-key";

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					status: "OK",
					// timeZoneIdが欠けている
					timeZoneName: "Japan Standard Time",
					rawOffset: 32400,
					dstOffset: 0,
				}),
			});

			const result = await timezoneApiHelpers.getTimezone(35.6762, 139.6503);

			expect(result).toBeNull();
		});
	});
});
