/**
 * Trip Publish のテスト
 *
 * Tripの公開/非公開機能のテスト
 */

import { publishTrip, unpublishTrip } from "@/lib/travel/trip-publish";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import type { Trip } from "@/lib/core/types";

// makeAuthenticatedRequest をモック化
jest.mock("@/lib/api/helpers", () => ({
	makeAuthenticatedRequest: jest.fn(),
}));

const mockMakeAuthenticatedRequest =
	makeAuthenticatedRequest as jest.MockedFunction<
		typeof makeAuthenticatedRequest
	>;

describe("Trip Publish", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("publishTrip", () => {
		it("should publish a trip successfully", async () => {
			const mockTrip: Trip = {
				id: "trip-1",
				user_id: "user-1",
				title: "公開された旅行",
				status: "PLANNING",
				access_level: "public",
				slug: "public-trip-slug",
				created_at: new Date(),
				updated_at: new Date(),
			};

			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, trip: mockTrip }),
			} as Response);

			const result = await publishTrip("trip-slug");

			expect(result).toEqual(mockTrip);
			expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith(
				"/api/trip/trip-slug/publish",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({}),
				},
			);
		});

		it("should publish a trip with custom slug", async () => {
			const mockTrip: Trip = {
				id: "trip-1",
				user_id: "user-1",
				title: "公開された旅行",
				status: "PLANNING",
				access_level: "public",
				slug: "custom-public-slug",
				created_at: new Date(),
				updated_at: new Date(),
			};

			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, trip: mockTrip }),
			} as Response);

			const result = await publishTrip("trip-slug", "custom-public-slug");

			expect(result).toEqual(mockTrip);
			const callBody = JSON.parse(
				(mockMakeAuthenticatedRequest.mock.calls[0][1] as RequestInit)
					.body as string,
			);
			expect(callBody.slug).toBe("custom-public-slug");
		});

		it("should handle publish errors", async () => {
			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({ error: "Trip is already public" }),
			} as Response);

			await expect(publishTrip("trip-slug")).rejects.toThrow(
				"Trip is already public",
			);
		});
	});

	describe("unpublishTrip", () => {
		it("should unpublish a trip successfully", async () => {
			const mockTrip: Trip = {
				id: "trip-1",
				user_id: "user-1",
				title: "非公開に戻された旅行",
				status: "PLANNING",
				access_level: "private",
				created_at: new Date(),
				updated_at: new Date(),
			};

			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, trip: mockTrip }),
			} as Response);

			const result = await unpublishTrip("trip-slug");

			expect(result).toEqual(mockTrip);
			expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith(
				"/api/trip/trip-slug/publish",
				{
					method: "DELETE",
				},
			);
		});

		it("should handle unpublish errors", async () => {
			mockMakeAuthenticatedRequest.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({ error: "Trip is already private" }),
			} as Response);

			await expect(unpublishTrip("trip-slug")).rejects.toThrow(
				"Trip is already private",
			);
		});
	});
});
