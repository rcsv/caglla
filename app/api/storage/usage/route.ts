import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/core/logger";
import { storageManagementHelpers } from "@/lib/firebase/storage";
import {
	badRequest,
	parseRequestBody,
	createForbiddenError,
} from "@/lib/core/error-handler";
import { authApi } from "@/lib/api/middleware";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

// GET /api/storage/usage - ユーザーのストレージ使用量を取得
export const GET = authApi(async (request: NextRequest, ctx) => {
	const { userId } = ctx.auth!;

	const usage = await storageManagementHelpers.getUserStorageUsage(userId);
	const quotaCheck = await storageManagementHelpers.checkStorageQuota(userId);

	return NextResponse.json({
		success: true,
		data: {
			usage,
			quota: quotaCheck.quota,
			usagePercentage: storageManagementHelpers.calculateUsagePercentage(
				usage.totalBytes,
				quotaCheck.quota.maxBytes,
			),
			formattedUsage: {
				totalBytes: storageManagementHelpers.formatFileSize(usage.totalBytes),
				maxBytes: storageManagementHelpers.formatFileSize(
					quotaCheck.quota.maxBytes,
				),
				fileCount: usage.fileCount,
				maxFiles: quotaCheck.quota.maxFiles,
			},
		},
	});
});

// POST /api/storage/usage - ストレージ使用量を手動で更新（管理者用）
export const POST = authApi(async (request: NextRequest, ctx) => {
	const { userId, decodedToken } = ctx.auth!;

	const body = await parseRequestBody<{
		action?: string;
		fileId?: string;
		file?: any;
	}>(request);
	const { action, fileId, file } = body;

	if (action === "reset") {
		// 開発環境では誰でもリセット可能、本番環境では管理者のみ
		const isDevelopment = process.env.NODE_ENV === "development";
		if (!isDevelopment && decodedToken.planId !== "enterprise") {
			throw createForbiddenError("権限がありません");
		}

		const result = await storageManagementHelpers.resetUserStorageUsage(userId);
		if (!result.success) {
			return NextResponse.json(
				{ success: false, error: result.error },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "ストレージ使用量をリセットしました",
		});
	} else if (action === "add" && file) {
		// ファイルをストレージ使用量に追加
		const result = await storageManagementHelpers.addFileToStorageUsage(
			userId,
			file,
		);
		if (!result.success) {
			return NextResponse.json(
				{ success: false, error: result.error },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "ファイルをストレージ使用量に追加しました",
		});
	} else if (action === "remove" && fileId) {
		// ファイルをストレージ使用量から削除
		const result = await storageManagementHelpers.removeFileFromStorageUsage(
			userId,
			fileId,
		);
		if (!result.success) {
			return NextResponse.json(
				{ success: false, error: result.error },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "ファイルをストレージ使用量から削除しました",
		});
	}

	return badRequest("Invalid action");
});
