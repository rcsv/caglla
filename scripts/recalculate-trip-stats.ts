/**
 * Tripドキュメントの stats フィールドを再計算・バックフィルするスクリプト
 *
 * - stats.days: テンプレートは day_count、通常Tripは start_date / end_date から算出
 * - stats.itineraries: itineraries コレクションから集計
 * - stats.checklists: trip_checklists サブコレクションから items.length を合計
 *
 * 使用方法:
 *   pnpm tsx scripts/recalculate-trip-stats.ts --dry-run
 *   pnpm tsx scripts/recalculate-trip-stats.ts --batch-size=200
 *
 * 注意:
 *   - 本番環境で実行する前に、必ず開発 / ステージング環境でテストしてください
 *   - 実行前に Firestore のバックアップを取ることを推奨します
 */

import dotenv from "dotenv";
// Next.js と同じくプロジェクトルートの `.env.local` を優先して読み込む
dotenv.config({ path: ".env.local" });

import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Trip } from "@/lib/core/types";
import logger from "@/lib/core/logger";
import type { Firestore } from "firebase-admin/firestore";

let adminDb: Firestore | null = null;
function getAdminDb(): Firestore {
	if (!adminDb) {
		try {
			const adminModule = require("@/lib/firebase/admin");
			adminDb = adminModule.adminDb as Firestore;
		} catch (error) {
			throw new Error(
				"Firebase Admin SDK is not available. Set FIREBASE credentials and try again.",
			);
		}
	}
	// この時点では adminDb が必ずセットされている前提なので non-null を明示
	return adminDb as Firestore;
}

function calculateDays(trip: Trip): number | undefined {
	if (trip.is_template) {
		if (typeof trip.day_count === "number" && trip.day_count > 0) {
			return trip.day_count;
		}
		return undefined;
	}

	if (!trip.start_date || !trip.end_date) return undefined;

	const start = new Date(trip.start_date as any);
	const end = new Date(trip.end_date as any);

	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
		return undefined;
	}

	const diffMs = end.getTime() - start.getTime();
	if (diffMs < 0) return undefined;

	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
	return diffDays > 0 ? diffDays : undefined;
}

async function countItineraries(
	db: Firestore,
	tripId: string,
): Promise<number> {
	const snapshot = await db
		.collection(COLLECTIONS.ITINERARIES)
		.where("trip_id", "==", tripId)
		.select()
		.get();
	return snapshot.size;
}

async function countChecklistItems(
	db: Firestore,
	tripId: string,
): Promise<number> {
	// trip_checklists サブコレクションを想定
	const coll = db.collection(`${COLLECTIONS.TRIPS}/${tripId}/trip_checklists`);
	const snapshot = await coll.get();

	let totalItems = 0;
	snapshot.forEach((doc) => {
		const data = doc.data() as { items?: unknown[] };
		if (Array.isArray(data.items)) {
			totalItems += data.items.length;
		}
	});

	return totalItems;
}

export async function recalculateTripStats(
	firestore?: Firestore,
	batchSize: number = 200,
	dryRun: boolean = false,
): Promise<number> {
	const db = firestore || getAdminDb();
	logger.info("Starting trip stats recalculation", { batchSize, dryRun });

	let updatedCount = 0;
	let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

	try {
		while (true) {
			let query = db
				.collection(COLLECTIONS.TRIPS)
				.orderBy("created_at")
				.limit(batchSize);
			if (lastDoc) {
				query = query.startAfter(lastDoc);
			}

			const snapshot = await query.get();
			if (snapshot.empty) break;

			const batch = db.batch();
			let batchUpdatedCount = 0;

			for (const doc of snapshot.docs) {
				const trip = doc.data() as Trip;

				const days = calculateDays(trip);
				const itinerariesCount = await countItineraries(db, doc.id);
				const checklistItems = await countChecklistItems(db, doc.id);

				const nextStats = {
					...(trip.stats || {}),
					days,
					itineraries: itinerariesCount > 0 ? itinerariesCount : undefined,
					checklists: checklistItems > 0 ? checklistItems : undefined,
				};

				const hasAny =
					typeof nextStats.days === "number" ||
					typeof nextStats.itineraries === "number" ||
					typeof nextStats.checklists === "number";

				if (!hasAny) {
					continue;
				}

				if (!dryRun) {
					batch.update(doc.ref, {
						stats: nextStats,
						updated_at: new Date(),
					});
				}

				batchUpdatedCount++;
				updatedCount++;

				logger.debug("Recalculating trip stats", {
					tripId: doc.id,
					title: trip.title,
					stats: nextStats,
				});
			}

			if (!dryRun && batchUpdatedCount > 0) {
				await batch.commit();
				logger.info("Trip stats batch committed", {
					batchUpdatedCount,
					totalUpdated: updatedCount,
				});
			} else if (dryRun && batchUpdatedCount > 0) {
				logger.info("Dry run - would update trip stats", {
					batchUpdatedCount,
					totalUpdated: updatedCount,
				});
			}

			lastDoc = snapshot.docs[snapshot.docs.length - 1];
			if (snapshot.docs.length < batchSize) {
				break;
			}
		}

		logger.info("Trip stats recalculation completed", {
			totalUpdated: updatedCount,
			dryRun,
		});
		return updatedCount;
	} catch (error) {
		logger.error("Error during trip stats recalculation", error);
		throw error;
	}
}

async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes("--dry-run") || args.includes("-d");
	const batchSizeArg = args.find((arg) => arg.startsWith("--batch-size="));
	const batchSize = batchSizeArg
		? parseInt(batchSizeArg.split("=")[1], 10)
		: 200;

	if (dryRun) {
		logger.warn(
			"Running trip stats recalculation in DRY RUN mode - no changes will be made",
		);
	}

	try {
		const updatedCount = await recalculateTripStats(
			getAdminDb(),
			batchSize,
			dryRun,
		);

		if (dryRun) {
			logger.info(
				`Trip stats dry run completed: ${updatedCount} trips would be updated`,
			);
		} else {
			logger.info(
				`Trip stats recalculation completed: ${updatedCount} trips updated`,
			);
		}

		process.exit(0);
	} catch (error) {
		logger.error("Trip stats recalculation failed", error);
		process.exit(1);
	}
}

if (require.main === module) {
	void main();
}
