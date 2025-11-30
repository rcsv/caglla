import { adminDb } from "./admin";
import logger from "@/lib/core/logger";
import { StorageUsage, StorageFile, StorageQuota } from "@/lib/core/types";

// Firebase Admin SDKを使用するためのヘルパー関数
const getDoc = async (collection: string, docId: string) => {
	const docRef = adminDb.collection(collection).doc(docId);
	const docSnap = await docRef.get();
	return docSnap.exists
		? { data: () => docSnap.data(), exists: true }
		: { data: () => null, exists: false };
};

const setDoc = async (collection: string, docId: string, data: any) => {
	const docRef = adminDb.collection(collection).doc(docId);
	await docRef.set(data);
};

const updateDoc = async (collection: string, docId: string, data: any) => {
	const docRef = adminDb.collection(collection).doc(docId);
	await docRef.update(data);
};

// プラン別ストレージ制限
export const STORAGE_QUOTAS: Record<string, StorageQuota> = {
	season_traveler: {
		planId: "season_traveler",
		maxBytes: 100 * 1024 * 1024, // 100MB
		maxFiles: 50,
		description: "無料プラン: 100MB、50ファイルまで",
	},
	backpacker: {
		planId: "backpacker",
		maxBytes: 500 * 1024 * 1024, // 500MB
		maxFiles: 200,
		description: "バックパッカープラン: 500MB、200ファイルまで",
	},
	globetrotter: {
		planId: "globetrotter",
		maxBytes: 2 * 1024 * 1024 * 1024, // 2GB
		maxFiles: 1000,
		description: "グローブトロッタープラン: 2GB、1000ファイルまで",
	},
	planner_pro: {
		planId: "planner_pro",
		maxBytes: 5 * 1024 * 1024 * 1024, // 5GB
		maxFiles: 5000,
		description: "プランナープロプラン: 5GB、5000ファイルまで",
	},
	enterprise: {
		planId: "enterprise",
		maxBytes: 50 * 1024 * 1024 * 1024, // 50GB
		maxFiles: 50000,
		description: "エンタープライズプラン: 50GB、50000ファイルまで",
	},
};

export const storageManagementHelpers = {
	// ユーザーのストレージ使用量を取得
	async getUserStorageUsage(userId: string): Promise<StorageUsage> {
		try {
			const storageDoc = await getDoc("userStorage", userId);

			if (storageDoc.exists) {
				const data = storageDoc.data();
				return {
					totalBytes: data.totalBytes || 0,
					fileCount: data.fileCount || 0,
					lastUpdated: data.lastUpdated?.toDate() || new Date(),
					files: data.files || [],
				};
			} else {
				// 新規ユーザーの場合は空のストレージ使用量を返す
				return {
					totalBytes: 0,
					fileCount: 0,
					lastUpdated: new Date(),
					files: [],
				};
			}
		} catch (error) {
			logger.error("Error getting user storage usage:", error);
			throw new Error("ストレージ使用量の取得に失敗しました");
		}
	},

	// ファイルアップロード時のストレージ使用量を更新
	async addFileToStorageUsage(
		userId: string,
		file: StorageFile,
	): Promise<{ success: boolean; error?: string }> {
		try {
			const currentUsage = await this.getUserStorageUsage(userId);

			// 新しいファイルを追加
			const updatedFiles = [...currentUsage.files, file];
			const updatedUsage: StorageUsage = {
				totalBytes: currentUsage.totalBytes + file.fileSize,
				fileCount: currentUsage.fileCount + 1,
				lastUpdated: new Date(),
				files: updatedFiles,
			};

			// Firestoreに保存
			await setDoc("userStorage", userId, {
				totalBytes: updatedUsage.totalBytes,
				fileCount: updatedUsage.fileCount,
				lastUpdated: updatedUsage.lastUpdated,
				files: updatedUsage.files,
			});

			return { success: true };
		} catch (error) {
			logger.error("Error adding file to storage usage:", error);
			return {
				success: false,
				error: "ストレージ使用量の更新に失敗しました",
			};
		}
	},

	// ファイル削除時のストレージ使用量を更新
	async removeFileFromStorageUsage(
		userId: string,
		fileId: string,
	): Promise<{ success: boolean; error?: string }> {
		try {
			const currentUsage = await this.getUserStorageUsage(userId);

			// 削除するファイルを検索
			const fileToRemove = currentUsage.files.find((f) => f.id === fileId);
			if (!fileToRemove) {
				return {
					success: false,
					error: "削除するファイルが見つかりません",
				};
			}

			// ファイルをリストから削除
			const updatedFiles = currentUsage.files.filter((f) => f.id !== fileId);
			const updatedUsage: StorageUsage = {
				totalBytes: currentUsage.totalBytes - fileToRemove.fileSize,
				fileCount: currentUsage.fileCount - 1,
				lastUpdated: new Date(),
				files: updatedFiles,
			};

			// Firestoreに保存
			await setDoc("userStorage", userId, {
				totalBytes: updatedUsage.totalBytes,
				fileCount: updatedUsage.fileCount,
				lastUpdated: updatedUsage.lastUpdated,
				files: updatedUsage.files,
			});

			return { success: true };
		} catch (error) {
			logger.error("Error removing file from storage usage:", error);
			return {
				success: false,
				error: "ストレージ使用量の更新に失敗しました",
			};
		}
	},

	// ストレージ制限チェック
	async checkStorageQuota(
		userId: string,
		additionalBytes: number = 0,
	): Promise<{
		canUpload: boolean;
		quota: StorageQuota;
		currentUsage: StorageUsage;
		error?: string;
	}> {
		try {
			// ユーザー情報を取得してプランを確認
			const userDoc = await getDoc("users", userId);
			let planId = "season_traveler"; // デフォルトプラン

			if (userDoc.exists) {
				const userData = userDoc.data();
				planId = userData.planId || "season_traveler";
			} else {
				// ユーザー情報が存在しない場合はデフォルトプランで新規作成
				logger.debug("User document not found, using default plan:", userId);
			}

			const quota = STORAGE_QUOTAS[planId];

			if (!quota) {
				logger.warn("Invalid plan ID, using default:", planId);
				planId = "season_traveler";
			}

			const currentUsage = await this.getUserStorageUsage(userId);
			const projectedBytes = currentUsage.totalBytes + additionalBytes;
			const projectedFileCount =
				currentUsage.fileCount + (additionalBytes > 0 ? 1 : 0);

			const canUpload =
				projectedBytes <= quota.maxBytes &&
				projectedFileCount <= quota.maxFiles;

			return {
				canUpload,
				quota: STORAGE_QUOTAS[planId],
				currentUsage,
				error: canUpload ? undefined : "ストレージ制限を超えています",
			};
		} catch (error) {
			logger.error("Error checking storage quota:", error);
			return {
				canUpload: false,
				quota: STORAGE_QUOTAS.season_traveler,
				currentUsage: await this.getUserStorageUsage(userId),
				error: "ストレージ制限の確認に失敗しました",
			};
		}
	},

	// ファイルサイズを人間が読みやすい形式に変換
	formatFileSize(bytes: number): string {
		if (bytes === 0) return "0 B";

		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB", "TB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	},

	// ストレージ使用率を計算
	calculateUsagePercentage(currentBytes: number, maxBytes: number): number {
		if (maxBytes === 0) return 0;
		return Math.min((currentBytes / maxBytes) * 100, 100);
	},

	// ユーザーのストレージ使用量をリセット（管理者用）
	async resetUserStorageUsage(
		userId: string,
	): Promise<{ success: boolean; error?: string }> {
		try {
			await setDoc("userStorage", userId, {
				totalBytes: 0,
				fileCount: 0,
				lastUpdated: new Date(),
				files: [],
			});

			return { success: true };
		} catch (error) {
			logger.error("Error resetting user storage usage:", error);
			return {
				success: false,
				error: "ストレージ使用量のリセットに失敗しました",
			};
		}
	},
};
