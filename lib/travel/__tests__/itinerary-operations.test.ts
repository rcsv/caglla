/**
 * Itinerary Operations のテスト
 *
 * ItineraryのCRUD操作のテスト
 */

import {
	createItinerary,
	updateItinerary,
	deleteItinerary,
	insertItinerary,
	reorderItineraries,
} from "@/lib/travel/itinerary-operations";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import type { Itinerary } from "@/lib/core/types";

// makeAuthenticatedRequest をモック化
jest.mock("@/lib/api/helpers", () => ({
	makeAuthenticatedRequest: jest.fn(),
}));

const mockMakeAuthenticatedRequest =
	makeAuthenticatedRequest as jest.MockedFunction<
		typeof makeAuthenticatedRequest
	>;

describe("Itinerary Operations", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("createItinerary", () => {
		it("should create an itinerary successfully", async () => {
			const mockItinerary: Itinerary = {
				id: "itinerary-1",
				day_id: "day-1",
				sort_number: 1,
				title: "東京タワー観光",
				place_id: "ChIJxxxxx",
				created_at: new Date(),
				updated_at: new Date(),
			};

			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: true,
				json: async () => mockItinerary,
			} as Response);

			const result = await createItinerary({
				day_id: "day-1",
				title: "東京タワー観光",
				place_id: "ChIJxxxxx",
			});

			expect(result).toEqual(mockItinerary);
			expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith(
				"/api/itineraries",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: expect.stringContaining("東京タワー観光"),
				},
			);
		});

		it("should handle creation errors", async () => {
			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({ error: "Invalid request" }),
			} as Response);

			await expect(
				createItinerary({
					day_id: "day-1",
					title: "東京タワー観光",
				}),
			).rejects.toThrow("Invalid request");
		});

		it("should include optional fields", async () => {
			const mockItinerary: Itinerary = {
				id: "itinerary-1",
				day_id: "day-1",
				sort_number: 1,
				title: "東京タワー観光",
				description: "説明",
				location: "東京",
				place_id: "ChIJxxxxx",
				start_time: "10:00",
				end_time: "12:00",
				cost_amount: 1000,
				cost_currency: "JPY",
				created_at: new Date(),
				updated_at: new Date(),
			};

			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: true,
				json: async () => mockItinerary,
			} as Response);

			await createItinerary({
				day_id: "day-1",
				title: "東京タワー観光",
				description: "説明",
				location: "東京",
				place_id: "ChIJxxxxx",
				start_time: "10:00",
				end_time: "12:00",
				cost_amount: 1000,
				cost_currency: "JPY",
			});

			const callBody = JSON.parse(
				(mockMakeAuthenticatedRequest.mock.calls[0][1] as RequestInit)
					.body as string,
			);
			expect(callBody.description).toBe("説明");
			expect(callBody.location).toBe("東京");
			expect(callBody.start_time).toBe("10:00");
			expect(callBody.end_time).toBe("12:00");
			expect(callBody.cost_amount).toBe(1000);
			expect(callBody.cost_currency).toBe("JPY");
		});
	});

	describe("updateItinerary", () => {
		it("should update an itinerary successfully", async () => {
			const mockItinerary: Itinerary = {
				id: "itinerary-1",
				day_id: "day-1",
				sort_number: 1,
				title: "更新されたタイトル",
				description: "更新された説明",
				created_at: new Date(),
				updated_at: new Date(),
			};

			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: true,
				json: async () => mockItinerary,
			} as Response);

			const result = await updateItinerary("itinerary-1", {
				title: "更新されたタイトル",
				description: "更新された説明",
			});

			expect(result).toEqual(mockItinerary);
			expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith(
				"/api/itineraries/itinerary-1",
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: expect.stringContaining("更新されたタイトル"),
				},
			);
		});

		it("should handle update errors", async () => {
			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: async () => ({ error: "Itinerary not found" }),
			} as Response);

			await expect(
				updateItinerary("nonexistent-itinerary", {
					title: "新しいタイトル",
				}),
			).rejects.toThrow("Itinerary not found");
		});

		it("should handle reorder request", async () => {
			const mockItinerary: Itinerary = {
				id: "itinerary-1",
				day_id: "day-2",
				sort_number: 2,
				title: "移動された旅程",
				created_at: new Date(),
				updated_at: new Date(),
			};

			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: true,
				json: async () => mockItinerary,
			} as Response);

			await updateItinerary("itinerary-1", {
				day_id: "day-2",
				sort_number: 2,
			});

			const callBody = JSON.parse(
				(mockMakeAuthenticatedRequest.mock.calls[0][1] as RequestInit)
					.body as string,
			);
			expect(callBody.day_id).toBe("day-2");
			expect(callBody.sort_number).toBe(2);
		});
	});

	describe("deleteItinerary", () => {
		it("should delete an itinerary successfully", async () => {
			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: true,
			} as Response);

			await deleteItinerary("itinerary-1");

			expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith(
				"/api/itineraries/itinerary-1",
				{
					method: "DELETE",
				},
			);
		});

		it("should handle delete errors", async () => {
			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: async () => ({ error: "Itinerary not found" }),
			} as Response);

			await expect(deleteItinerary("nonexistent-itinerary")).rejects.toThrow(
				"Itinerary not found",
			);
		});
	});

	describe("insertItinerary", () => {
		it("should insert an itinerary at specific position", async () => {
			const mockItinerary: Itinerary = {
				id: "itinerary-1",
				day_id: "day-1",
				sort_number: 3,
				title: "挿入された旅程",
				created_at: new Date(),
				updated_at: new Date(),
			};

			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: true,
				json: async () => mockItinerary,
			} as Response);

			const result = await insertItinerary(
				"day-1",
				{
					title: "挿入された旅程",
					place_id: "ChIJxxxxx",
				},
				2,
			);

			expect(result).toEqual(mockItinerary);
			const callBody = JSON.parse(
				(mockMakeAuthenticatedRequest.mock.calls[0][1] as RequestInit)
					.body as string,
			);
			expect(callBody.day_id).toBe("day-1");
			expect(callBody.insert_after_index).toBe(2);
		});
	});

	describe("reorderItineraries", () => {
		it("should reorder itineraries successfully", async () => {
			const mockItineraries: Itinerary[] = [
				{
					id: "itinerary-1",
					day_id: "day-1",
					sort_number: 1,
					title: "旅程1",
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					id: "itinerary-2",
					day_id: "day-1",
					sort_number: 2,
					title: "旅程2",
					created_at: new Date(),
					updated_at: new Date(),
				},
			];

			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ itineraries: mockItineraries }),
			} as Response);

			const result = await reorderItineraries("day-1", [
				"itinerary-1",
				"itinerary-2",
			]);

			expect(result).toEqual(mockItineraries);
			expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith(
				"/api/itineraries/reorder",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: expect.stringContaining("day-1"),
				},
			);
		});

		it("should handle reorder errors", async () => {
			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({ error: "Invalid order" }),
			} as Response);

			await expect(
				reorderItineraries("day-1", ["itinerary-1"]),
			).rejects.toThrow("Invalid order");
		});
	});
});
