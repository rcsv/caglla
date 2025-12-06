# Gemini API モデル名エラーについての質問プロンプト

## 質問内容

以下のプロンプトをGemini（またはGoogle AI Studio）に質問してください：

---

**質問プロンプト：**

```
@google/generative-ai パッケージ（Node.js）を使用してGemini APIを呼び出そうとしていますが、404エラーが発生しています。

【環境】
- Node.js 22.20.0
- @google/generative-ai 0.24.1
- Next.js 16.0.7
- サーバーサイド（API Route）で実行

【エラーメッセージ】
```
[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent: [404 Not Found] models/gemini-1.5-flash-latest is not found for API version v1beta, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.
```

【試したモデル名】
1. `gemini-1.5-flash` → 404エラー
2. `gemini-1.5-flash-latest` → 404エラー

【コード例】
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
const result = await model.generateContent(prompt);
```

【やりたいこと】
旅行チェックリスト項目の詳細説明文（longDescription）を自動生成したい。

【質問】
1. @google/generative-ai 0.24.1で使用できる正しいモデル名は何ですか？
2. `v1beta` APIバージョンで利用可能なモデル名の一覧を教えてください
3. チェックリスト項目の説明文生成に適したモデルはどれですか？（コストと速度のバランスを考慮）
4. モデル名の指定方法に問題はありませんか？

よろしくお願いします。
```

---

## 補足情報

### 使用しているAPIキーの種類
- Google AI Studio（makersuite.google.com）で取得したAPIキーを使用

### エラーが発生するタイミング
- チェックリスト生成時に、`longDescription`がない項目に対して自動生成を試みた際

### 期待する動作
- モデル名を正しく指定して、テキスト生成が成功すること

---

## 回答を受けた後の対応

1. 正しいモデル名が判明したら、`lib/ai/gemini-client.ts`のモデル名を更新
2. 動作確認
3. 必要に応じて、他のモデル名も試す（gemini-1.5-pro、gemini-proなど）

