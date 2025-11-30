#!/usr/bin/env tsx

/**
 * キャッシュマイグレーションのテストスクリプト
 *
 * 既存の旧形式キャッシュ（format_version: '1.0.0'）を新形式（format_version: '2.0.0'）に移行
 *
 * 実行方法:
 *   npx tsx scripts/test-cache-migration.ts --dry-run --limit 5
 */

import { db } from "../lib/firebase/admin";
import { COLLECTIONS } from "../lib/firebase/firestore";
import logger from "../lib/core/logger";

interface MigrationStats {
	total: number;
	migrated: number;
	skipped: number;
	errors: number;
	startTime: Date;
}

/**
 * コマンドライン引数をパース
 */
function parseArgs() {
	const args = process.argv.slice(2);
	const options = {
		dryRun: args.includes("--dry-run"),
		limit: 10, // デフォルト10件
		batchSize: 5,
	};

	const limitIndex = args.indexOf("--limit");
	if (limitIndex !== -1 && args[limitIndex + 1]) {
		options.limit = parseInt(args[limitIndex + 1], 10);
	}

	return options;
}

/**
 * 旧形式キャッシュを新形式に移行
 */
async function migrateCache(options: {
	dryRun: boolean;
	limit: number;
	batchSize: number;
}) {
	const stats: MigrationStats = {
		total: 0,
		migrated: 0,
		skipped: 0,
		errors: 0,
		startTime: new Date(),
	};

	try {
		logger.info("🚀 Starting cache migration...", { options });

		// 旧形式のキャッシュを取得（format_version: '1.0.0' または undefined）
		const snapshot = await db
			.collection(COLLECTIONS.PLACES_CACHE)
			.limit(options.limit)
			.get();

		logger.info(`📊 Found ${snapshot.size} documents to check`);

		for (const doc of snapshot.docs) {
			stats.total++;
			const data = doc.data();

			// 旧形式かどうかチェック
			const isOldFormat =
				!data.format_version || data.format_version === "1.0.0";
			const hasLanguage = !!data.language;

			logger.info(`📄 Document ${doc.id}:`, {
				format_version: data.format_version || "undefined",
				language: data.language || "undefined",
				isOldFormat,
				hasLanguage,
				name: data.name || "undefined",
			});

			if (!isOldFormat && hasLanguage) {
				logger.info(`✅ Document ${doc.id} is already in new format, skipping`);
				stats.skipped++;
				continue;
			}

			if (options.dryRun) {
				logger.info(`🔍 DRY RUN: Would migrate ${doc.id}`);
				stats.migrated++;
				continue;
			}

			try {
				// 新形式に移行
				const newData = {
					...data,
					format_version: "2.0.0",
					language: "ja", // 既存データは日本語として扱う
					migrated_at: new Date(),
				};

				// 新形式のドキュメントID: {place_id}_ja
				const newDocId = `${doc.id}_ja`;

				// 新ドキュメントを作成
				await db
					.collection(COLLECTIONS.PLACES_CACHE)
					.doc(newDocId)
					.set(newData);
				logger.info(`✅ Migrated ${doc.id} → ${newDocId}`);

				// 旧ドキュメントを削除
				await doc.ref.delete();
				logger.info(`🗑️ Deleted old document ${doc.id}`);

				stats.migrated++;
			} catch (error) {
				logger.error(`❌ Failed to migrate ${doc.id}:`, error);
				stats.errors++;
			}
		}
	} catch (error) {
		logger.error("❌ Migration failed:", error);
		throw error;
	}

	return stats;
}

/**
 * メイン実行
 */
async function main() {
	const options = parseArgs();

	logger.info("🧪 Cache Migration Test", {
		dryRun: options.dryRun,
		limit: options.limit,
		batchSize: options.batchSize,
	});

	try {
		const stats = await migrateCache(options);

		const duration = Date.now() - stats.startTime.getTime();

		logger.info("📊 Migration completed:", {
			total: stats.total,
			migrated: stats.migrated,
			skipped: stats.skipped,
			errors: stats.errors,
			duration: `${duration}ms`,
		});

		if (options.dryRun) {
			logger.info(
				"🔍 This was a dry run. Use without --dry-run to actually migrate.",
			);
		}
	} catch (error) {
		logger.error("❌ Migration failed:", error);
		process.exit(1);
	}
}

// 実行
if (require.main === module) {
	main();
}

export { migrateCache };
