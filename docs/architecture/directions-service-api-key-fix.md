# Directions Service APIキーエラーの修正

## 🐛 エラー内容

```
Directions Service: This API key is not authorized to use this service or API.
```

## 🔍 原因

`components/trip/TripMap.tsx`でGoogle Maps JavaScript APIの`DirectionsService`を使用していますが、フロントエンド用APIキー（`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`）に**Directions API**が有効になっていない可能性があります。

## ✅ 解決方法

### Google Cloud Consoleでの設定

1. **APIを有効化**
   - Google Cloud Console → APIs & Services → Library
   - **Directions API** を検索して有効化
   - **Maps JavaScript API** も有効になっていることを確認

2. **APIキーの設定を確認**
   - APIs & Services → Credentials
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` に対応するAPIキーを選択
   - **API restrictions** で以下が有効になっていることを確認：
     - ✅ Maps JavaScript API
     - ✅ Directions API（**追加が必要**）
   - **Application restrictions** でサイト制限が設定されていることを確認

## 📝 注意点

- **Directions API** は、サーバーサイド用（`GOOGLE_MAPS_API_KEY`）とフロントエンド用（`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`）の**両方**で有効にする必要があります
- フロントエンド用キーでは、Google Maps JavaScript API経由でDirections Serviceを使用します
- サーバーサイド用キーでは、Directions API（REST API）を直接使用します

## 🔄 整理案ドキュメントの更新

`docs/architecture/api-keys-organization.md`を更新して、フロントエンド用キーにDirections APIが含まれることを明記しました。
