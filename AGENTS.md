# AGENTS.md

This repository, **Caglla Travel Manager**, is a Node.js + TypeScript web application designed to manage personal travel itineraries. It is inspired by the features of [tabi4.me](https://tabi4.me) and serves as its GitHub-hosted replica.

---

## 🧭 Purpose

This project aims to support the creation, editing, and sharing of travel plans. Users can log in using Google accounts and manage their travel data, including trips, itineraries, and detailed activities like lodging, flights, dining, and more.

---

## 📁 Directory Structure (Simplified)

| Path                  | Purpose                                                |
|-----------------------|--------------------------------------------------------|
| `src/routes/`         | Express route definitions (REST API endpoints)         |
| `src/controllers/`    | Core business logic for each route                     |
| `src/models/`         | MySQL table definitions using Sequelize or raw SQL     |
| `scripts/`            | ビルドの際のユーティリティ                               |
| `srcipts/migrations/` | SQL migration files to set up schema                   |
| `public/`             | Static HTML/CSS/JS assets (if applicable)              |
| `config/`             | DB, OAuth, and environment configuration               |

---

## 🔐 Authentication

- Google OAuth 2.0 is used for login.
- User profile information is stored in the `users` table.
- No local password handling is implemented (OAuth only).

---

## 🗃️ Data Model (Simplified)

Entities and their relationships mirror `tabi4.me`. Key tables include:

- `users` — user identity (OAuth-based)
- `travels` — each travel plan (one-to-many with users)
- `activities` — detailed scheduled events linked to a travel
- `lodging`, `flight`, `car_rental`, etc. — activity subtypes (type-specific fields)
- `persons` — companions or profile identities
- `checklist_items`, `emergency_contacts`, `milestones` — optional trip data

_Note: `activities` are polymorphic and unified — one table holds different activity types, distinguishable by `activity_type`._

---

## 💡 Agent Instructions (Codex, Copilot, etc.)

### When adding a new REST endpoint:
- Define the route in `src/routes/`.
- Add handler logic in `src/controllers/`.
- If DB access is needed, use existing DB abstraction in `models/` or use raw SQL via `mysql2`.

### When creating a new table:
- Define SQL in `src/migrations/`.
- If applicable, define TypeScript types in `models/`.

### For migrations:
- Use `000_reset.sql` to drop all existing tables before rebuild.
- Each migration file should be id-prefixed: `001_create_users.sql`, `002_create_travels.sql`, etc.

### Naming Conventions:
- Table fields use `snake_case`.
- Foreign keys follow the convention `*_id`.
- All master data tables are prefixed with `mst_`, e.g., `mst_airport`, `mst_airline`.

### Reserved Words:
- Avoid using MySQL reserved keywords (e.g., `order`, `group`, `index`) as column names.

### Z-Index Layer Management System:
- **ALWAYS** use the centralized z-index management system in `lib/z-index-layers.ts`
- **NEVER** use hardcoded z-index values like `z-[9999]` or `z-50`
- Use `getZIndexClass(layer, offset)` for Tailwind CSS classes
- Use `getZIndex(layer, offset)` for direct values

**Available Layers:**
- `MAP` (0): 地図（最下層）
- `MAIN_CONTENT` (10): 左ペイン・メインコンテンツ
- `LEFT_PANEL` (20): 左ペイン・左メニュー
- `SETTINGS_DIALOG` (30): セッティングダイアログ
- `POPUP_MENU` (40): ポップアップメニュー
- `FLOAT_MODAL` (50): フロートのモーダル

**Usage Examples:**
```typescript
// ✅ Correct
const menuClass = getZIndexClass('POPUP_MENU') // 'z-[40]'
const subMenuClass = getZIndexClass('POPUP_MENU', 1) // 'z-[41]'

// ❌ Wrong
const menuClass = 'z-[9999]' // Don't use hardcoded values
```

### Environment Variable Management System:
- **ALWAYS** use the centralized environment validation in `lib/env-validation.ts`
- **NEVER** access `process.env` directly without validation
- Use `validateClientEnvironment()` for client-side validation
- Use `validateServerEnvironment()` for server-side validation

**Required Environment Variables:**
- Firebase: `NEXT_PUBLIC_FIREBASE_*` (API_KEY, AUTH_DOMAIN, PROJECT_ID, etc.)
- Google APIs: `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Firebase Admin: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

**Usage Examples:**
```typescript
// ✅ Correct
import { validateClientEnvironment } from '@/lib/env-validation'
const env = validateClientEnvironment()
const apiKey = env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

// ❌ Wrong
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY // Direct access
```

### Type Definition Management System:
- **ALWAYS** use centralized type definitions in `lib/types.ts`
- **NEVER** define duplicate interfaces across files
- All shared types should be exported from `lib/types.ts`

**Key Type Categories:**
- User & Authentication: `User`, `UserPreferences`
- Travel Data: `Trip`, `Day`, `Itinerary`, `PlaceData`
- API Responses: `PlaceSearchResult`, `GeocodingResult`, `WeatherData`
- Environment: `RequiredEnvVars`, `OptionalEnvVars`

### API Integration Management System:
- **ALWAYS** use centralized API helpers instead of direct API calls
- **NEVER** make direct API calls to external services

**Available API Helpers:**
- `placesApiHelpers` (`lib/places-api.ts`): Google Places API integration
- `geocodingApiHelpers` (`lib/geocoding-api.ts`): Google Geocoding API integration
- `weatherApiHelpers` (`lib/weather-api.ts`): Weather API integration
- `makeAuthenticatedRequest` (`lib/api-helpers.ts`): Authenticated API requests

**Usage Examples:**
```typescript
// ✅ Correct
import { placesApiHelpers } from '@/lib/places-api'
const results = await placesApiHelpers.searchPlaces('Tokyo')

// ❌ Wrong
const response = await fetch('https://maps.googleapis.com/maps/api/place/...')
```

### Subscription & Plan Management System:
- **ALWAYS** use the centralized subscription system in `lib/subscription-context.tsx`
- **NEVER** hardcode plan limits or features
- Use `PlanLimitChecker` (`lib/plan-limits.ts`) for limit validation

**Available Plans:**
- `season_traveler`: 無料プラン（基本機能）
- `backpacker`: 月額480円（ルート最適化、カスタム機能）
- `globetrotter`: 月額980円（全機能、無制限）

**Usage Examples:**
```typescript
// ✅ Correct
import { useSubscription } from '@/lib/subscription-context'
const { canUseRouteOptimization, checkPlanLimits } = useSubscription()

// ❌ Wrong
const canOptimize = user.plan === 'premium' // Hardcoded check
```

### Timezone Management System:
- **ALWAYS** use the centralized timezone utilities in `lib/timezone-utils.ts`
- **NEVER** hardcode timezone mappings
- Use `CITY_TIMEZONE_MAP` for city-to-timezone conversion

**Usage Examples:**
```typescript
// ✅ Correct
import { timezoneUtils } from '@/lib/timezone-utils'
const timezone = timezoneUtils.getTimezoneFromCity('Tokyo')

// ❌ Wrong
const timezone = 'Asia/Tokyo' // Hardcoded timezone
```

---

## 📦 Setup Notes

- Install dependencies: `npm install`
- Environment vars required:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Start dev server: `npm run dev`
- Run migrations manually or with custom script.

---

## 🧪 Future Support for Agents

- Linting: ESLint + Prettier
- Unit testing: Mocha or Jest (planned)
- PDF Export (via server-side Puppeteer or SelectPDF): TBD

---

## 🙋 Questions for Human Developers?

If you are unsure about:
- Activity subtype structures
- How travel statuses like `BOARDING`, `ITINERARY_INK`, `MEMORIES` are calculated
- How checklist generation works
→ Please consult `README.md` or contact the repo owner.

---

## 🧪 Local Test Environment (build_and_run)

This repository includes a simple test-runner script for initializing a local dev/testing environment.

You can run the app in trial mode with:

- **Windows**:
```bash
scripts\build_and_run.bat
```
- **Unix/macOS/Linux**:
```bash
./scripts/build_and_run.sh
```
These scripts will:
1. Set up the database (drop & recreate if needed)
2. Run all SQL migrations in `src/migrations/`
3. Start the server with default or environment-based configs

This allows agents or developers to quickly spin up the backend without manually configuring everything.

> ❗ Make sure required env vars (OAuth + DB credentials) are set beforehand.