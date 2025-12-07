/**
 * Gemini API クライアント
 * Google GenAI SDKを使用してlongDescriptionを生成
 * 公式ドキュメント: https://ai.google.dev/gemini-api/docs/quickstart?hl=ja#javascript
 */

import { GoogleGenAI } from "@google/genai";
import logger from "@/lib/core/logger";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { SupportedLanguage } from "@/lib/core/types";

interface GenerateLongDescriptionParams {
	title: string;
	description?: string;
	category: "preparation" | "packing";
	priority?: "high" | "medium" | "low";
	generatedFrom?: string;
	language?: SupportedLanguage; // ユーザーの言語設定
}

/**
 * Gemini APIを使用してlongDescriptionを生成
 */
export async function generateLongDescription(
	params: GenerateLongDescriptionParams,
): Promise<string | null> {
	const { title, description, category, priority, generatedFrom, language = "en" } = params;

	// APIキーの確認
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		logger.warn("GEMINI_API_KEY is not set, skipping longDescription generation");
		return null;
	}

	try {
		// キャッシュを確認（言語を含める）
		const cacheKey = `longDescription:${title}:${category}:${generatedFrom || ""}:${language}`;
		const cached = await getCachedLongDescription(cacheKey);
		if (cached) {
			logger.debug("Using cached longDescription", { title, cacheKey, language });
			return cached;
		}

		// Gemini APIクライアントを初期化（新しいSDK: @google/genai）
		const ai = new GoogleGenAI({ apiKey });

		// プロンプトを構築（言語を指定）
		const prompt = buildPrompt(title, description, category, priority, language);

		logger.debug("Generating longDescription with Gemini", { title, category, language });

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
	language: SupportedLanguage = "en",
): string {
	// 言語に応じたラベルを取得
	const labels = getLabelsForLanguage(language);
	const categoryLabel = category === "preparation" ? labels.preparation : labels.packing;
	const priorityLabel =
		priority === "high"
			? labels.priorityHigh
			: priority === "medium"
				? labels.priorityMedium
				: priority === "low"
					? labels.priorityLow
					: labels.priorityMedium;

	// 言語に応じたプロンプトテンプレート
	const promptTemplate = getPromptTemplate(language);

	let prompt = promptTemplate
		.replace(/{{categoryLabel}}/g, categoryLabel)
		.replace(/{{priorityLabel}}/g, priorityLabel)
		.replace(/{{title}}/g, title);
	
	// descriptionの処理（存在する場合のみ置換）
	if (description) {
		prompt = prompt.replace(/{{description}}/g, `**短い説明**: ${description}\n`);
	} else {
		// descriptionがない場合は、その行を削除
		prompt = prompt.replace(/\*\*短い説明\*\*: {{description}}\n/g, "");
		prompt = prompt.replace(/\*\*Short Description\*\*: {{description}}\n/g, "");
		prompt = prompt.replace(/\*\*简短说明\*\*: {{description}}\n/g, "");
		prompt = prompt.replace(/\*\*짧은 설명\*\*: {{description}}\n/g, "");
		prompt = prompt.replace(/\*\*Descripción corta\*\*: {{description}}\n/g, "");
		prompt = prompt.replace(/\*\*Description courte\*\*: {{description}}\n/g, "");
		prompt = prompt.replace(/\*\*Kurze Beschreibung\*\*: {{description}}\n/g, "");
		prompt = prompt.replace(/\*\*Descrizione breve\*\*: {{description}}\n/g, "");
		prompt = prompt.replace(/\*\*Descrição curta\*\*: {{description}}\n/g, "");
	}
	
	return prompt;
}

/**
 * 言語に応じたラベルを取得
 */
function getLabelsForLanguage(language: SupportedLanguage): {
	preparation: string;
	packing: string;
	priorityHigh: string;
	priorityMedium: string;
	priorityLow: string;
} {
	const labels: Record<
		SupportedLanguage,
		{
			preparation: string;
			packing: string;
			priorityHigh: string;
			priorityMedium: string;
			priorityLow: string;
		}
	> = {
		ja: {
			preparation: "準備",
			packing: "パッキング",
			priorityHigh: "高",
			priorityMedium: "中",
			priorityLow: "低",
		},
		en: {
			preparation: "Preparation",
			packing: "Packing",
			priorityHigh: "High",
			priorityMedium: "Medium",
			priorityLow: "Low",
		},
		zh: {
			preparation: "准备",
			packing: "打包",
			priorityHigh: "高",
			priorityMedium: "中",
			priorityLow: "低",
		},
		ko: {
			preparation: "준비",
			packing: "포장",
			priorityHigh: "높음",
			priorityMedium: "중간",
			priorityLow: "낮음",
		},
		es: {
			preparation: "Preparación",
			packing: "Empaquetado",
			priorityHigh: "Alta",
			priorityMedium: "Media",
			priorityLow: "Baja",
		},
		fr: {
			preparation: "Préparation",
			packing: "Emballage",
			priorityHigh: "Élevée",
			priorityMedium: "Moyenne",
			priorityLow: "Faible",
		},
		de: {
			preparation: "Vorbereitung",
			packing: "Verpackung",
			priorityHigh: "Hoch",
			priorityMedium: "Mittel",
			priorityLow: "Niedrig",
		},
		it: {
			preparation: "Preparazione",
			packing: "Imballaggio",
			priorityHigh: "Alta",
			priorityMedium: "Media",
			priorityLow: "Bassa",
		},
		pt: {
			preparation: "Preparação",
			packing: "Embalagem",
			priorityHigh: "Alta",
			priorityMedium: "Média",
			priorityLow: "Baixa",
		},
	};

	return labels[language] || labels.en;
}

/**
 * 言語に応じたプロンプトテンプレートを取得
 */
function getPromptTemplate(language: SupportedLanguage): string {
	const templates: Record<SupportedLanguage, string> = {
		ja: `あなたは実践的な旅行アドバイザーです。読者が「なるほど、そうすればいいのか」とすぐに行動に移せるような、簡潔で実用的な説明文をMarkdown形式で作成してください。

**項目名**: {{title}}
{{description}}
**カテゴリ**: {{categoryLabel}}
**優先度**: {{priorityLabel}}

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

説明文のみを返してください（前後の装飾は不要です）。`,
		en: `You are a practical travel advisor. Create a concise and practical description in Markdown format that makes readers think "I see, that's how I should do it" and immediately take action.

**Item Name**: {{title}}
{{description}}
**Category**: {{categoryLabel}}
**Priority**: {{priorityLabel}}

Please create a description that meets the following requirements:

## Style & Tone
- Friendly and practical tone
- Natural and easy to read
- Focus on practicality rather than being overly emotional

## Structure
1. **Introduction (1-2 sentences)**: Briefly explain why it's necessary and in what situations it's useful
2. **Main Body**: 
   - Explain practical information in natural sentences
   - Use a "Points" heading (##) to summarize important information when necessary
   - Use bullet points only within the "Points" section (3-4 items)
3. **Conclusion (1 sentence)**: End with a sentence that encourages action or provides reassurance

## Length & Format
- Approximately 300-500 characters (concise and practical length)
- Markdown format (headings, lists, emphasis, links can be used)
- "Points" section is optional (not required)

Return only the description text (no decorative text before or after).`,
		zh: `你是一位实用的旅行顾问。请以Markdown格式创建简洁实用的描述，让读者能够立即理解并采取行动。

**项目名称**: {{title}}
{{description}}
**类别**: {{categoryLabel}}
**优先级**: {{priorityLabel}}

请创建满足以下要求的说明：

## 文体和语调
- 友好实用的语调
- 自然易读
- 注重实用性，不过度情绪化

## 结构
1. **介绍（1-2句）**: 简要说明为什么需要，在什么情况下有用
2. **正文**: 
   - 用自然的句子解释实用信息
   - 必要时使用"要点"标题（##）总结重要信息
   - 仅在"要点"部分使用项目符号（3-4项）
3. **结尾（1句）**: 以鼓励行动或提供保证的句子结尾

## 长度和格式
- 约300-500字符（简洁实用的长度）
- Markdown格式（可使用标题、列表、强调、链接）
- "要点"部分是可选的（非必需）

仅返回说明文本（前后无需装饰性文字）。`,
		ko: `당신은 실용적인 여행 어드바이저입니다. 독자가 "아, 그렇게 하면 되는구나"라고 생각하고 즉시 행동에 옮길 수 있도록 간결하고 실용적인 설명을 Markdown 형식으로 작성해주세요.

**항목 이름**: {{title}}
{{description}}
**카테고리**: {{categoryLabel}}
**우선순위**: {{priorityLabel}}

다음 요구사항을 만족하는 설명을 작성해주세요:

## 문체 및 톤
- 친근하고 실용적인 어조
- 자연스럽고 읽기 쉬운 문체
- 과도하게 감정적이지 않고 실용성에 중점

## 구성
1. **도입 (1-2문장)**: 왜 필요한지, 어떤 상황에서 유용한지 간결하게 설명
2. **본문**: 
   - 실용적인 정보를 자연스러운 문장으로 설명
   - 필요시 "포인트" 제목(##)으로 중요한 정보를 요약
   - "포인트" 섹션 내에서만 글머리 기호 사용 (3-4개 항목)
3. **마무리 (1문장)**: 행동을 촉진하거나 안심감을 주는 한 문장으로 마무리

## 길이 및 형식
- 약 300-500자 (간결하고 실용적인 길이)
- Markdown 형식 (제목, 목록, 강조, 링크 사용 가능)
- "포인트" 섹션은 선택사항 (필수 아님)

설명 텍스트만 반환해주세요 (앞뒤 장식 텍스트 불필요).`,
		es: `Eres un asesor de viajes práctico. Crea una descripción concisa y práctica en formato Markdown que haga que los lectores piensen "Ya veo, así es como debo hacerlo" y tomen acción inmediatamente.

**Nombre del elemento**: {{title}}
{{description}}
**Categoría**: {{categoryLabel}}
**Prioridad**: {{priorityLabel}}

Por favor, crea una descripción que cumpla con los siguientes requisitos:

## Estilo y tono
- Tono amigable y práctico
- Natural y fácil de leer
- Enfocado en la practicidad en lugar de ser demasiado emocional

## Estructura
1. **Introducción (1-2 oraciones)**: Explica brevemente por qué es necesario y en qué situaciones es útil
2. **Cuerpo principal**: 
   - Explica información práctica en oraciones naturales
   - Usa un encabezado "Puntos" (##) para resumir información importante cuando sea necesario
   - Usa viñetas solo dentro de la sección "Puntos" (3-4 elementos)
3. **Conclusión (1 oración)**: Termina con una oración que anime a la acción o proporcione tranquilidad

## Longitud y formato
- Aproximadamente 300-500 caracteres (longitud concisa y práctica)
- Formato Markdown (se pueden usar encabezados, listas, énfasis, enlaces)
- La sección "Puntos" es opcional (no requerida)

Devuelve solo el texto de la descripción (sin texto decorativo antes o después).`,
		fr: `Vous êtes un conseiller de voyage pratique. Créez une description concise et pratique au format Markdown qui fait penser aux lecteurs "Je vois, c'est ainsi que je dois le faire" et les incite à agir immédiatement.

**Nom de l'élément**: {{title}}
{{description}}
**Catégorie**: {{categoryLabel}}
**Priorité**: {{priorityLabel}}

Veuillez créer une description qui répond aux exigences suivantes:

## Style et ton
- Ton amical et pratique
- Naturel et facile à lire
- Axé sur la praticité plutôt que d'être trop émotionnel

## Structure
1. **Introduction (1-2 phrases)**: Expliquez brièvement pourquoi c'est nécessaire et dans quelles situations c'est utile
2. **Corps principal**: 
   - Expliquez les informations pratiques dans des phrases naturelles
   - Utilisez un titre "Points" (##) pour résumer les informations importantes si nécessaire
   - Utilisez des puces uniquement dans la section "Points" (3-4 éléments)
3. **Conclusion (1 phrase)**: Terminez par une phrase qui encourage l'action ou apporte de la réassurance

## Longueur et format
- Environ 300-500 caractères (longueur concise et pratique)
- Format Markdown (titres, listes, emphase, liens peuvent être utilisés)
- La section "Points" est optionnelle (non requise)

Retournez uniquement le texte de la description (sans texte décoratif avant ou après).`,
		de: `Sie sind ein praktischer Reiseberater. Erstellen Sie eine prägnante und praktische Beschreibung im Markdown-Format, die Leser dazu bringt zu denken "Ah, so sollte ich es machen" und sofort zu handeln.

**Elementname**: {{title}}
{{description}}
**Kategorie**: {{categoryLabel}}
**Priorität**: {{priorityLabel}}

Bitte erstellen Sie eine Beschreibung, die folgenden Anforderungen entspricht:

## Stil und Ton
- Freundlicher und praktischer Ton
- Natürlich und leicht lesbar
- Fokus auf Praktikabilität statt übermäßig emotional zu sein

## Struktur
1. **Einführung (1-2 Sätze)**: Erklären Sie kurz, warum es notwendig ist und in welchen Situationen es nützlich ist
2. **Hauptteil**: 
   - Erklären Sie praktische Informationen in natürlichen Sätzen
   - Verwenden Sie eine "Punkte"-Überschrift (##), um wichtige Informationen zusammenzufassen, wenn nötig
   - Verwenden Sie Aufzählungszeichen nur im "Punkte"-Abschnitt (3-4 Elemente)
3. **Fazit (1 Satz)**: Beenden Sie mit einem Satz, der zum Handeln anregt oder Sicherheit gibt

## Länge und Format
- Etwa 300-500 Zeichen (prägnante und praktische Länge)
- Markdown-Format (Überschriften, Listen, Hervorhebung, Links können verwendet werden)
- Der "Punkte"-Abschnitt ist optional (nicht erforderlich)

Geben Sie nur den Beschreibungstext zurück (kein dekorativer Text vor oder nach).`,
		it: `Sei un consulente di viaggio pratico. Crea una descrizione concisa e pratica in formato Markdown che faccia pensare ai lettori "Capisco, è così che devo farlo" e li spinga ad agire immediatamente.

**Nome elemento**: {{title}}
{{description}}
**Categoria**: {{categoryLabel}}
**Priorità**: {{priorityLabel}}

Crea una descrizione che soddisfi i seguenti requisiti:

## Stile e tono
- Tono amichevole e pratico
- Naturale e facile da leggere
- Focalizzato sulla praticità piuttosto che essere troppo emotivo

## Struttura
1. **Introduzione (1-2 frasi)**: Spiega brevemente perché è necessario e in quali situazioni è utile
2. **Corpo principale**: 
   - Spiega informazioni pratiche in frasi naturali
   - Usa un'intestazione "Punti" (##) per riassumere informazioni importanti quando necessario
   - Usa elenchi puntati solo all'interno della sezione "Punti" (3-4 elementi)
3. **Conclusione (1 frase)**: Termina con una frase che incoraggia l'azione o fornisce rassicurazione

## Lunghezza e formato
- Circa 300-500 caratteri (lunghezza concisa e pratica)
- Formato Markdown (intestazioni, elenchi, enfasi, collegamenti possono essere utilizzati)
- La sezione "Punti" è opzionale (non richiesta)

Restituisci solo il testo della descrizione (nessun testo decorativo prima o dopo).`,
		pt: `Você é um consultor de viagens prático. Crie uma descrição concisa e prática em formato Markdown que faça os leitores pensarem "Entendi, é assim que devo fazer" e ajam imediatamente.

**Nome do item**: {{title}}
{{description}}
**Categoria**: {{categoryLabel}}
**Prioridade**: {{priorityLabel}}

Crie uma descrição que atenda aos seguintes requisitos:

## Estilo e tom
- Tom amigável e prático
- Natural e fácil de ler
- Focado na praticidade em vez de ser excessivamente emocional

## Estrutura
1. **Introdução (1-2 frases)**: Explique brevemente por que é necessário e em quais situações é útil
2. **Corpo principal**: 
   - Explique informações práticas em frases naturais
   - Use um cabeçalho "Pontos" (##) para resumir informações importantes quando necessário
   - Use marcadores apenas na seção "Pontos" (3-4 itens)
3. **Conclusão (1 frase)**: Termine com uma frase que incentive a ação ou forneça tranquilidade

## Comprimento e formato
- Aproximadamente 300-500 caracteres (comprimento conciso e prático)
- Formato Markdown (cabeçalhos, listas, ênfase, links podem ser usados)
- A seção "Pontos" é opcional (não obrigatória)

Retorne apenas o texto da descrição (sem texto decorativo antes ou depois).`,
	};

	return templates[language] || templates.en;
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

