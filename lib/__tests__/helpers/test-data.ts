/**
 * テストデータファクトリー
 *
 * テスト用のモックデータを生成するためのファクトリー関数を提供します。
 */

import type { Trip, Day, Itinerary } from "@/lib/core/types/trip";
import type { User } from "@/lib/core/types/user";
import { createMockUser, type MockUser } from "./test-auth";

/**
 * テスト用のTripデータを作成
 *
 * @param overrides 上書きするプロパティ
 * @returns モックTripデータ
 */
export function createMockTrip(overrides?: Partial<Trip>): Trip {
	// v3.0.0のsocial_statsはまだ型定義に追加されていないため、オプショナルとして扱う
	const defaultTrip: Trip & {
		social_stats?: {
			likes_count: number;
			comments_count: number;
			shares_count: number;
			views_count: number;
			replicas_count: number;
		};
	} = {
		id: "test-trip-1",
		user_id: "test-user-1",
		title: "Test Trip",
		slug: "test-trip",
		destination: "Tokyo",
		access_level: "private",
		is_template: false,
		status: "PLANNING",
		social_stats: {
			likes_count: 0,
			comments_count: 0,
			shares_count: 0,
			views_count: 0,
			replicas_count: 0,
		},
		created_at: new Date(),
		updated_at: new Date(),
	};

	return { ...defaultTrip, ...overrides };
}

/**
 * テスト用のPublic Tripデータを作成
 *
 * @param overrides 上書きするプロパティ
 * @returns モックPublic Tripデータ
 */
export function createMockPublicTrip(overrides?: Partial<Trip>): Trip {
	return createMockTrip({
		access_level: "public",
		...overrides,
	});
}

/**
 * テスト用のTemplate Tripデータを作成
 *
 * @param overrides 上書きするプロパティ
 * @returns モックTemplate Tripデータ
 */
export function createMockTemplateTrip(overrides?: Partial<Trip>): Trip {
	return createMockTrip({
		is_template: true,
		day_count: 5,
		access_level: "public",
		...overrides,
	});
}

/**
 * テスト用のDayデータを作成
 *
 * @param tripId トリップID
 * @param overrides 上書きするプロパティ
 * @returns モックDayデータ
 */
export function createMockDay(
	tripId: string = "test-trip-1",
	overrides?: Partial<Day>,
): Day {
	const defaultDay: Day = {
		id: `test-day-${Date.now()}`,
		trip_id: tripId,
		day_number: 1,
		date: new Date(),
		created_at: new Date(),
		updated_at: new Date(),
	};

	return { ...defaultDay, ...overrides };
}

/**
 * テスト用のItineraryデータを作成
 *
 * @param dayId デイID
 * @param overrides 上書きするプロパティ
 * @returns モックItineraryデータ
 */
export function createMockItinerary(
	dayId: string = "test-day-1",
	overrides?: Partial<Itinerary>,
): Itinerary {
	const defaultItinerary: Itinerary = {
		id: `test-itinerary-${Date.now()}`,
		day_id: dayId,
		trip_id: "test-trip-1",
		title: "Test Itinerary",
		sort_number: 1,
		created_at: new Date(),
		updated_at: new Date(),
	};

	return { ...defaultItinerary, ...overrides };
}

/**
 * テスト用のUserデータを作成
 *
 * @param overrides 上書きするプロパティ
 * @returns モックUserデータ
 */
export function createMockUserData(overrides?: Partial<User>): User {
	const mockUser = createMockUser();

	const defaultUser: User = {
		id: mockUser.uid,
		email: mockUser.email,
		name: mockUser.displayName,
		photo_url: mockUser.photoURL,
		created_at: new Date(),
		updated_at: new Date(),
	};

	return { ...defaultUser, ...overrides };
}

/**
 * 複数のテスト用Tripデータを作成
 *
 * @param count 作成するトリップ数
 * @param overrides 各トリップに適用する上書きプロパティ
 * @returns モックTrip配列
 */
export function createMockTrips(
	count: number,
	overrides?: Partial<Trip>,
): Trip[] {
	return Array.from({ length: count }, (_, index) =>
		createMockTrip({
			id: `test-trip-${index + 1}`,
			slug: `test-trip-${index + 1}`,
			title: `Test Trip ${index + 1}`,
			...overrides,
		}),
	);
}

/**
 * テスト用のソーシャル統計データを作成
 *
 * @param overrides 上書きするプロパティ
 * @returns モックソーシャル統計データ
 */
export function createMockSocialStats(overrides?: {
	likes_count?: number;
	comments_count?: number;
	shares_count?: number;
	views_count?: number;
	replicas_count?: number;
}): {
	likes_count: number;
	comments_count: number;
	shares_count: number;
	views_count: number;
	replicas_count: number;
} {
	return {
		likes_count: 0,
		comments_count: 0,
		shares_count: 0,
		views_count: 0,
		replicas_count: 0,
		...overrides,
	};
}
