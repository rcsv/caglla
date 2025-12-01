import { act, renderHook } from "@testing-library/react";
import type { Trip } from "@/lib/core/types";
import useTripPublishing from "../useTripPublishing";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import { exportTripToPdf, canExportToPdf } from "@/lib/utils/export-helpers";

jest.mock("@/lib/api/helpers", () => ({
	makeAuthenticatedRequest: jest.fn(),
}));

jest.mock("@/lib/utils/export-helpers", () => ({
	exportTripToPdf: jest.fn(),
	canExportToPdf: jest.fn(),
}));

jest.mock("@/lib/core/logger", () => ({
	error: jest.fn(),
	info: jest.fn(),
	debug: jest.fn(),
}));

jest.mock("@/lib/contexts/notification", () => ({
	useNotification: () => ({
		showNotification: jest.fn(),
		showSuccess: jest.fn(),
		showWarning: jest.fn(),
		showError: jest.fn(),
		showConfirm: jest.fn(),
	}),
	NotificationProvider: ({ children }: { children: React.ReactNode }) =>
		children,
}));

describe("useTripPublishing", () => {
	const mockRouter = { push: jest.fn(), replace: jest.fn() };
	const updateTrip = jest.fn();
	const refreshTrip = jest.fn();
	const mockUser: any = {
		uid: "user-1",
		getIdToken: jest.fn().mockResolvedValue("token-123"),
	};
	const baseTrip: Trip = {
		id: "trip-1",
		slug: "trip-slug",
		title: "Sample",
		user_id: "user-1",
		access_level: "public",
		status: "PLANNING",
	} as Trip;

	beforeEach(() => {
		jest.clearAllMocks();
		mockUser.getIdToken.mockResolvedValue("token-123");
		(window as any).alert = jest.fn();
	});

	it("publishes a trip and refreshes data", async () => {
		(makeAuthenticatedRequest as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ trip: { id: "trip-1", slug: "new-slug" } }),
		});
		(makeAuthenticatedRequest as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				id: "trip-1",
				slug: "new-slug",
				creator: { slug: "creator" },
			}),
		});

		const { result } = renderHook(() =>
			useTripPublishing({
				trip: baseTrip,
				user: mockUser,
				userData: { slug: "owner" },
				updateTrip,
				refreshTrip,
				router: mockRouter,
				userPlan: "backpacker",
			}),
		);

		await act(async () => {
			const success = await result.current.publish();
			expect(success).toBe(true);
		});

		expect(makeAuthenticatedRequest).toHaveBeenNthCalledWith(
			1,
			"/api/trip/trip-slug/publish",
			expect.objectContaining({ method: "POST" }),
		);
		expect(updateTrip).toHaveBeenCalled();
		expect(refreshTrip).toHaveBeenCalled();
		expect(mockRouter.replace).toHaveBeenCalledWith("/creator/new-slug");
	});

	it("replicates a trip and navigates to the new slug", async () => {
		(makeAuthenticatedRequest as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ trip: { id: "trip-2", slug: "replica-slug" } }),
		});

		const { result } = renderHook(() =>
			useTripPublishing({
				trip: baseTrip,
				user: mockUser,
				userData: { slug: "owner" },
				updateTrip,
				refreshTrip,
				router: mockRouter,
				userPlan: "backpacker",
			}),
		);

		await act(async () => {
			const success = await result.current.replicate("2025-01-01");
			expect(success).toBe(true);
		});

		expect(makeAuthenticatedRequest).toHaveBeenCalledWith(
			"/api/trip/trip-slug/replica",
			expect.objectContaining({ method: "POST" }),
		);
		expect(mockRouter.push).toHaveBeenCalledWith("/owner/replica-slug");
	});

	it("exports PDF when plan allows", async () => {
		(canExportToPdf as jest.Mock).mockReturnValue(true);

		const { result } = renderHook(() =>
			useTripPublishing({
				trip: baseTrip,
				user: mockUser,
				userData: { slug: "owner" },
				updateTrip,
				refreshTrip,
				router: mockRouter,
				userPlan: "backpacker",
			}),
		);

		await act(async () => {
			const success = await result.current.exportPdf();
			expect(success).toBe(true);
		});

		expect(exportTripToPdf).toHaveBeenCalledWith(
			"trip-slug",
			"token-123",
			expect.any(Function),
		);
	});
});
