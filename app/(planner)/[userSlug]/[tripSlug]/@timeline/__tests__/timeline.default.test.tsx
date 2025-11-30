import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import TimelineDefault from "../default";
import { TripProvider } from "../../TripProvider";
import type { Trip } from "@/lib/core/types";

jest.mock("next/navigation", () => {
	const actual = jest.requireActual("next/navigation");
	return {
		...actual,
		useParams: () => ({ userSlug: "alice", tripSlug: "tokyo-2025" }),
		useRouter: () => ({
			push: jest.fn(),
			replace: jest.fn(),
			prefetch: jest.fn(),
		}),
		useSearchParams: () => {
			const params = new URLSearchParams("view=itinerary");
			return {
				get: (key: string) => params.get(key),
				toString: () => params.toString(),
				entries: () => params.entries(),
				forEach: (cb: any) => params.forEach(cb as any),
				keys: () => params.keys(),
				values: () => params.values(),
				has: (key: string) => params.has(key),
			} as any;
		},
	};
});

jest.mock("@/lib/contexts/auth", () => ({
	useAuth: () => ({ user: null, loading: false }),
}));

jest.mock("@/lib/contexts/user-data", () => ({
	useUserData: () => ({
		userData: null,
		userDataLoading: false,
		userDataError: null,
		planConfig: {},
		planLoading: false,
		planError: null,
		trips: [],
		tripsLoading: false,
		tripsError: null,
		tripCount: 0,
		privateTripCount: 0,
		refreshUserData: jest.fn(),
		refreshUserPlan: jest.fn(),
		refreshTrips: jest.fn(),
		addTrip: jest.fn(),
		updateTrip: jest.fn(),
		removeTrip: jest.fn(),
	}),
}));

jest.mock("@/lib/contexts/subscription", () => ({
	useSubscription: () => ({
		subscriptionStatus: { plan: { id: "season_traveler" } },
		refreshSubscription: jest.fn(),
	}),
}));

const mockTrip: Trip = {
	id: "trip1",
	slug: "tokyo-2025",
	title: "Tokyo Trip",
	user_id: "user1",
	access_level: "public",
	status: "PLANNING",
	days: [
		{
			id: "day1",
			day_number: 1,
			itineraries: [
				{ id: "it1", title: "Senso-ji", sort_number: 1 },
				{ id: "it2", title: "Skytree", sort_number: 2 },
			],
		},
	],
} as Trip;

const renderWithTripProvider = (
	ui: React.ReactElement,
	tripOverrides: Partial<Trip> = {},
) =>
	render(
		<TripProvider trip={{ ...mockTrip, ...tripOverrides }}>{ui}</TripProvider>,
	);

const mockFetch = jest.fn(async () => ({
	ok: true,
	json: async () => ({ likesCount: 0, likedByMe: false }),
}));

beforeAll(() => {
	global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
	mockFetch.mockClear();
});

describe("@timeline default (read-only)", () => {
	it("renders TripItineraryView after fetching trip", async () => {
		renderWithTripProvider(<TimelineDefault />);
		// Loading disappears and itinerary items are rendered
		await waitFor(() => {
			expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
		});
		// Expect at least one itinerary title visible
		expect(screen.getByText("Senso-ji")).toBeInTheDocument();
		expect(screen.getByText("Skytree")).toBeInTheDocument();
	});
});
