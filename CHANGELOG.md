# Changelog

このプロジェクトのすべての重要な変更は、このファイルに記録されます。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づいており、
バージョン管理は [Semantic Versioning](https://semver.org/lang/ja/) に準拠しています。

---

## [1.6.3] - 2025-10-18

### 追加
- **CHANGELOG.md**: 業界標準のKeep a Changelog形式で変更履歴を管理
- **docs/releases/**: リリースノート専用ディレクトリを新設
- **docs/releases/README.md**: リリースノート管理ガイド

### 変更
- **ドキュメント構造の整理**: `RELEASE_NOTES_v*.md`を`docs/releases/v*.md`に移動
- **README.md**: 変更履歴セクションを追加

**詳細**: [リリースノート v1.6.3](./docs/releases/v1.6.3.md)

---

## [1.6.2] - 2025-10-17

### 追加
- **SVGアイコンシステム**: 絵文字からSVGアイコンへの移行を開始
  - 15の新しいSVGアイコンコンポーネントを追加（AirplaneIcon, BackpackIcon, ChartIcon, 等）
  - SVGアイコンガイドライン (`components/common/icons/AGENTS.md`)
- **国旗表示機能**: 200以上の国と地域の国旗表示をサポート (`lib/utils/country-flags.ts`)
- **GitHubイシューテンプレート**: バグレポート、機能リクエスト、質問用のテンプレート
- **プロフィールページ**: `/[userSlug]` でアクセス可能な新しいプロフィールページ
  - 初回セットアップ機能（bio、居住地域、性別）
  - Google Places API統合による居住地域の自動選択

### 変更
- **UI/UX改善**: 18のコンポーネントで絵文字アイコンをSVGアイコンに置き換え
- **プロフィールURL**: `/user/[id]` から `/[userSlug]` に移行
- **必須フィールド表示**: ⚠️絵文字から赤いアスタリスク（*）に変更
- **ドキュメント充実化**: UI設計ガイドライン、アイコン移行計画を追加

### 修正
- `User`型に`bio`と`gender`フィールドを追加
- `/api/users` POSTエンドポイントで`bio`と`gender`を正しく処理
- Firestoreへの`bio`と`gender`の保存処理を修正

### 削除
- 旧プロフィールページ (`app/user/[id]/page.tsx`)

**詳細**: [リリースノート v1.6.2](./docs/releases/v1.6.2.md)

---

## リリースノートについて

- **簡潔な変更履歴**: このファイル (`CHANGELOG.md`)
- **詳細なリリースノート**: `docs/releases/` ディレクトリ内の各バージョンファイル

各バージョンの詳細については、`docs/releases/v*.md` を参照してください。

