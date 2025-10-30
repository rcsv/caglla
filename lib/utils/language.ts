// 言語管理ユーティリティ
import type { User, SupportedLanguage } from '@/lib/core/types'
import logger from '@/lib/core/logger'

/**
 * サポートされる言語のリスト
 */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'it', 'pt'
]

/**
 * デフォルト言語
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en'

/**
 * 言語名の表示用マッピング
 */
export const LANGUAGE_NAMES: Record<SupportedLanguage, { en: string; native: string }> = {
  ja: { en: 'Japanese', native: '日本語' },
  en: { en: 'English', native: 'English' },
  zh: { en: 'Chinese (Simplified)', native: '简体中文' },
  ko: { en: 'Korean', native: '한국어' },
  es: { en: 'Spanish', native: 'Español' },
  fr: { en: 'French', native: 'Français' },
  de: { en: 'German', native: 'Deutsch' },
  it: { en: 'Italian', native: 'Italiano' },
  pt: { en: 'Portuguese', native: 'Português' }
}

/**
 * 言語コードがサポートされているか確認
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
}

/**
 * ユーザーの言語設定を取得する
 * 
 * 優先順位:
 * 1. ユーザープリファレンス（user.preferences.language）
 *    - 空文字列（""）の場合は「自動（ブラウザ設定）」として扱う
 * 2. ブラウザの言語設定（navigator.language）
 * 3. デフォルト言語（'en'）
 * 
 * @param user - ユーザーオブジェクト（オプション）
 * @returns サポートされる言語コード
 */
export function getUserLanguage(user?: User | null): SupportedLanguage {
  // 1. ユーザープリファレンスを優先
  if (user?.preferences?.language !== undefined) {
    const userLang = user.preferences.language
    
    // 空文字列の場合は「自動（ブラウザ設定）」として扱う
    if (userLang === '') {
      logger.debug('User selected auto (browser) language, checking browser settings')
      
      // ブラウザ設定を確認
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
        const browserLang = (navigator.language || 'en').split('-')[0]
        if (isSupportedLanguage(browserLang)) {
          logger.debug('Language from browser (user selected auto):', browserLang)
          return browserLang
        }
      }
      
      // ブラウザ設定が取得できない場合はデフォルト
      logger.debug('Using default language (user selected auto, browser unavailable):', DEFAULT_LANGUAGE)
      return DEFAULT_LANGUAGE
    }
    
    // 具体的な言語が設定されている場合
    const lang = userLang.split('-')[0]
    if (isSupportedLanguage(lang)) {
      logger.debug('Language from user preferences:', lang)
      return lang
    }
  }
  
  // 2. ユーザープリファレンスがない場合のブラウザ設定
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    const browserLang = (navigator.language || 'en').split('-')[0]
    if (isSupportedLanguage(browserLang)) {
      logger.debug('Language from browser (no user preference):', browserLang)
      return browserLang
    }
  }
  
  // 3. デフォルト
  logger.debug('Using default language:', DEFAULT_LANGUAGE)
  return DEFAULT_LANGUAGE
}

/**
 * Places キャッシュのキーを生成
 * 
 * フォーマット: {place_id}_{language}
 * 例: ChIJ51cu8IcbXWARiRtXIothAS4_ja
 * 
 * @param placeId - Google Places API の place_id
 * @param language - 言語コード
 * @returns キャッシュキー
 */
export function getCacheKey(placeId: string, language: SupportedLanguage): string {
  return `${placeId}_${language}`
}

/**
 * キャッシュキーをパース
 * 
 * @param cacheKey - キャッシュキー
 * @returns place_id と language
 */
export function parseCacheKey(cacheKey: string): { 
  placeId: string
  language: SupportedLanguage 
} {
  const lastUnderscoreIndex = cacheKey.lastIndexOf('_')
  
  if (lastUnderscoreIndex === -1) {
    // 旧フォーマット（言語サフィックスなし）
    logger.warn('Cache key without language suffix:', cacheKey)
    return {
      placeId: cacheKey,
      language: DEFAULT_LANGUAGE
    }
  }
  
  const placeId = cacheKey.substring(0, lastUnderscoreIndex)
  const languageStr = cacheKey.substring(lastUnderscoreIndex + 1)
  const language = isSupportedLanguage(languageStr) ? languageStr : DEFAULT_LANGUAGE
  
  return { placeId, language }
}

/**
 * 言語コードを正規化（BCP 47 → 2文字コード）
 * 
 * 例: "ja-JP" → "ja", "en-US" → "en"
 * 
 * @param locale - BCP 47 ロケールコード
 * @returns 正規化された言語コード
 */
export function normalizeLanguageCode(locale: string): SupportedLanguage {
  const lang = locale.split('-')[0].toLowerCase()
  return isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE
}

/**
 * フォールバック言語の優先順位を取得
 * 
 * @param preferredLang - 優先言語
 * @returns フォールバック言語のリスト（優先順）
 */
export function getFallbackLanguages(preferredLang: SupportedLanguage): SupportedLanguage[] {
  const fallbacks: SupportedLanguage[] = [preferredLang]
  
  // 英語を優先的にフォールバック
  if (preferredLang !== 'en') {
    fallbacks.push('en')
  }
  
  // 日本語を最後のフォールバック
  if (preferredLang !== 'ja' && !fallbacks.includes('ja')) {
    fallbacks.push('ja')
  }
  
  return fallbacks
}

