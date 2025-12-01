import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase/admin";
import logger from "@/lib/core/logger";

// 動的レンダリングを強制
export const dynamic = "force-dynamic";

/**
 * キャッシュキーを生成（クライアント側と同じロジック）
 */
function generateCacheKey(
	photoReference: string,
	options: {
		width?: number;
		height?: number;
		quality?: number;
	} = {},
): string {
	const { width = 300, height = 300, quality = 80 } = options;
	return `places-photos/${photoReference}_${width}x${height}_q${quality}.jpg`;
}

/**
 * GET /api/cached-place-image/[photoReference] - Firebase Storageからキャッシュされた画像を取得
 *
 * クエリパラメータ:
 * - width: 画像の幅（デフォルト: 300）
 * - height: 画像の高さ（デフォルト: 300）
 * - quality: 画像の品質（デフォルト: 80）
 *
 * レスポンス:
 * - 200: 画像が存在する場合、画像データを返す
 * - 204: 画像が存在しない場合（コンソールにエラーを出さない）
 * - 500: サーバーエラー
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ photoReference: string }> },
) {
	try {
		const { photoReference } = await params;
		const { searchParams } = new URL(request.url);

		// クエリパラメータから画像オプションを取得
		const width = searchParams.get("width")
			? parseInt(searchParams.get("width")!, 10)
			: 300;
		const height = searchParams.get("height")
			? parseInt(searchParams.get("height")!, 10)
			: 300;
		const quality = searchParams.get("quality")
			? parseInt(searchParams.get("quality")!, 10)
			: 80;

		// キャッシュキーを生成
		const cacheKey = generateCacheKey(photoReference, {
			width,
			height,
			quality,
		});

		logger.debug("Checking cached place image", {
			photoReference: photoReference.substring(0, 20) + "...",
			cacheKey,
		});

		// Firebase Storageからファイル参照を取得
		const bucket = adminStorage.bucket();
		const file = bucket.file(cacheKey);

		// ファイルが存在するか確認
		const [exists] = await file.exists();

		if (!exists) {
			// 存在しない場合は204を返す（コンソールにエラーを出さない）
			return new NextResponse(null, { status: 204 });
		}

		// ファイルが存在する場合は、画像データを直接取得して返す
		// これにより、Next.jsのImageコンポーネントが正常に動作する
		const [fileBuffer] = await file.download();
		
		// メタデータからContent-Typeを取得（デフォルトはimage/jpeg）
		const [metadata] = await file.getMetadata();
		const contentType = metadata.contentType || "image/jpeg";

		// 画像データを返す
		return new NextResponse(fileBuffer, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=31536000, immutable", // 1年間キャッシュ
			},
		});
	} catch (error) {
		logger.error("Error in cached-place-image API:", error);
		// エラーが発生した場合も204を返す（コンソールにエラーを出さない）
		// ただし、ログには記録する
		return new NextResponse(null, { status: 204 });
	}
}

/**
 * HEAD /api/cached-place-image/[photoReference] - 画像の存在確認のみ
 *
 * レスポンス:
 * - 200: 画像が存在する場合
 * - 204: 画像が存在しない場合
 */
export async function HEAD(
	request: NextRequest,
	{ params }: { params: Promise<{ photoReference: string }> },
) {
	try {
		const { photoReference } = await params;
		const { searchParams } = new URL(request.url);

		// クエリパラメータから画像オプションを取得
		const width = searchParams.get("width")
			? parseInt(searchParams.get("width")!, 10)
			: 300;
		const height = searchParams.get("height")
			? parseInt(searchParams.get("height")!, 10)
			: 300;
		const quality = searchParams.get("quality")
			? parseInt(searchParams.get("quality")!, 10)
			: 80;

		// キャッシュキーを生成
		const cacheKey = generateCacheKey(photoReference, {
			width,
			height,
			quality,
		});

		// Firebase Storageからファイル参照を取得
		const bucket = adminStorage.bucket();
		const file = bucket.file(cacheKey);

		// ファイルが存在するか確認
		const [exists] = await file.exists();

		if (!exists) {
			return new NextResponse(null, { status: 204 });
		}

		return new NextResponse(null, { status: 200 });
	} catch (error) {
		logger.error("Error in cached-place-image HEAD API:", error);
		return new NextResponse(null, { status: 204 });
	}
}
