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

	return `あなたは旅行に情熱を注ぐ経験豊富な旅行ライターです。読者が「なるほど、そういうことか」と納得し、旅への期待が高まるような、情緒あふれる読み物としての説明文をMarkdown形式で作成してください。

**項目名**: ${title}
${description ? `**短い説明**: ${description}` : ""}
**カテゴリ**: ${categoryLabel}
**優先度**: ${priorityLabel}

以下の要件を満たす説明文を作成してください：

## 文体・トーン
- 親しみやすく、温かみのある語り口で書く
- 機械的な箇条書きや堅苦しい表現は避ける
- 読者が実際に旅に出る場面を想像できるような描写を含める
- 「〜です」「〜ます」調で、読み物として自然に読める文章にする

## 構成
1. **導入（1-2文）**: なぜこの項目が旅を豊かにするのか、具体的なシーンを思い浮かべられるような書き出し
2. **本論**: 
   - 実用的な情報を、ストーリー性を持たせて説明
   - 見出し（##）や箇条書き（-）を適度に使用
   - 「なぜ必要か」「どう使うか」「注意点」などを自然な流れで織り込む
3. **締めくくり（1文）**: 旅の楽しみや安心感につながる一言で締める

## 文字数・形式
- 400-800文字程度（読み物として適度な長さ）
- Markdown形式（見出し、リスト、強調、リンクを使用可能）
- 箇条書きは最小限にし、文章の流れを重視

## 具体例のイメージ
「レストラン予約」なら「満席の店の前で肩を落とすあなたの姿は見たくない」といった共感を呼ぶ表現から始め、「予約が取れた瞬間の安堵感」や「美味しい食事で旅の思い出が彩られる」といった情緒的な描写を含める。

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

