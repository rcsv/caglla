# 左ナビゲーションメニュー改善：実装上の制約と準備

## 📊 現状の実装状況

### ✅ 利用可能なリソース

#### 1. ロゴコンポーネント
- **ファイル**: `components/common/icons/CagllaLogo.tsx`
- **説明**: Cagllaロゴ（緑の矩形背景に「Cg」テキスト）
- **利用方法**:
  ```tsx
  import { CagllaLogo } from '@/components/common/icons/CagllaLogo'
  
  <CagllaLogo className="w-8 h-8" />
  ```

#### 2. 認証・ユーザー情報
- **Auth Context** (`lib/contexts/auth.tsx`):
  ```tsx
  const { user, loading, signInWithGoogle, logout } = useAuth()
  
  // 利用可能な情報:
  // - user: Firebase User | null
  // - user.displayName: ユーザー名
  // - user.photoURL: アバターURL
  // - user.email: メールアドレス
  ```

- **UserData Context** (`lib/contexts/user-data.tsx`):
  ```tsx
  const { 
    userData,           // Firestore User document
    userDataLoading,
    userPlanId,        // PlanId enum (SEASON_TRAVELER, BACKPACKER, etc)
    planConfig,        // プラン設定
    trips,             // ユーザーの旅行一覧
    refreshUserData,
  } = useUserData()
  
  // 利用可能な情報:
  // - userData.name: ユーザー名
  // - userData.slug: ユーザーslug
  // - userData.avatar_url: アバターURL
  // - userPlanId: プランID
  // - planConfig.name: プラン名
  ```

#### 3. ドロップダウンメニュー実装パターン
- **参考実装**: `components/common/HomeHeader.tsx`
- **使用技術**:
  - React useState によるメニュー開閉状態管理
  - `useClickOutside` フック (`hooks/useClickOutside.ts`)
  - CSS `absolute` positioning + `fixed` positioning
  - Tailwind CSS クラス

- **実装パターン**:
  ```tsx
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  useClickOutside(menuRef, () => setMenuOpen(false))
  
  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setMenuOpen(v => !v)}>
        {/* トリガー */}
      </button>
      
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg zidx-popup-menu">
          {/* メニュー内容 */}
        </div>
      )}
    </div>
  )
  ```

#### 4. Z-Index管理システム
- **ファイル**: `lib/core/z-index.ts`
- **使用方法**:
  ```tsx
  import { getZIndexClass } from '@/lib/core/z-index'
  
  <div className={getZIndexClass('POPUP_MENU')}>
    {/* ポップアップメニュー */}
  </div>
  ```

- **利用可能なレイヤー**:
  - `POPUP_MENU`: ポップアップメニュー (z-index: 500)
  - `POPUP_MENU_CONTENT`: ポップアップメニュー詳細 (z-index: 550)
  - `LEFT_PANEL`: 左メニュー (z-index: 30)
  - `LEFT_PANEL_CONTENT`: 左メニュー詳細 (z-index: 50)

#### 5. アバター表示パターン
- **参考実装**: `components/common/HomeHeader.tsx` (lines 166-174)
  ```tsx
  <span className={`inline-flex p-[2px] rounded-full ${avatarBorderClass}`}>
    <Image
      src={avatarUrl || '/default-avatar.png'}
      alt="avatar"
      width={36}
      height={36}
      className="h-9 w-9 rounded-full object-cover bg-white ring-1 ring-white"
    />
  </span>
  ```

- **プラン別ボーダー色**:
  ```tsx
  const avatarBorderClass = (() => {
    const n = (planName || '').toLowerCase()
    if (n.includes('globetrotter')) return 'bg-purple-500'
    if (n.includes('backpacker')) return 'bg-blue-500'
    return 'bg-gray-200'
  })()
  ```

### ❌ 利用できないリソース

#### 1. UIライブラリ
- **@headlessui/react**: インストールされていない
- **@radix-ui/react-dropdown-menu**: インストールされていない
- **react-select**: インストールされていない

**結論**: ドロップダウンメニューは手作り実装が必要（既存パターンに従う）

#### 2. アイコンライブラリ（一部制限あり）
- **@iconify/react**: インストール済み（但し限定的に使用）
- **heroicons**: インストールされていない

**結論**: 既存の SVG アイコンコンポーネントを使用

## 🎯 実装方針

### 1. ロゴとヘッダー部分

**目標**: "Back to Home" → "Caglla" ロゴ + 折りたたみボタン

**実装方法**:
```tsx
// components/planner/NavigationMenu.tsx

<div className="border-b border-gray-200 p-3">
  <div className="flex items-center justify-between">
    {/* ロゴ部分 */}
    <Link
      href="/home"
      className="flex items-center gap-2 text-gray-900 hover:opacity-80 transition-opacity"
    >
      <CagllaLogo className={isCollapsed ? "w-6 h-6" : "w-8 h-8"} />
      {!isCollapsed && (
        <span className="text-xl font-bold font-rajdhani">Caglla</span>
      )}
    </Link>
    
    {/* 折りたたみボタン */}
    {!isCollapsed && (
      <button
        onClick={onToggleCollapse}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Collapse sidebar"
      >
        <svg className="w-5 h-5 text-gray-600" {...}>
          {/* 左矢印アイコン */}
        </svg>
      </button>
    )}
  </div>
</div>
```

**変更点**:
- `CagllaLogo` コンポーネントを使用
- "Back to Home" 削除（ロゴクリックで /home に遷移）
- ハンバーガー (☰) → 左矢印 (←) に変更
- "Menu" テキスト削除
- 折りたたみ時はロゴのみ表示

### 2. メニュー階層の視覚化

**目標**: 第1レイヤー（ページ遷移）と第2レイヤー（セクション）を視覚的に区別

**実装方法**:
```tsx
// 第1レイヤー（Summary, Itinerary, Checklist）
<span className="font-semibold text-gray-900">{section.title}</span>

// 第2レイヤー（Weather, Budget, etc）
<span className="font-normal text-gray-600">{item.title}</span>

// 第3レイヤー（Day 1, Day 2, etc）
<span className="font-normal text-gray-500 text-sm">{item.subtitle}</span>
```

**変更点**:
- 第1レイヤー: `font-medium` → `font-semibold`
- 第2レイヤー: `text-gray-900` → `text-gray-600`
- 第3レイヤー: サイズを若干小さく (`text-sm`)

### 3. ユーザーメニュー（最下部）

**目標**: "Logout" → アバター + ユーザー名 + ポップアップメニュー

**メニュー構成**: Profile + Logout のみ（シンプル化）
- "Back to Home" は **削除**（ロゴクリックで /home に遷移できるため冗長）
- 業界標準（Gmail, Notion, Slack）に準拠
- 明確な役割分担：ロゴ = ホーム、UserMenu = アカウント関連

**必要な情報**:
- ユーザー名: `userData?.name` または `user?.displayName`
- アバターURL: `userData?.avatar_url` または `user?.photoURL`
- プラン名: `planConfig?.name` または `userPlanId`（表示はオプション）
- ユーザーslug: `userData?.slug`

**実装上の問題点**:
❗ **NavigationMenu は現在 `trip` しか受け取っていない**

**解決策**:
1. **Option A**: NavigationMenu に `user` と `userData` を props として渡す
2. **Option B**: NavigationMenu 内で `useAuth()` と `useUserData()` を使用
3. **Option C**: UserMenu コンポーネントを分離して独立させる（推奨）

**推奨実装（Option C）**:
```tsx
// components/common/UserMenu.tsx (新規作成)
'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/lib/contexts/auth'
import { useUserData } from '@/lib/contexts/user-data'
import { useClickOutside } from '@/hooks/useClickOutside'
import { getZIndexClass } from '@/lib/core/z-index'
import Image from 'next/image'
import Link from 'next/link'

interface UserMenuProps {
  isCollapsed?: boolean
}

export function UserMenu({ isCollapsed = false }: UserMenuProps) {
  const { user, logout } = useAuth()
  const { userData, userPlanId } = useUserData()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  useClickOutside(menuRef, () => setMenuOpen(false))
  
  const userName = userData?.name || user?.displayName || 'User'
  const avatarUrl = userData?.avatar_url || user?.photoURL || '/default-avatar.png'
  const userSlug = userData?.slug
  
  if (isCollapsed) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="w-full flex justify-center p-1"
        >
          <Image
            src={avatarUrl}
            alt="avatar"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        </button>
        
        {menuOpen && (
          <div 
            className={`fixed left-14 bottom-2 w-48 bg-white border rounded-lg shadow-lg py-1 ${getZIndexClass('POPUP_MENU')}`}
          >
            {/* Profile */}
            {userSlug && (
              <Link
                href={`/${userSlug}`}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Profile
              </Link>
            )}
            
            {/* Logout */}
            <hr className="my-1 border-gray-200" />
            <button
              onClick={() => {
                setMenuOpen(false)
                logout()
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(v => !v)}
        className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <Image
          src={avatarUrl}
          alt="avatar"
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover"
        />
        <span className="flex-1 text-left text-sm font-medium text-gray-900 truncate">
          {userName}
        </span>
        <svg className="w-4 h-4 text-gray-500" {...}>
          {/* ドロップダウンアイコン */}
        </svg>
      </button>
      
      {menuOpen && (
        <div 
          className={`absolute left-0 right-0 bottom-full mb-1 bg-white border rounded-lg shadow-lg py-1 ${getZIndexClass('POPUP_MENU')}`}
        >
          {/* Profile */}
          {userSlug && (
            <Link
              href={`/${userSlug}`}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Profile
            </Link>
          )}
          
          {/* Logout */}
          <hr className="my-1 border-gray-200" />
          <button
            onClick={() => {
              setMenuOpen(false)
              logout()
            }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
```

**NavigationMenu での使用**:
```tsx
// components/planner/NavigationMenu.tsx

import { UserMenu } from '@/components/common/UserMenu'

// ... (既存コード)

{/* 下付きメニュー */}
<div className={`border-t border-gray-200 ${isCollapsed ? 'p-1' : 'p-2'}`}>
  <UserMenu isCollapsed={isCollapsed} />
</div>
```

## 🔧 実装タスク

### フェーズ1: ヘッダー部分（優先度: 高）
- [ ] `CagllaLogo` コンポーネントをインポート
- [ ] "Back to Home" リンクをロゴに置き換え
- [ ] ハンバーガーアイコンを左矢印に変更
- [ ] "Menu" テキストを削除
- [ ] 折りたたみ時の表示を調整

**予想作業時間**: 30分

### フェーズ2: メニュー階層（優先度: 高）
- [ ] 第1レイヤーのスタイルを `font-semibold` に変更
- [ ] 第2レイヤーのスタイルを `text-gray-600` に変更
- [ ] 第3レイヤーのスタイルを調整
- [ ] 視覚的なテスト（展開時・折りたたみ時）

**予想作業時間**: 30分

### フェーズ3: UserMenu コンポーネント作成（優先度: 高）
- [ ] `components/common/UserMenu.tsx` を新規作成
- [ ] `useAuth()` と `useUserData()` を使用
- [ ] アバター表示を実装
- [ ] ポップアップメニューを実装
- [ ] `useClickOutside` で外側クリックを検知
- [ ] 折りたたみ時の表示を実装

**予想作業時間**: 1時間

### フェーズ4: NavigationMenu 統合（優先度: 高）
- [ ] `UserMenu` を `NavigationMenu` にインポート
- [ ] 既存の "Logout" ボタンを削除
- [ ] `UserMenu` を最下部に配置
- [ ] Z-index の調整

**予想作業時間**: 30分

### フェーズ5: i18n 対応（優先度: 中）
- [ ] 新しい翻訳キーを追加
  - `nav.profile`: "Profile" / "プロフィール"
  - `nav.settings`: "Settings" / "設定"（将来実装用）
  - `nav.collapseSidebar`: "Collapse sidebar" / "サイドバーを閉じる"
- [ ] 各コンポーネントで `t()` 関数を使用

**予想作業時間**: 20分

### フェーズ6: テスト＆調整（優先度: 高）
- [ ] デスクトップでの表示確認
- [ ] モバイルでの表示確認
- [ ] 折りたたみ動作確認
- [ ] ポップアップメニューの動作確認
- [ ] z-index の競合確認
- [ ] ホバー効果の確認

**予想作業時間**: 30分

## 🚧 実装上の注意点

### 1. Z-Index の競合
- **問題**: UserMenu のポップアップが他の要素（POIDialog, Map Overlay など）に隠れる可能性
- **解決策**: `getZIndexClass('POPUP_MENU')` を使用して一貫性を保つ

### 2. 折りたたみ時の表示
- **問題**: 折りたたみ時にアバターのみを表示し、ポップアップメニューを適切な位置に配置する必要がある
- **解決策**: `fixed` positioning を使用し、`left-14` (56px) でサイドバーの右側に配置

### 3. AuthContext と UserDataContext の依存関係
- **問題**: `useAuth()` は Firebase User を返し、`useUserData()` は Firestore User document を返す
- **解決策**: 両方の情報を取得し、`userData` を優先、フォールバックとして `user` を使用

### 4. ローディング状態
- **問題**: ユーザー情報がロード中の場合の表示
- **解決策**: ローディング中はスケルトンまたは簡易表示

```tsx
if (!user && loading) {
  return (
    <div className="p-2">
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
    </div>
  )
}
```

### 5. プラン情報の表示
- **現状**: HomeHeader ではプラン名を表示している
- **NavigationMenu**: スペースが限られているため、プラン名の表示はオプション（省略可能）

## 📊 依存関係の整理

### 必須の依存関係
```
NavigationMenu
  ├─ CagllaLogo (components/common/icons/CagllaLogo)
  └─ UserMenu (components/common/UserMenu) ← 新規作成
       ├─ useAuth (lib/contexts/auth)
       ├─ useUserData (lib/contexts/user-data)
       ├─ useClickOutside (hooks/useClickOutside)
       ├─ getZIndexClass (lib/core/z-index)
       └─ Next.js Image, Link
```

### データフロー
```
Firebase Auth
  └─ AuthProvider (useAuth)
       ├─ user: Firebase User
       └─ logout()

Firestore
  └─ UserDataProvider (useUserData)
       ├─ userData: Firestore User document
       ├─ userPlanId: PlanId
       └─ planConfig: Plan configuration

UserMenu
  ├─ useAuth() → user, logout
  └─ useUserData() → userData, userPlanId
```

## 🎨 デザイン仕様

### カラースキーム
```tsx
// 第1レイヤー（ページ遷移）
text-gray-900, font-semibold

// 第2レイヤー（セクション）
text-gray-600, font-normal

// 第3レイヤー（サブアイテム）
text-gray-500, font-normal, text-sm

// ホバー
hover:bg-gray-50

// アクティブ
bg-blue-50, text-blue-600
```

### スペーシング
```tsx
// ヘッダー
p-3

// メニューアイテム
p-2

// アイコンとテキスト間
gap-2

// セクション間
space-y-2
```

## 🔄 段階的実装戦略

### ステップ1: ヘッダー部分のみ（最小限の変更）
- ロゴ追加
- 折りたたみボタン改善
- "Menu" テキスト削除

→ **この時点でコミット、動作確認**

### ステップ2: メニュー階層の視覚化
- フォントウェイトの調整
- 色の調整

→ **この時点でコミット、動作確認**

### ステップ3: UserMenu 作成（独立コンポーネント）
- UserMenu コンポーネントを作成
- 単体で動作確認

→ **この時点でコミット、動作確認**

### ステップ4: NavigationMenu に統合
- UserMenu を統合
- "Logout" ボタンを削除

→ **最終コミット**

## 📝 コミットメッセージ例

```
feat(nav): ロゴを追加し、折りたたみボタンを改善

- CagllaLogo コンポーネントを使用
- "Back to Home" を Caglla ロゴに置き換え
- ハンバーガーアイコンを左矢印に変更
- "Menu" テキストを削除
- 折りたたみ時の表示を調整
```

```
feat(nav): メニュー階層の視覚化を改善

- 第1レイヤー（ページ遷移）を font-semibold に
- 第2レイヤー（セクション）を text-gray-600 に
- 第3レイヤー（サブアイテム）を text-gray-500 に調整
- 視覚的な重要度が明確に
```

```
feat(nav): UserMenu コンポーネントを追加

- useAuth と useUserData から情報を取得
- アバター + ユーザー名を表示
- ポップアップメニューで Profile, Logout を提供
- 折りたたみ時はアバターのみ表示
- useClickOutside で外側クリックを検知
- ロゴクリックで /home に遷移するため、メニュー内の "Back to Home" は削除
```

```
feat(nav): NavigationMenu に UserMenu を統合

- 既存の "Logout" ボタンを削除
- UserMenu を最下部に配置
- z-index を調整してポップアップメニューが正しく表示されるように
- ロゴで /home に戻れるため、冗長な "Back to Home" は削除
```

## 🧪 テストチェックリスト

### 機能テスト
- [ ] ロゴをクリックして /home に遷移できる
- [ ] 折りたたみボタンでサイドバーが折りたたまれる
- [ ] 折りたたみ時にロゴのみが表示される
- [ ] メニュー階層が視覚的に区別できる
- [ ] UserMenu をクリックしてポップアップが開く
- [ ] ポップアップメニューの各項目が機能する
- [ ] 外側をクリックしてポップアップが閉じる
- [ ] Logout をクリックしてログアウトできる

### 表示テスト
- [ ] デスクトップ（1920x1080）
- [ ] ラップトップ（1366x768）
- [ ] タブレット（768x1024）
- [ ] モバイル（375x667）

### Z-Index テスト
- [ ] POIDialog を開いた状態で UserMenu が機能する
- [ ] マップオーバーレイが表示されている状態で UserMenu が機能する
- [ ] 他のモーダルが開いている状態で UserMenu が正しく隠れる

### ローディングテスト
- [ ] ログイン直後のローディング状態
- [ ] ユーザー情報が未ロードの状態
- [ ] アバター画像の読み込みエラー時

## 🎯 成功基準

### ユーザビリティ
- [ ] ロゴの位置とクリック範囲が明確（ロゴクリックで /home に遷移）
- [ ] 折りたたみボタンの役割が視覚的に理解できる
- [ ] メニュー階層が一目で理解できる
- [ ] ユーザー情報へのアクセスが直感的
- [ ] ログアウトまでの操作が2クリック以内
- [ ] ロゴとUserMenuでホームへの導線が明確（冗長性の排除）

### パフォーマンス
- [ ] アバター画像の遅延読み込み（Next.js Image を使用）
- [ ] ポップアップメニューの開閉がスムーズ（レンダリング遅延なし）
- [ ] 折りたたみアニメーションがスムーズ

### アクセシビリティ
- [ ] キーボードナビゲーションに対応
- [ ] ARIA ラベルが適切に設定されている
- [ ] スクリーンリーダーで読み上げ可能

### 保守性
- [ ] コンポーネントが適切に分離されている
- [ ] 依存関係が明確
- [ ] 既存コードへの影響が最小限

---

**推定総作業時間**: 3.5時間

**推定コミット数**: 4回（段階的実装）

**リスク要因**:
- z-index の競合（低リスク、既存システムを使用）
- ポップアップメニューの位置調整（中リスク、CSS調整が必要になる可能性）
- ユーザー情報のロード遅延（低リスク、ローディング状態を実装済み）

**次のステップ**:
1. UX問題分析文書 (`navigation-menu-ux-issues.md`) をレビュー
2. この実装制約文書をレビュー
3. 実装方針を最終決定
4. フェーズ1から順次実装開始

