# Create Trip UX再設計提案

## 背景
- 現行の「Create New Trip」ダイアログでは `accessLevel`（public/private）と `isTemplate` の組み合わせで4通りのモードを同時に扱っている。
- しかし実際の利用イメージとしては「作成直後は必ず非公開で編集し、準備が整ったら公開する」ため、作成時に公開状態を選ばせる必要がない。
- Private 旅行の作成中に Template モードを選ぶケースは想定しづらく、ユーザーの意図を読み取りにくい UI になっている。

## 現状課題
- 作成直後に公開設定を選べてしまうため「公開テンプレート」も即時に公開されると誤解される。
- `accessLevel` と `isTemplate` の組み合わせが直感的でなく、特に「private × template」が不明瞭。
- 「公開テンプレートから自分の旅行を複製」する導線が Create ダイアログ内に存在する前提になっており、作成フローが複雑化している。
- サーバー側で `accessLevel` を制御しきれておらず、クライアントからの入力に依存している部分が残っている。

## 解決方針
- **Visibility原則**: 新規作成およびテンプレ複製はすべて `access_level: 'private'` で保存し、公開操作は作成後に明示的に行う。
- **フロー整理**: Create ダイアログは「旅行を作成」「テンプレートを作成」の2モードに限定。公開テンプレ複製はテンプレ表示画面から行う。
- **Publish操作の明示化**: 旅行詳細画面に「公開」アクションを配置し、準備完了後に `access_level: 'public'` に昇格させる。
- **サーバ強制**: API 側で `access_level: 'private'` を強制し、クライアントからの公開指定は受け付けない。

## ユースケース別フロー

### 1. 通常の旅行を作成
- ダイアログで「旅行を作成」を選択。
- 入力項目: 目的地（必須）、開始日（必須）、終了日（必須）。日付バリデーションを実施。
- Submit 時のリクエスト: `is_template: false`。サーバー側で `access_level: 'private'` をセット。
- 作成後は旅行詳細画面で編集し、公開したくなった段階で「Publish」ボタンを使用。

### 2. テンプレートを作成
- ダイアログで「テンプレートを作成」を選択。
- 入力項目: 目的地（必須）、日数（必須・1以上）。開始日/終了日は非表示。
- Submit 時のリクエスト: `is_template: true`。サーバー側で `access_level: 'private'` をセット。
- 作成後はテンプレ編集を private 状態で継続し、公開時に「Publish Template」操作を明示的に実行。

### 3. 公開テンプレートから複製
- 公開テンプレートの閲覧画面（`/app/[userSlug]/[tripSlug]/page.tsx`）に「このテンプレートから自分の旅行を作成」ボタンを配置。
- ボタン押下で:
  1. サーバー API (`POST /api/trip/[tripSlug]/replica`) を呼び、`is_template: false` かつ `access_level: 'private'` な新規旅行を生成。
  2. テンプレ由来の目的地を利用し、ユーザーに開始日を入力させる UI を提示（終了日は開始日＋テンプレ日数で自動算出、必要なら後で編集可能）。
- 生成直後は private のまま、旅行詳細画面で編集・公開操作へ進む。
- Create ダイアログ内での処理は行わない。

## サーバー/API 仕様変更
- `POST /api/trips`:
  - 受信ペイロードに `accessLevel` が存在しても無視。
  - 保存時に `access_level: 'private'` を強制セット。
  - `is_template` はモードに応じてセット。
- `POST /api/trip/[tripSlug]/replica`:
  - 既存実装を維持しつつ、`access_level: 'private'` と `is_template: false` を保証するテスト/コメントを追加。
  - 目標終了日などテンプレ依存の副作用があれば整理。
- 新規公開 API:
  - `POST /api/trip/[tripId]/publish`（旅行向け）および `POST /api/template/[tripId]/publish`（テンプレ向け）を追加するか、単一エンドポイントで `mode` 指定。
  - 所有者チェックと公開前バリデーション（タイトル、カバー画像など）を実装。

## フロントエンド変更
- `CreateTripDialog.tsx`:
  - `accessLevel` セレクタを削除し、モード選択用のタブ/Segmented Control を導入。
  - モードごとに必須項目/バリデーションを切り替える。
  - 「作成後は非公開。公開は後で行います」といった注記をUIに追加。
- テンプレ表示画面:
  - 所有者以外が閲覧中かつ `is_template: true` かつ `access_level: 'public'` の場合、「このテンプレートから自分の旅行を作成」ボタンを表示。
  - ボタン押下で複製 API を呼び、開始日入力 UI を表示（モーダル or 新画面）。
  - 作成完了後、旅行詳細画面へリダイレクト。
- 旅行詳細画面:
  - 所有者向けに「Publish」ボタンを表示。
  - テンプレ用と旅行公開用を明示して操作を分ける、またはモーダルで選択させる。

## データ/不変条件
- `Trip.access_level` は `private` または `public` の2値。
- いかなる作成パスでも保存直後は `access_level: 'private'`。
- テンプレ作成は `is_template: true` をセット、公開テンプレ複製は `is_template: false` をセット。
- 既存のスラッグ生成は `lib/slug-utils.ts` を使用する（新規ルール追加なし）。

## テスト計画
- API レベル:
  - 新規作成で常に `access_level: 'private'` になることを確認するユニットテスト。
  - 複製 API が private 旅行を生成することのテスト。
  - Publish API が適切に権限チェックと状態遷移を行うことのテスト。
- フロント UI:
  - モード切替による必須項目バリデーションの挙動。
  - テンプレ閲覧画面での複製ボタン表示条件。
  - Publish ボタン押下時の API 呼び出しとエラーハンドリング。

## 受け入れ条件（Acceptance Criteria）
- Create ダイアログには公開/非公開の直接選択 UI が存在しない。
- 「旅行を作成」「テンプレートを作成」モードがあり、各モードの必須項目が適切に制御される。
- 公開テンプレ閲覧画面に「このテンプレートから自分の旅行を作成」ボタンが表示され、押下で private 旅行が生成される。
- すべての新規作成・複製処理で `access_level: 'private'` が保証される。
- 公開は旅行詳細画面の Publish 操作でのみ行える。
- Publish 操作時に必要なバリデーションが実施され、成功後に `access_level: 'public'` へ遷移する。

## 追加検討事項
- Publish 前プレビュー（Next.js Draft Mode 等）は将来的な改善項目とし、本提案では必須としない。
- プラン制限（RestrictionProvider）による公開・テンプレ作成制約が必要な場合は、Publish 操作やテンプレ作成モードにフックを追加する。
- UI文言（i18n）の追加・更新が必要。キーは `trip.create.mode.*` や `trip.template.duplicate` 等で統一する。

---

この文書は UX 見直しの方針を示すものであり、後続タスクで実装・テスト・ドキュメント更新を行う。

