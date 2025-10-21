# サポートブランチ管理チェックリスト

## 📋 概要

このチェックリストは、サポートブランチのライフサイクル管理を確実に実施するためのものです。

---

## 🌿 サポートブランチ作成時

### 新しいMINORバージョンリリース時

- [ ] 前のMINORバージョンのサポートブランチを作成
  ```bash
  git checkout main
  git checkout -b support/v1.X
  git push -u origin support/v1.X
  ```

- [ ] `AGENTS.md`に追記
  ```markdown
  #### support/v1.X (Active Support)
  - 状態: ✅ アクティブサポート中
  - 最新バージョン: v1.X.0
  - アクティブサポート終了予定: v1.Y.0リリース時
  - EOL予定: v1.Y.0リリース後30日
  ```

- [ ] ブランチ保護設定（GitHub）
  - 管理者のみpush可能
  - 重要な変更はレビュー推奨

- [ ] アナウンス作成
  ```markdown
  v1.X系のサポートブランチを作成しました
  - アクティブサポート: v1.Y.0リリースまで
  - セキュリティサポート: v1.Y.0リリース後30日
  ```

---

## 🔒 セキュリティパッチリリース時

### support/v1.X でのパッチ作業

- [ ] support/v1.Xブランチをcheckout
  ```bash
  git checkout support/v1.X
  git pull
  ```

- [ ] セキュリティ修正を実装
  - コードの修正
  - テストの実施
  - Lintチェック

- [ ] コミット・プッシュ
  ```bash
  git add .
  git commit -m "security: 修正内容"
  git push
  ```

- [ ] バージョン更新
  - `package.json` のバージョン更新（v1.X.Y）
  - `docs/releases/v1.X.Y.md` の更新

- [ ] タグ作成
  ```bash
  git tag v1.X.Y
  git push origin v1.X.Y
  ```

- [ ] GitHub Releaseの作成
  - セキュリティ修正の説明
  - 破壊的変更の有無
  - 移行ガイド（必要に応じて）

- [ ] mainブランチへの反映検討
  ```bash
  git checkout main
  git cherry-pick <commit-hash>
  git push
  ```

---

## 🌍 新MINORバージョンリリース時

### アクティブサポート終了

- [ ] 前のMINORバージョンのアクティブサポート終了をアナウンス
  ```markdown
  v1.X系はアクティブサポートを終了しました
  - セキュリティサポート期間: v1.Y.0リリース後30日
  - EOL予定日: YYYY-MM-DD
  - v1.Y.0への移行を推奨
  ```

- [ ] `AGENTS.md`を更新
  ```markdown
  #### support/v1.X (Security Support)
  - 状態: ⚠️ セキュリティサポート期間
  - EOL予定: YYYY-MM-DD
  - 推奨: v1.Y.0への移行
  ```

- [ ] セキュリティサポート期間の開始を告知
  - リリースノートに記載
  - ドキュメントに追記
  - 必要に応じてブログ投稿

---

## ⏰ EOL 2週間前

### EOL予告アナウンス

- [ ] EOL予告を発信
  ```markdown
  v1.X系 EOL予告
  - EOL日: YYYY-MM-DD
  - 以降、セキュリティパッチは提供されません
  - 必ずv1.Y.0以降に移行してください
  ```

- [ ] ドキュメントに警告を追加
  - `docs/releases/v1.X.*.md` にEOL予告
  - `AGENTS.md` にEOL予告日を明記

- [ ] ユーザーへの個別通知（必要に応じて）
  - メール通知
  - Dashboard通知
  - Slack/Discord通知

---

## 🗄️ EOL時

### サポート終了とアーカイブ化

- [ ] EOLアナウンス
  ```markdown
  v1.X系 EOL完了
  - v1.X系のサポートを終了しました
  - セキュリティパッチは提供されません
  - v1.Y.0以降への移行を強く推奨
  ```

- [ ] `AGENTS.md`を更新
  ```markdown
  #### support/v1.X (Archived)
  - 状態: 🗄️ アーカイブ（EOL）
  - 最終バージョン: v1.X.Y
  - EOL日: YYYY-MM-DD
  - 推奨: v1.Y.0以降への移行
  ```

- [ ] support/v1.XブランチのREADME.md更新
  ```markdown
  ## ⚠️ このブランチはアーカイブされています
  
  **サポート状況**: EOL（End of Life）
  **EOL日**: YYYY-MM-DD
  **推奨バージョン**: v1.Y.0以降
  ```

- [ ] ブランチ保護の解除（GitHub）
  - Branch protection rulesを削除または無効化
  - ブランチ自体は削除しない（履歴保存）

- [ ] ドキュメント整理
  - `docs/releases/v1.X.*.md` にEOL表示追加
  - `docs/security/` の該当記録をアーカイブ化

- [ ] 最終アナウンス
  - ブログ投稿（必要に応じて）
  - リリースノートに記載
  - Changelog更新

---

## 📊 定期チェック（月次）

### サポートブランチの健全性確認

- [ ] アクティブなサポートブランチの確認
  ```bash
  git branch -r | grep support/
  ```

- [ ] 各ブランチの状態確認
  - アクティブサポート中
  - セキュリティサポート期間
  - EOL済み

- [ ] EOL予定日の確認
  - 2週間以内にEOLがあるか
  - アナウンス済みか

- [ ] `AGENTS.md`の情報が最新か
  - 状態が正しいか
  - EOL予定日が正しいか
  - 最新バージョンが正しいか

- [ ] セキュリティ問題の確認
  - Critical脆弱性の有無
  - EOL後の例外対応が必要か

---

## 🚨 緊急時（Critical脆弱性発見）

### EOL後のブランチへの緊急対応

- [ ] 脆弱性の重要度評価
  - CVSS 9.0以上か
  - 広範囲に影響するか
  - データ漏洩の可能性があるか

- [ ] 対応可否の判断
  - リソース確保可能か
  - 影響範囲の特定
  - 対応期限の設定

- [ ] 対応する場合
  - サポートブランチでパッチ作成
  - 緊急リリース実施
  - 特別アナウンス発信

- [ ] 対応しない場合
  - 理由の明示
  - 代替案の提示（新バージョンへの移行）
  - ワークアラウンドの提供

---

## 📝 記録と報告

### 定期レポート作成（四半期）

- [ ] サポートブランチ活動レポート
  - リリース数
  - セキュリティパッチ数
  - ユーザー移行状況

- [ ] EOLスケジュール確認
  - 今後3ヶ月のEOL予定
  - アナウンス計画

- [ ] 改善提案
  - プロセスの改善点
  - ツール・自動化の検討

---

## 🔗 関連ドキュメント

- **EOLポリシー**: `docs/development/eol-policy.md`
- **ブランチ戦略**: `docs/development/branch-strategy.md`
- **リリースプロセス**: `docs/development/release-process.md`
- **セキュリティポリシー**: `docs/security/README.md`

---

**最終更新**: 2025年10月21日  
**管理者**: リポジトリオーナー

