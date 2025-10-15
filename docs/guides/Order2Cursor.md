# Cursor のオーダー

## 最初

next.jsのプロジェクトとして構築している。.env.localの値を見て、firebase での OAuth 連携でログインするアプリを構築したい。
用途は、wanderlog のような旅行管理アプリ。

### テーブル
- users         (google_associated_id連携用、ユーザー名)
- trips         (user_id を持ち登録したユーザーが CRUD できる。旅行のタイトル、出発日、帰宅日、旅行先の場所をデータとして保持。access_level を持ち、private と public に変化する。private の場合、自分と、trip_user に登録されているユーザー以外閲覧できない)
- days          (trip_id を持ち、登録したユーザーがCRUD できる。)
- itineraries   (day_id を持ち、sort_number も持つ。それぞれの旅程の内容・旅程順序を保持できる)
- trip_user     HABTM で、trip データを見ても良いユーザーを登録する

### URL
- /             トップページ
- /home         ログインしたユーザーのトップページ
- /trip/[id]    trips テーブルの任意のレコードに紐付いているデータ。trips, days, itineraries などを操作する SPA として動作する
- /user/[id]    ユーザープロフィール

### API Route案
定石があれば、変更したい。
- /api/trip/create
- /api/trip/delete/[id] 
- /api/trip/update/[id]
- /api/trip/[id]/day

### OAuth
firebaseでOAuth。
