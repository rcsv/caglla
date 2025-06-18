# Caglla Travel Manager

This is a simple Node.js web application that provides personal travel management for each user.
Authentication is handled via Google OAuth 2.0 and users can perform CRUD operations on
travels and their itineraries.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set the Google OAuth credentials and DB settings:

```bash
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret
export DB_HOST=localhost
export DB_USER=db-user
export DB_PASSWORD=db-password
export DB_NAME=caglla
```

3. Build and run:

```bash
npm run build
npm start
```

## Features

- Login with Google OAuth 2.0
- Create, read, update and delete travels
- Create, read, update and delete itineraries (activities) within a travel

---

## 📘 Data Schema Overview

The application follows the same data structure as the original [tabi4.me](https://tabi4.me) project.

### 🧳 travels (旅行情報)

| Field               | Type          | Description                            |
|--------------------|---------------|----------------------------------------|
| `id`               | UUID / INT    | Primary key                            |
| `title`            | TEXT          | Trip name                              |
| `trip_purpose`     | TEXT          | Purpose of trip (shown in PDF)         |
| `start_date`       | DATE          | Start date                             |
| `end_date`         | DATE          | End date                               |
| `primary_transportation` | ENUM     | 徒歩 / バス / 電車 / 車 / 飛行機 / フェリー / 自転車 / その他 |
| `allowed_users`    | JSON or FK[]  | Users with access permissions          |

---

### 📅 activities (旅程アクティビティ = itinerary)

All types of travel plans are unified here.

| Field           | Type       | Description                                |
|----------------|------------|--------------------------------------------|
| `id`           | UUID       | Primary key                                |
| `trip_id`      | FK         | Linked trip                                |
| `title`        | TEXT       | Activity title                             |
| `start_time`   | DATETIME   | Start time                                 |
| `end_time`     | DATETIME   | End time                                   |
| `location_name`| TEXT       | Display name of location                   |
| `place_id`     | TEXT       | Google Place ID                            |
| `category`     | ENUM       | flight / car_rental / hotel / dining / etc |
| `cost_amount`  | DECIMAL    | Expense amount (in local currency)         |
| `cost_currency`| TEXT       | ISO currency code (e.g., JPY, USD)         |

---

### 🧑‍🤝‍🧑 companions (同行者)

| Field         | Type     | Description                            |
|--------------|----------|----------------------------------------|
| `id`         | UUID     | Primary key                            |
| `trip_id`    | FK       | Related trip                           |
| `person_id`  | FK       | Linked to `persons` table              |

---

### 🧑 persons (人物プロフィール)

| Field            | Type     | Description                         |
|------------------|----------|-------------------------------------|
| `id`             | UUID     | Primary key                         |
| `first_name`     | TEXT     | First name                          |
| `last_name`      | TEXT     | Last name                           |
| `date_of_birth`  | DATE     | DOB (for age-based checklist)       |
| `passport_code`  | TEXT     | Passport number                     |
| `it_is_myself`   | BOOLEAN  | If this is the logged-in user       |

---

## 📄 Page Layouts (UI 構成)

### index / home / dashboard

- Status grouping:
  - **BOARDING**: 次に出発する旅行（直前チェックリストあり）
  - **ITINERARY INK**: 未来の旅行（一覧形式）
  - **MEMORIES**: 過去の旅行（カード形式）

### Trip Detail

- 旅行名、目的、期間、主な交通手段（with icon）
- 同行者一覧
- 旅程（日毎、時系列表示）

### PDF Output (旅のしおり)

- 表紙、目次、チェックリスト、予約情報、日程表、緊急連絡先、メモページを含む構成
- SelectPDF による WYSIWYG レンダリング（1024×1449px）

---

## ✈️ Future Extensions

- Google Calendar 同期（手動 → 自動化予定）
- Place API による POI 情報補完
- Trip invitation / 共有機能
- 迷子札生成（PDF付録）