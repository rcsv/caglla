/**
 * Firestore Itineraries Data Management Script
 *
 * Itinerariesデータの管理用スクリプト
 * - データの確認
 * - バックアップ
 * - 削除
 */

import { initializeApp, getApps } from "firebase/app";
import logger from "@/lib/core/logger";
import {
	getFirestore,
	collection,
	getDocs,
	doc,
	deleteDoc,
	writeBatch,
	query,
	orderBy,
	limit,
} from "firebase/firestore";
import { validateServerEnvironment } from "../lib/core/env-validation";
import fs from "fs";
import path from "path";

// Firebase設定
const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

class ItinerariesManager {
	private db: any;

	constructor() {
		const app =
			getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
		this.db = getFirestore(app);
	}

	/**
	 * Itinerariesデータの統計を取得
	 */
	async getStatistics() {
		try {
			logger.debug("📊 Getting itineraries statistics...");

			const itinerariesRef = collection(this.db, "itineraries");
			const snapshot = await getDocs(itinerariesRef);

			const stats = {
				totalCount: snapshot.docs.length,
				withPlaceData: 0,
				withoutPlaceData: 0,
				withPlaceId: 0,
				withoutPlaceId: 0,
				sampleData: [] as any[],
			};

			snapshot.docs.forEach((doc, index) => {
				const data = doc.data();

				if (data.place_id || data.place_data) {
					stats.withPlaceData++;
				} else {
					stats.withoutPlaceData++;
				}

				if (data.place_id || data.place_data?.place_id) {
					stats.withPlaceId++;
				} else {
					stats.withoutPlaceId++;
				}

				// 最初の5件をサンプルとして保存
				if (index < 5) {
					stats.sampleData.push({
						id: doc.id,
						title: data.title,
						hasPlaceData: !!data.place_data,
						hasPlaceId: !!data.place_data?.place_id,
						createdAt: data.created_at,
					});
				}
			});

			return stats;
		} catch (error) {
			logger.error("❌ Error getting statistics:", error);
			throw error;
		}
	}

	/**
	 * Itinerariesデータをバックアップ
	 */
	async backupData(outputPath: string = "./backup") {
		try {
			logger.debug("💾 Creating backup...");

			const itinerariesRef = collection(this.db, "itineraries");
			const snapshot = await getDocs(itinerariesRef);

			const backupData = {
				timestamp: new Date().toISOString(),
				totalCount: snapshot.docs.length,
				data: snapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})),
			};

			// バックアップディレクトリを作成
			if (!fs.existsSync(outputPath)) {
				fs.mkdirSync(outputPath, { recursive: true });
			}

			const filename = `itineraries-backup-${new Date().toISOString().split("T")[0]}.json`;
			const filepath = path.join(outputPath, filename);

			fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

			logger.debug(`✅ Backup created: ${filepath}`);
			logger.debug(`📊 Backed up ${backupData.totalCount} documents`);

			return filepath;
		} catch (error) {
			logger.error("❌ Error creating backup:", error);
			throw error;
		}
	}

	/**
	 * Itinerariesデータを削除
	 */
	async deleteAllData(confirm: boolean = false) {
		if (!confirm) {
			logger.debug("⚠️  This will delete ALL itineraries data!");
			logger.debug("⚠️  Make sure you have a backup before proceeding.");
			logger.debug("⚠️  To confirm, call deleteAllData(true)");
			return;
		}

		try {
			logger.debug("🗑️  Deleting all itineraries data...");

			const itinerariesRef = collection(this.db, "itineraries");
			const snapshot = await getDocs(itinerariesRef);

			logger.debug(`📊 Found ${snapshot.docs.length} documents to delete`);

			if (snapshot.docs.length === 0) {
				logger.debug("✅ No documents found. Nothing to delete.");
				return;
			}

			// バッチ削除
			const batchSize = 500;
			const batches = [];
			let currentBatch = writeBatch(this.db);

			for (let i = 0; i < snapshot.docs.length; i++) {
				const docRef = snapshot.docs[i].ref;
				currentBatch.delete(docRef);

				if ((i + 1) % batchSize === 0) {
					batches.push(currentBatch);
					currentBatch = writeBatch(this.db);
				}
			}

			if ((currentBatch as any)._mutations.length > 0) {
				batches.push(currentBatch);
			}

			logger.debug(`🔄 Executing ${batches.length} batches...`);

			for (let i = 0; i < batches.length; i++) {
				await batches[i].commit();
				logger.debug(`✅ Batch ${i + 1}/${batches.length} completed`);
			}

			logger.debug("🎉 All itineraries data deleted successfully!");
		} catch (error) {
			logger.error("❌ Error deleting data:", error);
			throw error;
		}
	}

	/**
	 * 特定の条件でデータを削除
	 */
	async deleteByCondition(
		condition: (data: any) => boolean,
		confirm: boolean = false,
	) {
		if (!confirm) {
			logger.debug("⚠️  This will delete itineraries matching the condition!");
			logger.debug("⚠️  To confirm, call deleteByCondition(condition, true)");
			return;
		}

		try {
			logger.debug("🗑️  Deleting itineraries by condition...");

			const itinerariesRef = collection(this.db, "itineraries");
			const snapshot = await getDocs(itinerariesRef);

			const docsToDelete = snapshot.docs.filter((doc) => condition(doc.data()));

			logger.debug(
				`📊 Found ${docsToDelete.length} documents matching condition`,
			);

			if (docsToDelete.length === 0) {
				logger.debug("✅ No documents match the condition.");
				return;
			}

			// バッチ削除
			const batchSize = 500;
			const batches = [];
			let currentBatch = writeBatch(this.db);

			for (let i = 0; i < docsToDelete.length; i++) {
				const docRef = docsToDelete[i].ref;
				currentBatch.delete(docRef);

				if ((i + 1) % batchSize === 0) {
					batches.push(currentBatch);
					currentBatch = writeBatch(this.db);
				}
			}

			if ((currentBatch as any)._mutations.length > 0) {
				batches.push(currentBatch);
			}

			logger.debug(`🔄 Executing ${batches.length} batches...`);

			for (let i = 0; i < batches.length; i++) {
				await batches[i].commit();
				logger.debug(`✅ Batch ${i + 1}/${batches.length} completed`);
			}

			logger.debug("🎉 Conditional deletion completed successfully!");
		} catch (error) {
			logger.error("❌ Error deleting data by condition:", error);
			throw error;
		}
	}
}

// 使用例
async function main() {
	try {
		const manager = new ItinerariesManager();

		// 統計を取得
		const stats = await manager.getStatistics();
		logger.debug("📊 Statistics:", stats);

		// バックアップを作成
		const backupPath = await manager.backupData();
		logger.debug(`💾 Backup created at: ${backupPath}`);

		// 確認後、全データを削除
		// await manager.deleteAllData(true)

		// または、特定の条件で削除
		// await manager.deleteByCondition(data => !data.place_data?.place_id, true)
	} catch (error) {
		logger.error("❌ Main execution failed:", error);
	}
}

// スクリプト実行
if (require.main === module) {
	main();
}

export { ItinerariesManager };
