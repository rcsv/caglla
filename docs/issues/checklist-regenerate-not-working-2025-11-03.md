# Issue: Regenerate Checklist が動作しない（再発）

- 作成日: 2025-11-03
- 状態: ✅ 解決済み
- 種別: バグ（認証ヘッダー未付与）
- 関連: `docs/issues/trip-slug-checklist-regenerate-not-working.md`（過去Issue）

---

## 現象
- 旅行詳細のChecklistで「Regenerate Checklist」をクリックしても生成されない
- UI上はスピナー→復帰するが、アイテムが更新されない

## 原因
- クライアント側の再生成リクエストが素の`fetch`で送られており、`Authorization: Bearer <ID token>` が付与されていないため、`/api/trips/[tripSlug]/checklist/generate`（認証必須）で401→early return。UI側で`res.ok`のみ判定し、失敗時の表示がなく気づきにくい。

該当コード（Before）:
```startLine:endLine:components/trip/TripChecklistView.tsx
45:      const res = await fetch(`/api/trips/${tripId}/checklist/generate`, { method: 'POST' })
```

## 修正
- `makeAuthenticatedRequest` を使用してIDトークンを自動付与
```startLine:endLine:components/trip/TripChecklistView.tsx
45:      const res = await makeAuthenticatedRequest(`/api/trips/${tripId}/checklist/generate`, { method: 'POST' })
```
- 失敗時に`console.error`で内容を出力

## 影響範囲
- `TripChecklistView` の再生成操作のみ
- 既存のGET/PUTは非認証でも動作（現状維持）

## 受け入れ基準
- 認証済みユーザーで再生成が成功し、`trip_checklists/{tripId}`に保存される
- UI上で新しいアイテムが表示される
- 非認証時は401のまま（保護維持）

---

## 備考
- 将来的にはGET/PUTも`makeAuthenticatedRequest`へ統一し、更新系は全て認証保護する方針を検討。
