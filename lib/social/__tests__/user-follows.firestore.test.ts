/**
 * User Follows Social Operations のテスト
 *
 * Phase 1-4: Firestore操作関数（Social Operations）のテスト（テストファースト）
 *
 * 注意: これらのテストはFirestoreエミュレータを起動している必要があります。
 * エミュレータ起動: pnpm emulators:start:firestore
 */

import { createMockUser } from "@/lib/__tests__/helpers/test-auth";
import { getTestFirestore } from "@/lib/__tests__/helpers/test-firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Firestore } from "firebase-admin/firestore";
import type { UserFollow } from "@/lib/core/types/social";

// Phase 1-4で実装したSocial Operationsをインポート
import {
	followUser,
	unfollowUser,
	getFollowState,
	getFollowingList,
	getFollowersList,
} from "@/lib/social/user-follows";

describe("User Follows Social Operations", () => {
	let db: Firestore;
	let userId: string;
	let otherUserId: string;
	let thirdUserId: string;

	beforeAll(async () => {
		db = getTestFirestore();
	});

	beforeEach(async () => {
		// テストデータのクリーンアップ
		const followsSnapshot = await db.collection(COLLECTIONS.USER_FOLLOWS).get();
		const batch = db.batch();
		followsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
		await batch.commit();

		// テストデータのセットアップ
		userId = "user1";
		otherUserId = "user2";
		thirdUserId = "user3";
	});

	describe("followUser", () => {
		it("should allow user to follow another user", async () => {
			const follow = await followUser(userId, otherUserId, db);

			expect(follow.id).toBe(`${userId}_${otherUserId}`);
			expect(follow.follower_id).toBe(userId);
			expect(follow.following_id).toBe(otherUserId);

			// データベースにフォロー関係が追加されたことを確認
			const followRef = db.collection(COLLECTIONS.USER_FOLLOWS).doc(follow.id);
			const followDoc = await followRef.get();
			expect(followDoc.exists).toBe(true);
		});

		it("should deny following self", async () => {
			await expect(followUser(userId, userId, db)).rejects.toThrow("self");
		});

		it("should throw error when trying to follow already followed user", async () => {
			// 最初のフォロー
			const firstFollow = await followUser(userId, otherUserId, db);

			// 2回目のフォロー（既にフォローしている場合）
			// 実装により、エラーを投げる
			await expect(followUser(userId, otherUserId, db)).rejects.toThrow(
				"Already following",
			);
		});
	});

	describe("unfollowUser", () => {
		beforeEach(async () => {
			// テスト前にフォロー関係を作成
			await followUser(userId, otherUserId, db);
		});

		it("should allow user to unfollow another user", async () => {
			await unfollowUser(userId, otherUserId, db);

			// フォロー関係が削除されたことを確認
			const followRef = db
				.collection(COLLECTIONS.USER_FOLLOWS)
				.doc(`${userId}_${otherUserId}`);
			const followDoc = await followRef.get();
			expect(followDoc.exists).toBe(false);
		});

		it("should throw error when trying to unfollow non-existing follow relationship", async () => {
			// 既にフォロー関係が存在しない場合
			// 実装により、エラーを投げる
			await expect(unfollowUser(userId, thirdUserId, db)).rejects.toThrow(
				"Not following this user",
			);
		});
	});

	describe("getFollowState", () => {
		beforeEach(async () => {
			// テスト前にフォロー関係を作成
			await followUser(userId, otherUserId, db);
		});

		it("should return isFollowing=true if user is following", async () => {
			const state = await getFollowState(userId, otherUserId, db);

			expect(state.isFollowing).toBe(true);
		});

		it("should return isFollowing=false if user is not following", async () => {
			const state = await getFollowState(userId, thirdUserId, db);

			expect(state.isFollowing).toBe(false);
		});
	});

	describe("getFollowingList", () => {
		beforeEach(async () => {
			// テスト前に複数のフォロー関係を作成
			await followUser(userId, otherUserId, db);
			await followUser(userId, thirdUserId, db);
		});

		it("should return list of users that the user is following", async () => {
			const following = await getFollowingList(userId, undefined, db);

			expect(following.length).toBe(2);
			expect(following.some((f) => f.following_id === otherUserId)).toBe(true);
			expect(following.some((f) => f.following_id === thirdUserId)).toBe(true);
			expect(following.every((f) => f.follower_id === userId)).toBe(true);
		});

		it("should respect limit parameter", async () => {
			const following = await getFollowingList(userId, 1, db);

			expect(following.length).toBe(1);
		});

		it("should return empty list if user is not following anyone", async () => {
			const following = await getFollowingList(thirdUserId, undefined, db);

			expect(following.length).toBe(0);
		});
	});

	describe("getFollowersList", () => {
		beforeEach(async () => {
			// テスト前に複数のフォロー関係を作成
			await followUser(userId, otherUserId, db);
			await followUser(thirdUserId, otherUserId, db);
		});

		it("should return list of users that are following the user", async () => {
			const followers = await getFollowersList(otherUserId, undefined, db);

			expect(followers.length).toBe(2);
			expect(followers.some((f) => f.follower_id === userId)).toBe(true);
			expect(followers.some((f) => f.follower_id === thirdUserId)).toBe(true);
			expect(followers.every((f) => f.following_id === otherUserId)).toBe(true);
		});

		it("should respect limit parameter", async () => {
			const followers = await getFollowersList(otherUserId, 1, db);

			expect(followers.length).toBe(1);
		});

		it("should return empty list if user has no followers", async () => {
			const followers = await getFollowersList(thirdUserId, undefined, db);

			expect(followers.length).toBe(0);
		});
	});
});
