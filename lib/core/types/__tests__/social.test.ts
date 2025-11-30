/**
 * Social Types Definitions テスト
 *
 * Phase 1-3: 型定義の整合性を検証
 * - TripLike型の必須フィールド・オプショナルフィールドの検証
 * - TripComment型の必須フィールド・オプショナルフィールドの検証
 * - TripShare型の必須フィールド・オプショナルフィールドの検証
 * - TripSocialStats型の検証
 * - UserFollow型の検証
 * - 実際の使用パターンとの整合性検証
 * - 型ガード関数の検証
 */

import type {
	TripLike,
	TripComment,
	TripShare,
	TripSocialStats,
	UserFollow,
} from "../social";
import {
	isTripLike,
	isTripComment,
	isTripShare,
	isTripSocialStats,
	isUserFollow,
} from "../social";
import type { FirestoreDate } from "../common";

describe("Social Type Definitions", () => {
	describe("TripLike Interface", () => {
		it("should have required fields", () => {
			const like: TripLike = {
				id: "user1_trip1",
				trip_id: "trip1",
				user_id: "user1",
				created_at: new Date(),
			};

			expect(like.id).toBe("user1_trip1");
			expect(like.trip_id).toBe("trip1");
			expect(like.user_id).toBe("user1");
			expect(like.created_at).toBeInstanceOf(Date);
		});

		it("should support id format: {userId}_{tripId}", () => {
			const userId = "user123";
			const tripId = "trip456";
			const like: TripLike = {
				id: `${userId}_${tripId}`,
				trip_id: tripId,
				user_id: userId,
				created_at: new Date(),
			};

			expect(like.id).toBe("user123_trip456");
			expect(like.trip_id).toBe("trip456");
			expect(like.user_id).toBe("user123");
		});

		it("should support FirestoreDate type for created_at", () => {
			// Date型
			const like1: TripLike = {
				id: "user1_trip1",
				trip_id: "trip1",
				user_id: "user1",
				created_at: new Date("2024-01-01"),
			};
			expect(like1.created_at).toBeInstanceOf(Date);

			// string型（FirestoreDateとして許可）
			const like2: TripLike = {
				id: "user1_trip1",
				trip_id: "trip1",
				user_id: "user1",
				created_at: "2024-01-01",
			};
			expect(typeof like2.created_at).toBe("string");
		});

		it("should match actual usage pattern from trip-likes.ts", () => {
			// 実際のコードパターン: tx.set(likeRef, { trip_id, user_id, created_at })
			const actualUsage: Omit<TripLike, "id"> = {
				trip_id: "trip123",
				user_id: "user456",
				created_at: new Date(),
			};

			// idを含む完全なTripLikeオブジェクト
			const fullLike: TripLike = {
				id: `${actualUsage.user_id}_${actualUsage.trip_id}`,
				...actualUsage,
			};

			expect(fullLike.id).toBe("user456_trip123");
			expect(fullLike.trip_id).toBe("trip123");
			expect(fullLike.user_id).toBe("user456");
			expect(fullLike.created_at).toBeInstanceOf(Date);
		});
	});

	describe("TripComment Interface", () => {
		it("should have required fields", () => {
			const comment: TripComment = {
				id: "comment1",
				trip_id: "trip1",
				user_id: "user1",
				user_name: "User Name",
				content: "Comment content",
				deleted: false,
				created_at: new Date(),
			};

			expect(comment.id).toBe("comment1");
			expect(comment.trip_id).toBe("trip1");
			expect(comment.user_id).toBe("user1");
			expect(comment.user_name).toBe("User Name");
			expect(comment.content).toBe("Comment content");
			expect(comment.deleted).toBe(false);
			expect(comment.created_at).toBeInstanceOf(Date);
		});

		it("should support optional fields", () => {
			const comment: TripComment = {
				id: "comment2",
				trip_id: "trip1",
				user_id: "user1",
				user_name: "User Name",
				user_avatar: "https://example.com/avatar.jpg",
				content: "Comment with avatar",
				parent_comment_id: "parent-comment-1",
				deleted: false,
				created_at: new Date("2024-01-01"),
				updated_at: new Date("2024-01-02"),
			};

			expect(comment.user_avatar).toBe("https://example.com/avatar.jpg");
			expect(comment.parent_comment_id).toBe("parent-comment-1");
			expect(comment.updated_at).toBeInstanceOf(Date);
		});

		it("should support nested comments (parent_comment_id)", () => {
			// 親コメント
			const parentComment: TripComment = {
				id: "parent-comment-1",
				trip_id: "trip1",
				user_id: "user1",
				user_name: "Parent User",
				content: "Parent comment",
				deleted: false,
				created_at: new Date(),
			};

			// 子コメント（ネストコメント）
			const childComment: TripComment = {
				id: "child-comment-1",
				trip_id: "trip1",
				user_id: "user2",
				user_name: "Child User",
				content: "Reply to parent",
				parent_comment_id: parentComment.id,
				deleted: false,
				created_at: new Date(),
			};

			expect(childComment.parent_comment_id).toBe("parent-comment-1");
			expect(childComment.trip_id).toBe(parentComment.trip_id);
		});

		it("should support logical deletion (deleted flag)", () => {
			const comment: TripComment = {
				id: "comment-deleted",
				trip_id: "trip1",
				user_id: "user1",
				user_name: "User Name",
				content: "This comment is deleted",
				deleted: true,
				created_at: new Date(),
			};

			expect(comment.deleted).toBe(true);
			// 削除されたコメントでもcontentは残る（論理削除）
			expect(comment.content).toBe("This comment is deleted");
		});

		it("should support FirestoreDate type for created_at and updated_at", () => {
			// Date型
			const comment1: TripComment = {
				id: "comment1",
				trip_id: "trip1",
				user_id: "user1",
				user_name: "User Name",
				content: "Comment",
				deleted: false,
				created_at: new Date("2024-01-01"),
				updated_at: new Date("2024-01-02"),
			};
			expect(comment1.created_at).toBeInstanceOf(Date);
			expect(comment1.updated_at).toBeInstanceOf(Date);

			// string型（FirestoreDateとして許可）
			const comment2: TripComment = {
				id: "comment2",
				trip_id: "trip1",
				user_id: "user1",
				user_name: "User Name",
				content: "Comment",
				deleted: false,
				created_at: "2024-01-01",
			};
			expect(typeof comment2.created_at).toBe("string");
			expect(comment2.updated_at).toBeUndefined();
		});

		it("should match actual usage pattern from trip-comments.ts", () => {
			// 実際のコードパターン: commentData の構造
			const userId = "user123";
			const userName = "User Name";
			const userAvatar = "https://example.com/avatar.jpg";
			const tripId = "trip456";
			const content = "Comment content";
			const parentCommentId = "parent-comment-1";

			// 実際のコードで作成されるコメントデータ構造
			const actualUsage: Omit<TripComment, "id"> & {
				user_avatar?: string;
				parent_comment_id?: string;
			} = {
				trip_id: tripId,
				user_id: userId,
				user_name: userName,
				user_avatar: userAvatar,
				content: content.trim(),
				parent_comment_id: parentCommentId,
				created_at: new Date(),
				updated_at: new Date(),
				deleted: false,
			};

			// idを含む完全なTripCommentオブジェクト
			const fullComment: TripComment = {
				id: "comment-id-123",
				...actualUsage,
			};

			expect(fullComment.trip_id).toBe(tripId);
			expect(fullComment.user_id).toBe(userId);
			expect(fullComment.user_name).toBe(userName);
			expect(fullComment.user_avatar).toBe(userAvatar);
			expect(fullComment.content).toBe(content.trim());
			expect(fullComment.parent_comment_id).toBe(parentCommentId);
			expect(fullComment.deleted).toBe(false);
			expect(fullComment.created_at).toBeInstanceOf(Date);
			expect(fullComment.updated_at).toBeInstanceOf(Date);
		});
	});

	describe("TripSocialStats Interface", () => {
		it("should have all required numeric fields", () => {
			const stats: TripSocialStats = {
				likes_count: 10,
				comments_count: 5,
				shares_count: 3,
				views_count: 100,
				replicas_count: 2,
			};

			expect(stats.likes_count).toBe(10);
			expect(stats.comments_count).toBe(5);
			expect(stats.shares_count).toBe(3);
			expect(stats.views_count).toBe(100);
			expect(stats.replicas_count).toBe(2);
		});

		it("should support zero values", () => {
			const stats: TripSocialStats = {
				likes_count: 0,
				comments_count: 0,
				shares_count: 0,
				views_count: 0,
				replicas_count: 0,
			};

			expect(stats.likes_count).toBe(0);
			expect(stats.comments_count).toBe(0);
			expect(stats.shares_count).toBe(0);
			expect(stats.views_count).toBe(0);
			expect(stats.replicas_count).toBe(0);
		});

		it("should support large numbers", () => {
			const stats: TripSocialStats = {
				likes_count: 1000000,
				comments_count: 50000,
				shares_count: 10000,
				views_count: 5000000,
				replicas_count: 5000,
			};

			expect(stats.likes_count).toBe(1000000);
			expect(stats.comments_count).toBe(50000);
			expect(stats.shares_count).toBe(10000);
			expect(stats.views_count).toBe(5000000);
			expect(stats.replicas_count).toBe(5000);
		});

		it("should match actual usage pattern from trip-likes.ts", () => {
			// 実際のコードパターン: social_statsの初期化
			const actualUsage: TripSocialStats = {
				likes_count: 0,
				comments_count: 0,
				shares_count: 0,
				views_count: 0,
				replicas_count: 0,
			};

			expect(actualUsage.likes_count).toBe(0);
			expect(actualUsage.comments_count).toBe(0);
			expect(actualUsage.shares_count).toBe(0);
			expect(actualUsage.views_count).toBe(0);
			expect(actualUsage.replicas_count).toBe(0);
		});
	});

	describe("TripShare Interface", () => {
		it("should have required fields", () => {
			const share: TripShare = {
				id: "user1_trip1",
				trip_id: "trip1",
				user_id: "user1",
				created_at: new Date(),
			};

			expect(share.id).toBe("user1_trip1");
			expect(share.trip_id).toBe("trip1");
			expect(share.user_id).toBe("user1");
			expect(share.created_at).toBeInstanceOf(Date);
		});

		it("should support id format: {userId}_{tripId}", () => {
			const userId = "user123";
			const tripId = "trip456";
			const share: TripShare = {
				id: `${userId}_${tripId}`,
				trip_id: tripId,
				user_id: userId,
				created_at: new Date(),
			};

			expect(share.id).toBe("user123_trip456");
			expect(share.trip_id).toBe("trip456");
			expect(share.user_id).toBe("user123");
		});

		it("should support FirestoreDate type for created_at", () => {
			// Date型
			const share1: TripShare = {
				id: "user1_trip1",
				trip_id: "trip1",
				user_id: "user1",
				created_at: new Date("2024-01-01"),
			};
			expect(share1.created_at).toBeInstanceOf(Date);

			// string型（FirestoreDateとして許可）
			const share2: TripShare = {
				id: "user1_trip1",
				trip_id: "trip1",
				user_id: "user1",
				created_at: "2024-01-01",
			};
			expect(typeof share2.created_at).toBe("string");
		});

		it("should match actual usage pattern from trip-shares.ts", () => {
			// 実際のコードパターン: tx.set(shareRef, { trip_id, user_id, created_at })
			const actualUsage: Omit<TripShare, "id"> = {
				trip_id: "trip123",
				user_id: "user456",
				created_at: new Date(),
			};

			// idを含む完全なTripShareオブジェクト
			const fullShare: TripShare = {
				id: `${actualUsage.user_id}_${actualUsage.trip_id}`,
				...actualUsage,
			};

			expect(fullShare.id).toBe("user456_trip123");
			expect(fullShare.trip_id).toBe("trip123");
			expect(fullShare.user_id).toBe("user456");
			expect(fullShare.created_at).toBeInstanceOf(Date);
		});
	});

	describe("UserFollow Interface", () => {
		it("should have required fields", () => {
			const follow: UserFollow = {
				id: "follower1_following1",
				follower_id: "follower1",
				following_id: "following1",
				created_at: new Date(),
			};

			expect(follow.id).toBe("follower1_following1");
			expect(follow.follower_id).toBe("follower1");
			expect(follow.following_id).toBe("following1");
			expect(follow.created_at).toBeInstanceOf(Date);
		});

		it("should support id format: {followerId}_{followingId}", () => {
			const followerId = "user123";
			const followingId = "user456";
			const follow: UserFollow = {
				id: `${followerId}_${followingId}`,
				follower_id: followerId,
				following_id: followingId,
				created_at: new Date(),
			};

			expect(follow.id).toBe("user123_user456");
			expect(follow.follower_id).toBe("user123");
			expect(follow.following_id).toBe("user456");
		});

		it("should support FirestoreDate type for created_at", () => {
			// Date型
			const follow1: UserFollow = {
				id: "user1_user2",
				follower_id: "user1",
				following_id: "user2",
				created_at: new Date("2024-01-01"),
			};
			expect(follow1.created_at).toBeInstanceOf(Date);

			// string型（FirestoreDateとして許可）
			const follow2: UserFollow = {
				id: "user1_user2",
				follower_id: "user1",
				following_id: "user2",
				created_at: "2024-01-01",
			};
			expect(typeof follow2.created_at).toBe("string");
		});
	});

	describe("Type Guards", () => {
		describe("isTripLike", () => {
			it("should return true for valid TripLike", () => {
				const valid: TripLike = {
					id: "user1_trip1",
					trip_id: "trip1",
					user_id: "user1",
					created_at: new Date(),
				};

				expect(isTripLike(valid)).toBe(true);
			});

			it("should return false for invalid TripLike", () => {
				expect(isTripLike(null)).toBe(false);
				expect(isTripLike(undefined)).toBe(false);
				expect(isTripLike({})).toBe(false);
				expect(isTripLike({ id: "test" })).toBe(false);
				expect(isTripLike({ id: "test", trip_id: "test" })).toBe(false);
			});

			it("should handle Date and string types for created_at", () => {
				const withDate: TripLike = {
					id: "user1_trip1",
					trip_id: "trip1",
					user_id: "user1",
					created_at: new Date(),
				};

				const withString: TripLike = {
					id: "user1_trip1",
					trip_id: "trip1",
					user_id: "user1",
					created_at: "2024-01-01",
				};

				expect(isTripLike(withDate)).toBe(true);
				expect(isTripLike(withString)).toBe(true);
			});
		});

		describe("isTripComment", () => {
			it("should return true for valid TripComment", () => {
				const valid: TripComment = {
					id: "comment1",
					trip_id: "trip1",
					user_id: "user1",
					user_name: "User Name",
					content: "Comment",
					deleted: false,
					created_at: new Date(),
				};

				expect(isTripComment(valid)).toBe(true);
			});

			it("should return false for invalid TripComment", () => {
				expect(isTripComment(null)).toBe(false);
				expect(isTripComment(undefined)).toBe(false);
				expect(isTripComment({})).toBe(false);
				expect(isTripComment({ id: "test" })).toBe(false);
				expect(
					isTripComment({ id: "test", trip_id: "test", user_id: "test" }),
				).toBe(false);
				// user_nameが欠けている
				expect(
					isTripComment({
						id: "test",
						trip_id: "test",
						user_id: "test",
						content: "test",
						deleted: false,
						created_at: new Date(),
					}),
				).toBe(false);
			});

			it("should handle Date and string types for created_at", () => {
				const withDate: TripComment = {
					id: "comment1",
					trip_id: "trip1",
					user_id: "user1",
					user_name: "User Name",
					content: "Comment",
					deleted: false,
					created_at: new Date(),
				};

				const withString: TripComment = {
					id: "comment1",
					trip_id: "trip1",
					user_id: "user1",
					user_name: "User Name",
					content: "Comment",
					deleted: false,
					created_at: "2024-01-01",
				};

				expect(isTripComment(withDate)).toBe(true);
				expect(isTripComment(withString)).toBe(true);
			});
		});

		describe("isTripShare", () => {
			it("should return true for valid TripShare", () => {
				const valid: TripShare = {
					id: "user1_trip1",
					trip_id: "trip1",
					user_id: "user1",
					created_at: new Date(),
				};

				expect(isTripShare(valid)).toBe(true);
			});

			it("should return false for invalid TripShare", () => {
				expect(isTripShare(null)).toBe(false);
				expect(isTripShare(undefined)).toBe(false);
				expect(isTripShare({})).toBe(false);
				expect(isTripShare({ id: "test" })).toBe(false);
				expect(isTripShare({ id: "test", trip_id: "test" })).toBe(false);
			});

			it("should handle Date and string types for created_at", () => {
				const withDate: TripShare = {
					id: "user1_trip1",
					trip_id: "trip1",
					user_id: "user1",
					created_at: new Date(),
				};

				const withString: TripShare = {
					id: "user1_trip1",
					trip_id: "trip1",
					user_id: "user1",
					created_at: "2024-01-01",
				};

				expect(isTripShare(withDate)).toBe(true);
				expect(isTripShare(withString)).toBe(true);
			});
		});

		describe("isTripSocialStats", () => {
			it("should return true for valid TripSocialStats", () => {
				const valid: TripSocialStats = {
					likes_count: 10,
					comments_count: 5,
					shares_count: 3,
					views_count: 100,
					replicas_count: 2,
				};

				expect(isTripSocialStats(valid)).toBe(true);
			});

			it("should return false for invalid TripSocialStats", () => {
				expect(isTripSocialStats(null)).toBe(false);
				expect(isTripSocialStats(undefined)).toBe(false);
				expect(isTripSocialStats({})).toBe(false);
				expect(isTripSocialStats({ likes_count: 10 })).toBe(false);
				// 数値以外の型
				expect(
					isTripSocialStats({
						likes_count: "10",
						comments_count: 5,
						shares_count: 3,
						views_count: 100,
						replicas_count: 2,
					}),
				).toBe(false);
			});
		});

		describe("isUserFollow", () => {
			it("should return true for valid UserFollow", () => {
				const valid: UserFollow = {
					id: "follower1_following1",
					follower_id: "follower1",
					following_id: "following1",
					created_at: new Date(),
				};

				expect(isUserFollow(valid)).toBe(true);
			});

			it("should return false for invalid UserFollow", () => {
				expect(isUserFollow(null)).toBe(false);
				expect(isUserFollow(undefined)).toBe(false);
				expect(isUserFollow({})).toBe(false);
				expect(isUserFollow({ id: "test" })).toBe(false);
			});

			it("should handle Date and string types for created_at", () => {
				const withDate: UserFollow = {
					id: "user1_user2",
					follower_id: "user1",
					following_id: "user2",
					created_at: new Date(),
				};

				const withString: UserFollow = {
					id: "user1_user2",
					follower_id: "user1",
					following_id: "user2",
					created_at: "2024-01-01",
				};

				expect(isUserFollow(withDate)).toBe(true);
				expect(isUserFollow(withString)).toBe(true);
			});
		});
	});

	describe("Edge Cases", () => {
		it("should handle undefined optional fields in TripComment", () => {
			const comment: TripComment = {
				id: "comment1",
				trip_id: "trip1",
				user_id: "user1",
				user_name: "User Name",
				content: "Comment",
				deleted: false,
				created_at: new Date(),
				// オプショナルフィールドは未定義でも問題ない
			};

			expect(comment.user_avatar).toBeUndefined();
			expect(comment.parent_comment_id).toBeUndefined();
			expect(comment.updated_at).toBeUndefined();
		});

		it("should handle empty content in TripComment", () => {
			const comment: TripComment = {
				id: "comment1",
				trip_id: "trip1",
				user_id: "user1",
				user_name: "User Name",
				content: "",
				deleted: false,
				created_at: new Date(),
			};

			expect(comment.content).toBe("");
		});

		it("should handle long content in TripComment", () => {
			const longContent = "A".repeat(1000);
			const comment: TripComment = {
				id: "comment1",
				trip_id: "trip1",
				user_id: "user1",
				user_name: "User Name",
				content: longContent,
				deleted: false,
				created_at: new Date(),
			};

			expect(comment.content.length).toBe(1000);
			expect(comment.content).toBe(longContent);
		});
	});
});
