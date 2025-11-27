import { getUserLanguage } from '@/lib/utils/language'
import type { SupportedLanguage } from '@/lib/core/types'

// 型定義をインポート
import type { TranslationKey, Dictionary } from './types'

// 言語辞書をインポート
import en from './en'
import ja from './ja'

// 型定義を再エクスポート
export type { TranslationKey, Dictionary }

// 全言語の辞書をまとめる（他の言語は英語にフォールバック）
const dictionaries: Record<SupportedLanguage, Dictionary> = {
  en,
  ja,
  zh: en,
  ko: en,
  es: en,
  fr: en,
  de: en,
  it: en,
  pt: en,
}

/**
 * 翻訳キーから翻訳テキストを取得する関数
 * @param key - 翻訳キー
 * @param variables - 変数置換用のオブジェクト、または言語コード（後方互換性のため）
 * @param lang - 言語コード（variablesがオブジェクトの場合）
 * @returns 翻訳されたテキスト
 */
export function t(key: TranslationKey, variables?: Record<string, string | number> | SupportedLanguage, lang?: SupportedLanguage): string {
  // 後方互換性: 2番目の引数がlanguageの場合
  let actualLang: SupportedLanguage
  let actualVariables: Record<string, string | number> | undefined
  
  if (typeof variables === 'string') {
    // t(key, 'ja') の形式
    actualLang = variables
    actualVariables = undefined
  } else {
    // t(key, { dayCount: 3 }) または t(key, { dayCount: 3 }, 'ja') の形式
    actualVariables = variables
    actualLang = lang || (typeof window !== 'undefined' ? getUserLanguage() : 'en')
  }
  
  const dict = dictionaries[actualLang] || en
  let translation = dict[key]
  
  // 変数置換: {{variable}} を実際の値に置換
  if (actualVariables) {
    Object.entries(actualVariables).forEach(([varKey, varValue]) => {
      const placeholder = `{{${varKey}}}`
      translation = translation.replace(new RegExp(placeholder, 'g'), String(varValue))
    })
  }
  
  return translation
}

/**
 * 指定された言語の辞書を取得する関数
 * @param lang - 言語コード
 * @returns 辞書オブジェクト
 */
export function getDictionary(lang: SupportedLanguage): Dictionary {
  return dictionaries[lang] || en
}
