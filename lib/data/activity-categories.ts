/**
 * アクティビティカテゴリーマスターデータ
 * 
 * 2段階のアクティビティ分類システム
 * - 1段階目: PrimaryCategory（大分類）
 * - 2段階目: SecondaryCategory（詳細分類）
 */

import { PrimaryCategoryType } from '@/lib/core/types'
import { t } from '@/lib/i18n'
import { getUserLanguage } from '@/lib/utils/language'

export interface SecondaryCategoryItem {
  id: string
  label: string
  icon?: string
  iconName?: string // SVGアイコン名（優先）
  description?: string
}

export interface ActivityCategoryMaster {
  primaryCategory: PrimaryCategoryType
  label: string
  shortLabel: string // 短縮版ラベル（横幅制限対応）
  icon: string
  iconName?: string // SVGアイコン名（優先）
  secondaryCategories: SecondaryCategoryItem[]
}

/**
 * アクティビティカテゴリーマスターデータ
 */
export const ACTIVITY_CATEGORIES: ActivityCategoryMaster[] = [
  {
    primaryCategory: 'transportation',
    label: '移動・交通',
    shortLabel: '移動',
    icon: '🚆',
    iconName: 'train',
    secondaryCategories: [
      { id: 'flight', label: '飛行機', icon: '✈️', iconName: 'airplane', description: '国際線・国内線の搭乗' },
      { id: 'train', label: '電車', icon: '🚆', iconName: 'train', description: '鉄道・地下鉄での移動' },
      { id: 'bus', label: 'バス', icon: '🚌', description: '高速バス・市内バス' },
      { id: 'taxi', label: 'タクシー', icon: '🚕', description: 'タクシー・配車サービス' },
      { id: 'car_rental', label: 'レンタカー', icon: '🚗', iconName: 'car', description: 'レンタカーでの移動' },
      { id: 'personal_car', label: 'マイカー', icon: '🚙', iconName: 'car', description: '自家用車での移動' },
      { id: 'ferry', label: 'フェリー', icon: '⛴️', description: '船・フェリーでの移動' },
      { id: 'bike', label: '自転車', icon: '🚲', description: 'レンタサイクル' },
      { id: 'scooter', label: 'バイク・スクーター', icon: '🛵', description: 'バイク・電動スクーター' },
      { id: 'parking', label: '駐車場', icon: '🅿️', iconName: 'parking', description: '駐車場の予約・精算・駐車位置の管理' },
      { id: 'gas_station', label: 'ガソリンスタンド', icon: '⛽', iconName: 'gas-station', description: '給油・ガソリンスタンド' },
      { id: 'toll_payment', label: '交通料金支払い', icon: '🛣️', iconName: 'toll-road', description: '高速道路料金・通行料金の支払い' },
    ]
  },
  {
    primaryCategory: 'shopping',
    label: '買い物をする',
    shortLabel: '買い物',
    icon: '🛍️',
    iconName: 'shopping',
    secondaryCategories: [
      { id: 'souvenir', label: 'お土産購入', icon: '🎁', description: 'お土産・記念品の購入' },
      { id: 'grocery', label: '食料品購入', icon: '🛒', description: 'スーパー・コンビニでの買い物' },
      { id: 'fashion', label: 'ファッション', icon: '👔', description: '衣類・アクセサリーの購入' },
      { id: 'electronics', label: '電化製品', icon: '📱', description: '家電・ガジェットの購入' },
      { id: 'local_market', label: 'ローカル市場', icon: '🏪', description: '地元の市場・バザール' },
      { id: 'duty_free', label: '免税店', icon: '🛒', description: '空港・市内の免税店' },
      { id: 'bookstore', label: '書店', icon: '📚', description: '書籍・雑誌の購入' },
    ]
  },
  {
    primaryCategory: 'dining',
    label: '食事をする',
    shortLabel: '食事',
    icon: '🍽️',
    iconName: 'dining',
    secondaryCategories: [
      { id: 'breakfast', label: '朝食', icon: '🌅', description: 'ホテル朝食・カフェ朝食' },
      { id: 'lunch', label: '昼食', icon: '☀️', description: 'ランチ・軽食' },
      { id: 'dinner', label: '夕食', icon: '🌙', description: 'ディナー・夜のレストラン' },
      { id: 'cafe', label: 'カフェ', icon: '☕', description: 'カフェ・喫茶店' },
      { id: 'bar', label: 'バー', icon: '🍺', description: 'バー・パブ' },
      { id: 'food_tour', label: 'フードツアー', icon: '🍜', description: '食べ歩き・グルメツアー' },
      { id: 'street_food', label: '屋台・ストリートフード', icon: '🌮', description: '屋台・フードトラック' },
      { id: 'fine_dining', label: 'ファインダイニング', icon: '🍷', description: '高級レストラン' },
    ]
  },
  {
    primaryCategory: 'accommodation',
    label: '宿泊する',
    shortLabel: '宿泊',
    icon: '🏨',
    iconName: 'hotel',
    secondaryCategories: [
      { id: 'check_in', label: 'チェックイン作業', icon: '🔑', iconName: 'bed', description: 'ホテル・宿泊施設のチェックイン' },
      { id: 'check_out', label: 'チェックアウト作業', icon: '🚪', description: 'ホテル・宿泊施設のチェックアウト' },
      { id: 'car_camping', label: '車中泊', icon: '🚐', description: '車での宿泊' },
      { id: 'camping', label: 'キャンプ', icon: '⛺', description: 'テント・キャンプ場での宿泊' },
      { id: 'hostel_stay', label: 'ホステル泊', icon: '🏠', description: 'ホステル・ゲストハウス' },
      { id: 'airbnb', label: '民泊', icon: '🏡', description: 'Airbnb・民泊施設' },
      { id: 'luxury_hotel', label: '高級ホテル', icon: '🏰', description: '5つ星ホテル・リゾート' },
    ]
  },
  {
    primaryCategory: 'exploration',
    label: '探索する',
    shortLabel: '探索',
    icon: '🔍',
    iconName: 'search',
    secondaryCategories: [
      { id: 'city_walk', label: '街歩き', icon: '🚶', description: '市内・町の散策' },
      { id: 'nature_walk', label: '自然散策', icon: '🌳', iconName: 'tree', description: '公園・自然の中の散歩' },
      { id: 'photography', label: '写真撮影', icon: '📷', description: '景観・建物の撮影' },
      { id: 'observation', label: '展望・眺望', icon: '🏔️', description: '展望台・景色を楽しむ' },
      { id: 'architecture', label: '建築鑑賞', icon: '🏛️', description: '建築物の見学' },
      { id: 'park', label: '公園訪問', icon: '🌲', description: '公園・庭園の訪問' },
    ]
  },
  {
    primaryCategory: 'adventure',
    label: '探検する',
    shortLabel: '探検',
    icon: '🏔️',
    secondaryCategories: [
      { id: 'hiking', label: 'ハイキング', icon: '🥾', description: '登山道・トレイルハイキング' },
      { id: 'trekking', label: 'トレッキング', icon: '⛰️', description: '山岳トレッキング' },
      { id: 'diving', label: 'ダイビング', icon: '🤿', description: 'スキューバダイビング' },
      { id: 'snorkeling', label: 'シュノーケリング', icon: '🏊', description: 'シュノーケリング' },
      { id: 'rock_climbing', label: 'ロッククライミング', icon: '🧗', description: 'クライミング・ボルダリング' },
      { id: 'caving', label: '洞窟探検', icon: '🕳️', description: '洞窟・ケイビング' },
      { id: 'safari', label: 'サファリ', icon: '🦁', description: 'サファリツアー・動物観察' },
      { id: 'jungle_trek', label: 'ジャングルトレック', icon: '🌴', description: 'ジャングル・熱帯雨林の探検' },
    ]
  },
  {
    primaryCategory: 'entertainment',
    label: '遊ぶ',
    shortLabel: '遊ぶ',
    icon: '🎮',
    secondaryCategories: [
      { id: 'theme_park', label: 'テーマパーク', icon: '🎢', description: '遊園地・テーマパーク' },
      { id: 'beach', label: 'ビーチ', icon: '🏖️', description: 'ビーチ・海水浴' },
      { id: 'water_sports', label: 'ウォータースポーツ', icon: '🏄', description: 'サーフィン・カヤックなど' },
      { id: 'casino', label: 'カジノ', icon: '🎰', description: 'カジノ・ギャンブル' },
      { id: 'nightlife', label: 'ナイトライフ', icon: '🌃', description: 'ナイトクラブ・バー巡り' },
      { id: 'game_center', label: 'ゲームセンター', icon: '🕹️', description: 'アーケード・ゲームセンター' },
      { id: 'karaoke', label: 'カラオケ', icon: '🎤', description: 'カラオケ・歌' },
      { id: 'movie', label: '映画鑑賞', icon: '🎬', description: '映画館・シネマ' },
    ]
  },
  {
    primaryCategory: 'culture',
    label: '文化に触れる',
    shortLabel: '文化',
    icon: '🏛️',
    secondaryCategories: [
      { id: 'museum', label: '博物館', icon: '🏛️', description: '博物館・科学館' },
      { id: 'art_gallery', label: '美術館', icon: '🖼️', description: '美術館・ギャラリー' },
      { id: 'aquarium', label: '水族館', icon: '🐠', description: '海洋生物の展示・学習施設' },
      { id: 'temple_shrine', label: '寺社仏閣', icon: '⛩️', description: '寺院・神社・教会' },
      { id: 'historical_site', label: '歴史的建造物', icon: '🏰', description: '城・遺跡・史跡' },
      { id: 'local_festival', label: '地域祭り', icon: '🎭', description: '祭り・フェスティバル' },
      { id: 'theater', label: '劇場・コンサート', icon: '🎭', description: '演劇・音楽コンサート' },
      { id: 'traditional_experience', label: '伝統文化体験', icon: '🎎', description: '茶道・書道などの体験' },
      { id: 'workshop', label: 'ワークショップ', icon: '🎨', description: '工芸・アート体験' },
    ]
  },
  {
    primaryCategory: 'wellness',
    label: '健康志向',
    shortLabel: '健康',
    icon: '💆',
    secondaryCategories: [
      { id: 'spa', label: 'スパ', icon: '♨️', description: 'スパ・温泉' },
      { id: 'massage', label: 'マッサージ', icon: '💆', description: 'マッサージ・リラクゼーション' },
      { id: 'yoga', label: 'ヨガ', icon: '🧘', description: 'ヨガ・瞑想クラス' },
      { id: 'gym', label: 'ジム', icon: '🏋️', description: 'フィットネスジム' },
      { id: 'meditation', label: '瞑想', icon: '🕉️', description: '瞑想・マインドフルネス' },
      { id: 'hot_spring', label: '温泉', icon: '♨️', description: '温泉・銭湯' },
      { id: 'detox', label: 'デトックス', icon: '🥗', description: 'デトックス・ファスティング' },
    ]
  },
  {
    primaryCategory: 'service',
    label: 'サービス提供',
    shortLabel: 'サービス',
    icon: '🔧',
    secondaryCategories: [
      { id: 'laundry', label: '洗濯', icon: '👕', description: 'コインランドリー・クリーニング' },
      { id: 'currency_exchange', label: '両替', icon: '💱', description: '両替所・銀行' },
      { id: 'hospital', label: '病院', icon: '🏥', description: '病院・クリニック' },
      { id: 'visa_application', label: 'ビザ申請', icon: '📋', description: '大使館・ビザセンター' },
      { id: 'sim_purchase', label: 'SIM購入', icon: '📱', description: 'SIMカード・通信サービス' },
      { id: 'post_office', label: '郵便局', icon: '📮', description: '郵便・荷物発送' },
      { id: 'atm', label: 'ATM', icon: '🏧', description: '現金引き出し' },
      { id: 'baggage_storage', label: '荷物預け', icon: '🧳', description: 'コインロッカー・荷物預かり' },
    ]
  },
]

/**
 * PrimaryCategoryからマスターデータを取得
 */
export function getActivityCategoryMaster(primaryCategory: PrimaryCategoryType): ActivityCategoryMaster | undefined {
  return ACTIVITY_CATEGORIES.find(cat => cat.primaryCategory === primaryCategory)
}

/**
 * SecondaryCategoryIDから詳細情報を取得
 */
export function getSecondaryCategoryInfo(
  primaryCategory: PrimaryCategoryType,
  secondaryCategoryId: string
): SecondaryCategoryItem | undefined {
  const master = getActivityCategoryMaster(primaryCategory)
  return master?.secondaryCategories.find(sc => sc.id === secondaryCategoryId)
}

/**
 * 全てのPrimaryCategoryを取得
 */
export function getAllPrimaryCategories(): PrimaryCategoryType[] {
  return ACTIVITY_CATEGORIES.map(cat => cat.primaryCategory)
}

/**
 * PrimaryCategoryの表示ラベルを取得
 */
export function getPrimaryCategoryLabel(primaryCategory: PrimaryCategoryType): string {
  const master = getActivityCategoryMaster(primaryCategory)
  if (!master) return primaryCategory
  const lang = getUserLanguage()
  const translated = t((`activity.primary.${primaryCategory}` as unknown) as any, lang)
  return `${master.icon} ${translated || master.label}`
}

/**
 * PrimaryCategoryの短縮版ラベルを取得（横幅制限対応）
 */
export function getPrimaryCategoryShortLabel(primaryCategory: PrimaryCategoryType): string {
  const master = getActivityCategoryMaster(primaryCategory)
  if (!master) return primaryCategory
  const lang = getUserLanguage()
  const translated = t((`activity.primaryShort.${primaryCategory}` as unknown) as any, lang)
  return `${master.icon} ${translated || master.shortLabel}`
}

/**
 * SecondaryCategoryの表示ラベルを取得
 */
export function getSecondaryCategoryLabel(
  primaryCategory: PrimaryCategoryType,
  secondaryCategoryId: string
): string {
  const info = getSecondaryCategoryInfo(primaryCategory, secondaryCategoryId)
  if (!info) return secondaryCategoryId
  const lang = getUserLanguage()
  const translated = t((`activity.secondary.${primaryCategory}.${secondaryCategoryId}` as unknown) as any, lang)
  return `${info.icon || ''} ${(translated || info.label)}`.trim()
}

/**
 * SecondaryCategoryの説明文を取得（i18n対応）
 */
export function getSecondaryCategoryDescription(
  primaryCategory: PrimaryCategoryType,
  secondaryCategoryId: string
): string {
  const info = getSecondaryCategoryInfo(primaryCategory, secondaryCategoryId)
  if (!info || !info.description) return ''
  const lang = getUserLanguage()
  const translated = t((`activity.secondary.${primaryCategory}.${secondaryCategoryId}.description` as unknown) as any, lang)
  return translated || info.description
}

/**
 * SecondaryCategoryのアイコン名を取得（SVGアイコン優先）
 */
export function getSecondaryCategoryIconName(
  primaryCategory: PrimaryCategoryType,
  secondaryCategoryId: string
): string | undefined {
  const info = getSecondaryCategoryInfo(primaryCategory, secondaryCategoryId)
  return info?.iconName
}

