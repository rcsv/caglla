"use strict";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import MapDefault from "../default";
import { TripProvider } from "../../TripProvider";
import type { Trip } from "@/lib/core/types";

// Minimal Google Maps stub
// @ts-ignore
global.window.google = {
	maps: {
		Map: function () {
			return {};
		},
		Marker: function () {},
		Point: function () {},
		Animation: { DROP: 1 },
		DirectionsService: function () {},
		DirectionsRenderer: function () {},
		event: { addListener: () => {} },
	},
};

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
			const params = new URLSearchParams("");
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

jest.mock("@/components/trip/TripMap", () => ({
	__esModule: true,
	default: () => <div data-testid="trip-map" />,
}));

jest.mock("@/components/modals/POIDialog", () => ({
	__esModule: true,
	default: () => null,
}));

const mockTrip: Trip = {
	id: "trip1",
	slug: "tokyo-2025",
	title: "Tokyo Trip",
	user_id: "user1",
	access_level: "public",
	status: "PLANNING",
	destination_place: undefined,
	days: [
		{
			id: "day1",
			day_number: 1,
			itineraries: [
				{
					id: "it1",
					title: "Senso-ji",
					sort_number: 1,
					place_data: {
						place_id: "place1",
						name: "Senso-ji",
						geometry: { location: { lat: 35.714, lng: 139.796 } },
					},
				},
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

describe("@map default (read-only)", () => {
	it("renders TripMap container after fetching trip", async () => {
		// Provide required env vars to silence validation warnings in tests
		process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";
		process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "test-key";
		renderWithTripProvider(<MapDefault />);
		// 地図コンテナが存在すること（Loading表示の有無は実装に依存するため不問）
		await waitFor(() => {
			const container = document.querySelector(".h-full");
			expect(container).toBeTruthy();
		});
	});
});
