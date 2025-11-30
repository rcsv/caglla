import {
	ref,
	uploadBytes,
	getDownloadURL,
	deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { StorageFile } from "@/lib/core/types";
import logger from "@/lib/core/logger";
import { t } from "@/lib/i18n";
import { getUserLanguage } from "@/lib/utils/language";
import {
	StorageErrorCode,
	normalizeStorageError,
	getStorageErrorI18nKey,
} from "./storage-error-codes";

// ストレージ制限チェック用のAPI呼び出し
async function checkStorageQuota(
	userId: string,
	fileSize: number,
): Promise<{ canUpload: boolean; error?: string }> {
	try {
		const token = await getAuthToken();
		const response = await fetch("/api/storage/quota", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ fileSize }),
		});

		const result = await response.json();
		return {
			canUpload: result.success ? result.data.canUpload : false,
			error: result.success ? result.data.error : result.error,
		};
	} catch (error) {
		logger.error("Error checking storage quota:", error);
		const language = getUserLanguage();
		return {
			canUpload: false,
			error: t("imageUpload.error.quotaCheckFailed", language),
		};
	}
}

// ストレージ使用量更新用のAPI呼び出し
async function updateStorageUsage(
	userId: string,
	file: StorageFile,
): Promise<{ success: boolean; error?: string }> {
	try {
		const token = await getAuthToken();
		const response = await fetch("/api/storage/usage", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ action: "add", file }),
		});

		const result = await response.json();
		return {
			success: result.success,
			error: result.error,
		};
	} catch (error) {
		logger.error("Error updating storage usage:", error);
		const language = getUserLanguage();
		return {
			success: false,
			error: t("imageUpload.error.storageUsageUpdateFailed", language),
		};
	}
}

/**
 * 認証トークンを取得（リトライ付き）
 * CodeRabbit提案: 500msバックオフ付き1回のリトライ
 *
 * @param forceRefresh - トークンを強制的にリフレッシュするか
 * @returns Firebase IDトークン
 * @throws Error 認証に失敗した場合
 */
async function getAuthTokenWithRetry(
	forceRefresh: boolean = true,
): Promise<string> {
	const { auth } = await import("@/lib/firebase/client");
	const user = auth.currentUser;

	if (!user) {
		throw new Error("User not authenticated");
	}

	try {
		// 最初の試行
		return await user.getIdToken(forceRefresh);
	} catch (error) {
		logger.warn("First attempt to get auth token failed, retrying...", error);

		// 500ms待機してからリトライ
		await new Promise((resolve) => setTimeout(resolve, 500));

		try {
			// リトライ（強制リフレッシュ）
			return await user.getIdToken(true);
		} catch (retryError) {
			logger.error("Failed to get auth token after retry:", retryError);
			throw new Error("Failed to get authentication token after retry");
		}
	}
}

// Firebase IDトークンを取得（後方互換性のため）
async function getAuthToken(): Promise<string> {
	return await getAuthTokenWithRetry(true);
}

export const imageUploadHelpers = {
	// Upload image to Firebase Storage with storage tracking
	async uploadImage(
		file: File,
		path: string,
		userId: string,
		tripId?: string,
		isAvatar?: boolean,
	): Promise<{ downloadURL: string; fileId: string }> {
		try {
			logger.debug("Firebase Storage upload starting...");
			logger.debug("File:", file.name, "Size:", file.size, "Type:", file.type);
			logger.debug("Path:", path);
			logger.debug("UserId:", userId);
			logger.debug("TripId:", tripId || "none");
			logger.debug("IsAvatar:", isAvatar || false);

			// 認証状態を確認
			const { auth } = await import("@/lib/firebase/client");
			const currentUser = auth.currentUser;
			if (!currentUser) {
				logger.error("No authenticated user found during upload");
				const language = getUserLanguage();
				throw new Error(t("imageUpload.error.unauthenticated", language));
			}
			logger.debug("Authenticated user:", currentUser.uid);

			// トークンの有効性を確認（リトライ付き）
			try {
				const token = await getAuthTokenWithRetry(true);
				logger.debug("Auth token obtained (length):", token.length);
			} catch (tokenError) {
				logger.error("Failed to get auth token:", tokenError);
				const language = getUserLanguage();
				throw new Error(t("imageUpload.error.unauthenticated", language));
			}

			// ストレージ制限をチェック
			const quotaCheck = await checkStorageQuota(userId, file.size);
			if (!quotaCheck.canUpload) {
				const language = getUserLanguage();
				const errorMsg = quotaCheck.error
					? t("imageUpload.error.storageQuotaExceeded", language).replace(
							"{error}",
							quotaCheck.error,
						)
					: t("imageUpload.error.quotaExceeded", language);
				throw new Error(errorMsg);
			}

			// Create a reference to the file
			const imageRef = ref(storage, path);
			logger.debug("Storage reference created:", imageRef.fullPath);

			// Upload the file
			logger.debug("Starting upload...");
			const snapshot = await uploadBytes(imageRef, file);
			logger.debug("Upload completed, snapshot:", snapshot);

			// Get the download URL
			logger.debug("Getting download URL...");
			const downloadURL = await getDownloadURL(snapshot.ref);
			logger.debug("Download URL obtained:", downloadURL);

			// ストレージ使用量を追跡
			const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const storageFile: StorageFile = {
				id: fileId,
				fileName: file.name,
				fileSize: file.size,
				fileType: file.type,
				storagePath: path,
				downloadUrl: downloadURL,
				uploadedAt: new Date(),
				tripId,
				isAvatar,
			};

			const addResult = await updateStorageUsage(userId, storageFile);
			if (!addResult.success) {
				logger.warn("Failed to track storage usage:", addResult.error);
				// アップロードは成功したが、追跡に失敗した場合は警告のみ
			}

			return { downloadURL, fileId };
		} catch (error) {
			logger.error("Detailed Firebase Storage error:", error);

			const language = getUserLanguage();

			// 標準化されたエラーコードに変換
			if (error instanceof Error) {
				const errorCode = normalizeStorageError(error);
				const i18nKey = getStorageErrorI18nKey(errorCode);

				// STORAGE_UNAUTHORIZEDの場合は追加説明を付与
				if (errorCode === StorageErrorCode.STORAGE_UNAUTHORIZED) {
					const authMessage = t("imageUpload.error.auth", language);
					const authDescription = t(
						"imageUpload.error.auth.description",
						language,
					);
					throw new Error(`${authMessage}: ${authDescription}`);
				}

				// その他のエラーは標準的なメッセージ
				throw new Error(t(i18nKey, language));
			}

			// 非Errorオブジェクトの場合
			const errorCode = StorageErrorCode.STORAGE_UPLOAD_FAILED;
			const i18nKey = getStorageErrorI18nKey(errorCode);
			throw new Error(t(i18nKey, language));
		}
	},

	// Legacy method for backward compatibility
	async uploadImageLegacy(file: File, path: string): Promise<string> {
		const result = await this.uploadImage(
			file,
			path,
			"anonymous",
			undefined,
			false,
		);
		return result.downloadURL;
	},

	// Delete image from Firebase Storage with storage tracking
	async deleteImage(
		imageUrl: string,
		userId?: string,
		fileId?: string,
	): Promise<void> {
		try {
			// Check if imageUrl is valid
			if (!imageUrl || typeof imageUrl !== "string") {
				logger.warn("Invalid imageUrl provided to deleteImage:", imageUrl);
				return;
			}

			logger.debug("Attempting to delete image with URL:", imageUrl);
			logger.debug("UserId:", userId || "none");
			logger.debug("FileId:", fileId || "none");

			// 認証状態を確認（リトライ付き）
			try {
				await getAuthTokenWithRetry(true);
				logger.debug("Auth token obtained for deletion");
			} catch (tokenError) {
				logger.error("Failed to get auth token for deletion:", tokenError);
				const language = getUserLanguage();
				throw new Error(t("imageUpload.error.unauthenticated", language));
			}

			// Extract the path from the URL with better error handling
			let path: string;
			try {
				const url = new URL(imageUrl);
				logger.debug("Parsed URL pathname:", url.pathname);

				// Check if this is a Firebase Storage URL
				if (!url.pathname.includes("/o/")) {
					logger.warn(
						"URL does not appear to be a Firebase Storage URL:",
						imageUrl,
					);
					return;
				}

				const pathParts = url.pathname.split("/o/");
				if (pathParts.length < 2) {
					logger.warn("Invalid Firebase Storage URL format:", imageUrl);
					return;
				}

				const pathWithParams = pathParts[1];
				if (!pathWithParams) {
					logger.warn("No path found in Firebase Storage URL:", imageUrl);
					return;
				}

				// Remove query parameters
				path = decodeURIComponent(pathWithParams.split("?")[0]);
				logger.debug("Extracted path:", path);

				if (!path) {
					logger.warn("Empty path extracted from URL:", imageUrl);
					return;
				}
			} catch (urlError) {
				logger.error("Error parsing image URL:", urlError);
				logger.error("Problematic URL:", imageUrl);
				return;
			}

			// Create a reference to the file
			const imageRef = ref(storage, path);
			logger.debug("Created storage reference:", imageRef.fullPath);

			// Delete the file
			await deleteObject(imageRef);
			logger.debug("Successfully deleted image from storage");

			// ストレージ使用量からも削除
			if (userId && fileId) {
				try {
					const token = await getAuthToken();
					const response = await fetch("/api/storage/usage", {
						method: "POST",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ action: "remove", fileId }),
					});

					const result = await response.json();
					if (!result.success) {
						logger.warn(
							"Failed to update storage usage after deletion:",
							result.error,
						);
					} else {
						logger.debug("Successfully updated storage usage after deletion");
					}
				} catch (error) {
					logger.warn("Failed to update storage usage after deletion:", error);
				}
			}
		} catch (error) {
			logger.error("Error deleting image:", error);
			throw error;
		}
	},

	// Generate unique path for trip images
	generateTripImagePath(tripId: string, fileName: string): string {
		const timestamp = Date.now();
		const extension = fileName.split(".").pop();
		return `trips/${tripId}/images/${timestamp}.${extension}`;
	},

	// Generate unique path for user avatar images
	generateAvatarImagePath(userId: string, fileName: string): string {
		const timestamp = Date.now();
		const extension = fileName.split(".").pop();
		return `users/${userId}/avatar/${timestamp}.${extension}`;
	},

	// Validate image file
	validateImageFile(file: File): { valid: boolean; error?: string } {
		const maxSize = 5 * 1024 * 1024; // 5MB
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

		if (!allowedTypes.includes(file.type)) {
			return {
				valid: false,
				error: "JPEG、PNG、WebP形式の画像のみアップロードできます",
			};
		}

		if (file.size > maxSize) {
			return {
				valid: false,
				error: "画像サイズは5MB以下にしてください",
			};
		}

		return { valid: true };
	},
};
