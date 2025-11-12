# Issue: v2.2.0 向けテストカバレッジ拡張

**作成日**: 2025-11-13  
**状態**: 🟡 対応中  
**優先度**: 中  
**種類**: Improvement（Test）

---

## 📋 概要

v2.2.0 ではチェックリスト生成や予約UIの大幅な改修を行ったが、以下の領域で自動テストが未整備のまま残っている。今後のリグレッション防止と安心感向上のため、段階的にテストを追加したい。

---

## ✅ 追加済みテスト
- `getSecondaryCategoryIconName` のアイコン割り当て（`lib/data/__tests__/activity-categories.test.ts`）

---

## 🧪 追加が必要なテスト

1. **チェックリスト生成ロジック**  
   - 対象: `lib/checklist-generator.ts` / `/api/trips/[tripSlug]/checklist/generate`  
   - 内容: `tripSlug` → `tripId` 解決、`day_id` 単位の旅程取得、`personal_car` / `parking` など新カテゴリのルール適用

2. **タイムゾーン保持**  
   - 対象: `components/trip/ScheduleCard.tsx`  
   - 内容: `place_data` が再設定されてもユーザーが手動で選んだ `timezone` が上書きされないことを検証

3. **予約URLバリデーション**  
   - 対象: `isAllowedReservationUrl`（`lib/utils/reservation-utils.ts`）  
   - 内容: `https` 必須判定、ホスト名なし/無効URLの取り扱い

4. **予約テンプレート保存フロー**  
   - 対象: `ReservationTemplateModal` / `ReservationInfoModal`  
   - 内容: 「テンプレートとして保存」ボタンからモーダルが開き、初期値に予約内容が流し込まれること

---

## 🧭 進め方の提案
- 優先度: 1 → 2 → 3 → 4 の順で着手する（API保護とユーザーデータの信頼性を最優先）。
- 可能であれば `pnpm test -- lib/checklist` のようにディレクトリ単位で回せるようテスト配置を調整する。
- 追加後は CI での `pnpm test` 実行時間を監視し、必要に応じてテストのモック化・分割を検討する。

---

**担当候補**: TBD  
**関連ファイル**: `lib/checklist-generator.ts`, `app/api/trips/[tripSlug]/checklist/generate/route.ts`, `components/trip/ScheduleCard.tsx`, `lib/utils/reservation-utils.ts`, `components/modals/ReservationTemplateModal.tsx`
