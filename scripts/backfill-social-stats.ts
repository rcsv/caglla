/**
 * Tripドキュメントにsocial_statsフィールドをバックフィルするスクリプト
 *
 * Phase 1-2: Firestoreスキーマ拡張とセキュリティルール
 *
 * 使用方法:
 *   pnpm tsx scripts/backfill-social-stats.ts
 *
 * 注意:
 *   - 本番環境で実行する前に、必ず開発環境でテストしてください
 *   - 大量のデータがある場合、バッチ処理を使用してください
 *   - 実行前にFirestoreのバックアップを取ることを推奨します
 */

import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Trip } from "@/lib/core/types";
import type { TripSocialStats } from "@/lib/core/types/social";
import logger from "@/lib/core/logger";
import type { Firestore } from "firebase-admin/firestore";

// 環境変数がない場合でも動くように、遅延インポートを使用
let adminDb: Firestore | null = null;
function getAdminDb(): Firestore {
	if (!adminDb) {
		try {
			// 環境変数がある場合のみadminDbをインポート
			const adminModule = require("@/lib/firebase/admin");
			adminDb = adminModule.adminDb;
		} catch (error) {
			// テスト環境では環境変数がない場合があるため、エラーを無視
			throw new Error(
				"Firebase Admin SDK is not available. Provide a Firestore instance as the first parameter.",
			);
		}
	}
	return adminDb;
}

/**
 * デフォルトのsocial_stats値
 */
const DEFAULT_SOCIAL_STATS: TripSocialStats = {
	likes_count: 0,
	comments_count: 0,
	shares_count: 0,
	views_count: 0,
	replicas_count: 0,
};

/**
 * social_statsが完全かどうかをチェック
 *
 * @param stats social_statsオブジェクト（部分的な場合もある）
 * @returns 完全なsocial_statsの場合true
 */
export function hasCompleteSocialStats(
	stats: unknown,
): stats is TripSocialStats {
	if (typeof stats !== "object" || stats === null) {
		return false;
	}

	const s = stats as Record<string, unknown>;

	return (
		typeof s.likes_count === "number" &&
		typeof s.comments_count === "number" &&
		typeof s.shares_count === "number" &&
		typeof s.views_count === "number" &&
		typeof s.replicas_count === "number"
	);
}

/**
 * 不完全なsocial_statsを補完
 *
 * @param partialStats 部分的なsocial_stats
 * @returns 完全なsocial_stats
 */
export function completeSocialStats(partialStats: unknown): TripSocialStats {
	if (typeof partialStats !== "object" || partialStats === null) {
		return DEFAULT_SOCIAL_STATS;
	}

	const stats = partialStats as Record<string, unknown>;

	return {
		likes_count: typeof stats.likes_count === "number" ? stats.likes_count : 0,
		comments_count:
			typeof stats.comments_count === "number" ? stats.comments_count : 0,
		shares_count:
			typeof stats.shares_count === "number" ? stats.shares_count : 0,
		views_count: typeof stats.views_count === "number" ? stats.views_count : 0,
		replicas_count:
			typeof stats.replicas_count === "number" ? stats.replicas_count : 0,
	};
}

/**
 * Tripドキュメントにsocial_statsをバックフィル
 *
 * @param firestore Firestoreインスタンス（デフォルト: adminDb）
 * @param batchSize バッチサイズ（デフォルト: 500）
 * @param dryRun ドライランモード（実際には更新しない）
 * @returns 更新されたTripの数
 */
export async function backfillSocialStats(
	firestore?: Firestore,
	batchSize: number = 500,
	dryRun: boolean = false,
): Promise<number> {
	// デフォルトではadminDbを使用（エミュレータテストでは引数で渡される）
	const db = firestore || getAdminDb();
	logger.info("Starting social_stats backfill", { batchSize, dryRun });

	let updatedCount = 0;
	let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

	try {
		while (true) {
			// バッチでTripを取得
			let query = db.collection(COLLECTIONS.TRIPS).limit(batchSize);

			if (lastDoc) {
				query = query.startAfter(lastDoc);
			}

			const snapshot = await query.get();

			if (snapshot.empty) {
				break;
			}

			const batch = db.batch();
			let batchUpdatedCount = 0;

			snapshot.docs.forEach((doc) => {
				const trip = doc.data() as Trip;

				// social_statsが完全でない場合、更新が必要
				if (!hasCompleteSocialStats(trip.social_stats)) {
					const completeStats = completeSocialStats(trip.social_stats);

					if (!dryRun) {
						batch.update(doc.ref, {
							social_stats: completeStats,
							updated_at: new Date(),
						});
					}

					batchUpdatedCount++;
					updatedCount++;

					logger.debug("Updating trip", {
						tripId: doc.id,
						tripTitle: trip.title,
						socialStats: completeStats,
					});
				}
			});

			if (!dryRun && batchUpdatedCount > 0) {
				await batch.commit();
				logger.info("Batch committed", {
					batchUpdatedCount,
					totalUpdated: updatedCount,
				});
			} else if (dryRun && batchUpdatedCount > 0) {
				logger.info("Dry run - would update", {
					batchUpdatedCount,
					totalUpdated: updatedCount,
				});
			}

			// 次のバッチのために最後のドキュメントを保存
			lastDoc = snapshot.docs[snapshot.docs.length - 1];

			// バッチサイズ未満の場合は終了
			if (snapshot.docs.length < batchSize) {
				break;
			}
		}

		logger.info("Social stats backfill completed", {
			totalUpdated: updatedCount,
			dryRun,
		});

		return updatedCount;
	} catch (error) {
		logger.error("Error during social_stats backfill", error);
		throw error;
	}
}

/**
 * メイン実行関数
 */
async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes("--dry-run") || args.includes("-d");
	const batchSizeArg = args.find((arg) => arg.startsWith("--batch-size="));
	const batchSize = batchSizeArg
		? parseInt(batchSizeArg.split("=")[1], 10)
		: 500;

	if (dryRun) {
		logger.warn("Running in DRY RUN mode - no changes will be made");
	}

	try {
		const updatedCount = await backfillSocialStats(
			getAdminDb(),
			batchSize,
			dryRun,
		);

		if (dryRun) {
			logger.info(`Dry run completed: ${updatedCount} trips would be updated`);
		} else {
			logger.info(`Backfill completed: ${updatedCount} trips updated`);
		}

		process.exit(0);
	} catch (error) {
		logger.error("Backfill failed", error);
		process.exit(1);
	}
}

// スクリプトとして直接実行された場合
if (require.main === module) {
	void main();
}
