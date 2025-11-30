"use client";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SocialDefault from "../default";
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
	useAuth: () => ({
		user: { uid: "u1", getIdToken: async () => "token" },
		loading: false,
	}),
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

const mockTrip: Trip = {
	id: "trip1",
	slug: "tokyo-2025",
	title: "Tokyo Trip",
	user_id: "user1",
	access_level: "public",
	status: "PLANNING",
	social_stats: { likes_count: 5, comments_count: 2 },
} as Trip;

const renderWithTripProvider = (
	ui: React.ReactElement,
	tripOverrides: Partial<Trip> = {},
) =>
	render(
		<TripProvider trip={{ ...mockTrip, ...tripOverrides }}>{ui}</TripProvider>,
	);

jest.mock("@/lib/api/helpers", () => ({
	makeAuthenticatedRequest: jest.fn(async (url: string) => {
		if (url.endsWith("/likes")) {
			return {
				ok: true,
				json: async () => ({ likesCount: 5, likedByMe: true }),
			} as any;
		}
		if (url.includes("/api/trip/")) {
			return {
				ok: true,
				json: async () => mockTrip,
			} as any;
		}
		return { ok: true, json: async () => ({}) } as any;
	}),
}));

const mockFetch = jest.fn(async () => ({
	ok: true,
	json: async () => [],
}));

beforeAll(() => {
	global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
	mockFetch.mockClear();
});

describe("@social default", () => {
	it("renders LikeButton and CommentList after fetching trip and like state", async () => {
		renderWithTripProvider(<SocialDefault />);
		await waitFor(() => {
			// いいねボタンのカウント（5）がどこかに反映されていることを軽く検証
			expect(screen.getByText(/5/)).toBeInTheDocument();
		});
		// コメントリストのコンテナ（見出しやセクション）相当が描画されることを緩く確認
		// 具体テキストに依存しないため、存在検証に留める
		expect(document.querySelector(".p-4")).toBeTruthy();
	});
});
