/**
 * Gemini API クライアント
 * Google GenAI SDKを使用してlongDescriptionを生成
 * 公式ドキュメント: https://ai.google.dev/gemini-api/docs/quickstart?hl=ja#javascript
 */

import { GoogleGenAI } from "@google/genai";
import logger from "@/lib/core/logger";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";

interface GenerateLongDescriptionParams {
	title: string;
	description?: string;
	category: "preparation" | "packing";
	priority?: "high" | "medium" | "low";
	generatedFrom?: string;
}

/**
 * Gemini APIを使用してlongDescriptionを生成
 */
export async function generateLongDescription(
	params: GenerateLongDescriptionParams,
): Promise<string | null> {
	const { title, description, category, priority, generatedFrom } = params;

	// APIキーの確認
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		logger.warn("GEMINI_API_KEY is not set, skipping longDescription generation");
		return null;
	}

	try {
		// キャッシュを確認
		const cacheKey = `longDescription:${title}:${category}:${generatedFrom || ""}`;
		const cached = await getCachedLongDescription(cacheKey);
		if (cached) {
			logger.debug("Using cached longDescription", { title, cacheKey });
			return cached;
		}

		// Gemini APIクライアントを初期化（新しいSDK: @google/genai）
		// 環境変数 GEMINI_API_KEY が自動的に使用される
		const ai = new GoogleGenAI({});

		// プロンプトを構築
		const prompt = buildPrompt(title, description, category, priority);

		logger.debug("Generating longDescription with Gemini", { title, category });

		// APIリクエスト（新しいSDKのAPI）
		// モデル名: gemini-2.5-flash または gemini-1.5-flash を使用
		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash", // 最新のFlashモデル（公式ドキュメント準拠）
			contents: prompt,
		});
		const text = response.text;

		if (!text || text.trim().length === 0) {
			logger.warn("Gemini API returned empty response", { title });
			return null;
		}

		// キャッシュに保存
		await saveCachedLongDescription(cacheKey, text);

		logger.debug("Successfully generated longDescription", {
			title,
			length: text.length,
		});

		return text;
	} catch (error) {
		logger.error("Failed to generate longDescription with Gemini", {
			title,
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
}

/**
 * プロンプトを構築
 */
function buildPrompt(
	title: string,
	description: string | undefined,
	category: "preparation" | "packing",
	priority: "high" | "medium" | "low" | undefined,
): string {
	const categoryLabel = category === "preparation" ? "準備" : "パッキング";
	const priorityLabel =
		priority === "high"
			? "高"
			: priority === "medium"
				? "中"
				: priority === "low"
					? "低"
					: "中";

	return `あなたは実践的な旅行アドバイザーです。読者が「なるほど、そうすればいいのか」とすぐに行動に移せるような、簡潔で実用的な説明文をMarkdown形式で作成してください。

**項目名**: ${title}
${description ? `**短い説明**: ${description}` : ""}
**カテゴリ**: ${categoryLabel}
**優先度**: ${priorityLabel}

以下の要件を満たす説明文を作成してください：

## 文体・トーン
- 親しみやすく、実用的な語り口
- 「〜です」「〜ます」調で自然に読める
- 過度に情緒的にならず、実用性を重視

## 構成
1. **導入（1-2文）**: なぜ必要か、どんな場面で役立つかを簡潔に説明
2. **本論**: 
   - 実用的な情報を自然な文章で説明
   - 必要に応じて「ポイント」という見出し（##）で重要な情報をまとめる
   - 箇条書きは「ポイント」セクション内でのみ使用（3-4項目程度）
3. **締めくくり（1文）**: 行動を促す、または安心感を与える一言で締める

## 文字数・形式
- 300-500文字程度（簡潔で実用的な長さ）
- Markdown形式（見出し、リスト、強調、リンクを使用可能）
- 「ポイント」セクションは必要に応じて使用（必須ではない）

## 具体例のイメージ
「航空券の印刷またはモバイルチケット準備」の場合：

航空会社や空港によっては、チェックイン時にチケットの提示が必須になる場合があります。

紙の印刷でも、スマホのモバイルチケットでも OK。どちらか片方だけだと電波トラブルのときに慌てるので、予備手段をひとつ確保しておくのがおすすめです。

ポイント

- スマホの電池切れ対策として、PDFを端末に保存 or 紙で印刷のどちらかを予備に
- 海外の小さな空港は、QRコードスキャンの機材が古いことがあり、印刷の方が通りが早いことも
- 乗り継ぎがある場合は、区間ごとのチケットがあるか確認しておく

一枚印刷しておくと、いざという時に"未来の自分"がかなり助かります。

説明文のみを返してください（前後の装飾は不要です）。`;
}

/**
 * キャッシュからlongDescriptionを取得
 */
async function getCachedLongDescription(
	cacheKey: string,
): Promise<string | null> {
	try {
		const cacheRef = adminDb
			.collection(COLLECTIONS.CHECKLIST_LONG_DESCRIPTION_CACHE)
			.doc(cacheKey);
		const doc = await cacheRef.get();

		if (!doc.exists) {
			return null;
		}

		const data = doc.data();
		if (!data) {
			return null;
		}

		// キャッシュの有効期限をチェック（30日）
		const createdAt = data.created_at?.toDate();
		if (createdAt) {
			const daysSinceCreation =
				(Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
			if (daysSinceCreation > 30) {
				// キャッシュが古い場合は削除
				await cacheRef.delete();
				return null;
			}
		}

		return data.content || null;
	} catch (error) {
		logger.warn("Failed to get cached longDescription", {
			cacheKey,
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
}

/**
 * 生成したlongDescriptionをキャッシュに保存
 */
async function saveCachedLongDescription(
	cacheKey: string,
	content: string,
): Promise<void> {
	try {
		const cacheRef = adminDb
			.collection(COLLECTIONS.CHECKLIST_LONG_DESCRIPTION_CACHE)
			.doc(cacheKey);
		await cacheRef.set({
			content,
			created_at: new Date(),
			updated_at: new Date(),
		});
	} catch (error) {
		logger.warn("Failed to save cached longDescription", {
			cacheKey,
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

