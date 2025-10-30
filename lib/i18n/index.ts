import { getUserLanguage, type SupportedLanguage } from '@/lib/utils/language'

type Dictionary = Record<string, string>

const en: Dictionary = {
  features: 'Features',
  pricing: 'Pricing',
  contact: 'Contact',
  login: 'Log in',
  travelGuide: 'Travel Guide',
  memories: 'Memories',
  devTools: 'Dev Tools',
}

const ja: Dictionary = {
  features: '機能',
  pricing: 'プラン',
  contact: 'お問い合わせ',
  login: 'ログイン',
  travelGuide: 'トラベルガイド',
  memories: '思い出',
  devTools: '開発ツール',
}

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

export function t(key: string, lang?: SupportedLanguage): string {
  const language = lang || (typeof window !== 'undefined' ? getUserLanguage() : 'en')
  const dict = dictionaries[language] || en
  return dict[key] || key
}

export function getDictionary(lang: SupportedLanguage): Dictionary {
  return dictionaries[lang] || en
}


