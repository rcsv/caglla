#!/usr/bin/env ts-node

/**
 * 旅行データの user_id を移行するスクリプト
 *
 * trip.user_id を google_id から users コレクションのドキュメントIDに変更します。
 *
 * 使用方法:
 *   ts-node scripts/migrate-trip-user-ids.ts
 *   または
 *   pnpm migrate-trip-user-ids
 *
 * 環境変数:
 *   - FIREBASE_PROJECT_ID: Firebase プロジェクトID
 *   - FIREBASE_CLIENT_EMAIL: Firebase Admin SDK のクライアントメール
 *   - FIREBASE_PRIVATE_KEY: Firebase Admin SDK の秘密鍵
 */

// 環境変数を読み込む
import dotenv from "dotenv";
import { resolve } from "path";

// .env.local ファイルを優先的に読み込む
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
// .env.local がない場合は .env を読み込む
dotenv.config({ path: resolve(process.cwd(), ".env") });

import { adminDb } from "@/lib/firebase/admin";
import { adminUserOperations } from "@/lib/firebase/admin-operation";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import logger from "@/lib/core/logger";
import type { Trip, User } from "@/lib/core/types";

/**
 * メイン処理
 */
async function main() {
	try {
		logger.info("🚀 Starting trip user_id migration...");

		// 全旅行を取得
		const tripsSnapshot = await adminDb.collection(COLLECTIONS.TRIPS).get();
		logger.info(`Found ${tripsSnapshot.docs.length} trips to process`);

		let migratedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;
		const errors: Array<{ tripId: string; error: string }> = [];

		// ユーザーマッピングをキャッシュ（google_id -> users.id）
		const userMappingCache = new Map<string, string>();

		for (const tripDoc of tripsSnapshot.docs) {
			const trip = { id: tripDoc.id, ...tripDoc.data() } as Trip;
			const currentUserId = trip.user_id;

			try {
				// 既に users コレクションのドキュメントIDかどうかを確認
				// users コレクションに存在するかチェック
				const userDoc = await adminDb
					.collection(COLLECTIONS.USERS)
					.doc(currentUserId)
					.get();

				if (userDoc.exists) {
					// 既に users コレクションのドキュメントIDの場合はスキップ
					logger.debug(
						`Trip ${trip.id} already uses user document ID, skipping`,
						{ userId: currentUserId },
					);
					skippedCount++;
					continue;
				}

				// google_id の可能性があるので、ユーザーを検索
				let userDocumentId: string | null = null;

				// キャッシュをチェック
				if (userMappingCache.has(currentUserId)) {
					userDocumentId = userMappingCache.get(currentUserId)!;
				} else {
					// auth_uid で検索（google_id も含む）
					const user =
						await adminUserOperations.getUserByAuthUid(currentUserId);
					if (user) {
						userDocumentId = user.id;
						userMappingCache.set(currentUserId, userDocumentId);
					}
				}

				if (!userDocumentId) {
					logger.warn(`User not found for trip ${trip.id}`, {
						userId: currentUserId,
					});
					errorCount++;
					errors.push({
						tripId: trip.id,
						error: `User not found: ${currentUserId}`,
					});
					continue;
				}

				// user_id を更新
				await adminDb.collection(COLLECTIONS.TRIPS).doc(trip.id).update({
					user_id: userDocumentId,
					updated_at: new Date(),
				});

				migratedCount++;
				logger.info(`✅ Migrated trip ${trip.id}`, {
					oldUserId: currentUserId,
					newUserId: userDocumentId,
					tripTitle: trip.title,
				});
			} catch (error) {
				logger.error(`❌ Error migrating trip ${trip.id}`, {
					error,
					userId: currentUserId,
				});
				errorCount++;
				errors.push({
					tripId: trip.id,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		logger.info("🎉 Migration completed!");
		logger.info("Summary:", {
			total: tripsSnapshot.docs.length,
			migrated: migratedCount,
			skipped: skippedCount,
			errors: errorCount,
		});

		if (errors.length > 0) {
			logger.warn("Errors encountered:", { errors });
		}
	} catch (error) {
		logger.error("❌ Migration failed:", error);
		throw error;
	}
}

// スクリプト実行
main()
	.then(() => {
		logger.info("✅ Script completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		logger.error("❌ Script failed:", error);
		process.exit(1);
	});
