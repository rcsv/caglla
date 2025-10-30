import { getUserLanguage } from '@/lib/utils/language'
import type { SupportedLanguage } from '@/lib/core/types'

export type TranslationKey =
  | 'features'
  | 'pricing'
  | 'contact'
  | 'login'
  | 'travelGuide'
  | 'memories'
  | 'devTools'
  // Footer
  | 'footer.tagline'
  | 'footer.products'
  | 'footer.resources'
  | 'footer.company'
  | 'footer.releaseNotes'
  | 'footer.documentation'
  | 'footer.blog'
  | 'footer.faq'
  | 'footer.support'
  | 'footer.backToTop'
  | 'footer.privacyPolicy'
  | 'footer.termsOfService'
  | 'footer.cookieSettings'
  // Features page
  | 'features.intro'
  | 'features.section1.title'
  | 'features.section2.title'
  | 'features.section3.title'
  // Pricing page
  | 'pricing.intro'
  | 'pricing.choosePlan'
  | 'pricing.cta.title'
  | 'pricing.cta.subtitle'
  | 'pricing.cta.support'
  | 'pricing.cta.docs'
  // Contact page
  | 'contact.title'
  | 'contact.sectionTitle'
  | 'contact.success'
  | 'contact.name'
  | 'contact.email'
  | 'contact.subject'
  | 'contact.subject.placeholder'
  | 'contact.subject.bug'
  | 'contact.subject.feature'
  | 'contact.subject.account'
  | 'contact.subject.billing'
  | 'contact.subject.other'
  | 'contact.message'
  | 'contact.message.placeholder'
  | 'contact.submit'
  | 'contact.submitting'
  | 'contact.info.title'
  | 'contact.info.general'
  | 'contact.info.urgent'
  | 'contact.info.responseTime'
  | 'contact.info.faq'

type Dictionary = Record<TranslationKey, string>

const en: Dictionary = {
  features: 'Features',
  pricing: 'Pricing',
  contact: 'Contact',
  login: 'Log in',
  travelGuide: 'Travel Guide',
  memories: 'Memories',
  devTools: 'Dev Tools',
  // Footer
  'footer.tagline': 'Make your trips beautifully organized',
  'footer.products': 'Products',
  'footer.resources': 'Resources',
  'footer.company': 'Company',
  'footer.releaseNotes': 'Release notes',
  'footer.documentation': 'Documentation',
  'footer.blog': 'Blog',
  'footer.faq': 'FAQ',
  'footer.support': 'Support',
  'footer.backToTop': 'Back to top',
  'footer.privacyPolicy': 'Privacy Policy',
  'footer.termsOfService': 'Terms of Service',
  'footer.cookieSettings': 'Cookie Settings',
  // Features page
  'features.intro': 'Caglla strengths, simply explained.',
  'features.section1.title': '1. Features for personal and family trips',
  'features.section2.title': '2. Features for trips with friends',
  'features.section3.title': '3. Features for tour conductors',
  // Pricing page
  'pricing.intro': 'Three simple plans. Pay only for what you need.',
  'pricing.choosePlan': 'Choose Your Plan',
  'pricing.cta.title': "Let's get started now",
  'pricing.cta.subtitle': 'Start with the free plan, upgrade anytime.',
  'pricing.cta.support': 'Go to Support',
  'pricing.cta.docs': 'View Documentation',
  // Contact page
  'contact.title': 'Contact',
  'contact.sectionTitle': 'Contact Us',
  'contact.success': 'Thank you for your inquiry. We will get back to you shortly.',
  'contact.name': 'Name',
  'contact.email': 'Email Address',
  'contact.subject': 'Subject',
  'contact.subject.placeholder': 'Please select',
  'contact.subject.bug': 'Bug Report',
  'contact.subject.feature': 'Feature Request',
  'contact.subject.account': 'Account',
  'contact.subject.billing': 'Billing & Plans',
  'contact.subject.other': 'Other',
  'contact.message': 'Message',
  'contact.message.placeholder': 'Please provide details about your inquiry',
  'contact.submit': 'Submit',
  'contact.submitting': 'Submitting...',
  'contact.info.title': 'Contact Information',
  'contact.info.general': 'For general questions, bug reports, and feature requests, please use the form above.',
  'contact.info.urgent': 'We will prioritize critical security issues.',
  'contact.info.responseTime': 'We usually respond within 2-3 business days. Complex issues may take longer.',
  'contact.info.faq': 'For common questions, please see the FAQ page.',
}

const ja: Dictionary = {
  features: '機能',
  pricing: 'プラン',
  contact: 'お問い合わせ',
  login: 'ログイン',
  travelGuide: 'トラベルガイド',
  memories: '思い出',
  devTools: '開発ツール',
  // Footer
  'footer.tagline': 'あなたの旅行を美しく管理する',
  'footer.products': '製品',
  'footer.resources': 'リソース',
  'footer.company': '会社情報',
  'footer.releaseNotes': 'リリースノート',
  'footer.documentation': 'ドキュメント',
  'footer.blog': 'ブログ',
  'footer.faq': 'FAQ',
  'footer.support': 'サポート',
  'footer.backToTop': 'ページ上部へ',
  'footer.privacyPolicy': 'プライバシーポリシー',
  'footer.termsOfService': '利用規約',
  'footer.cookieSettings': 'クッキー設定',
  // Features page
  'features.intro': 'Cagllaの強みを、シンプルに。',
  'features.section1.title': '1. 個人・家族旅行者向けの機能',
  'features.section2.title': '2. 友達旅行向けの機能',
  'features.section3.title': '3. ツアーコンダクター向けの機能',
  // Pricing page
  'pricing.intro': 'シンプルな3プラン。必要な機能だけを、わかりやすく。',
  'pricing.choosePlan': 'プランを選ぶ',
  'pricing.cta.title': '今すぐはじめましょう',
  'pricing.cta.subtitle': '無料プランからお試し可能。必要に応じていつでもアップグレード。',
  'pricing.cta.support': 'サポートへ',
  'pricing.cta.docs': 'ドキュメントを見る',
  // Contact page
  'contact.title': 'お問い合わせ',
  'contact.sectionTitle': 'お問い合わせ',
  'contact.success': 'お問い合わせありがとうございます。内容を確認の上、回答いたします。',
  'contact.name': 'お名前',
  'contact.email': 'メールアドレス',
  'contact.subject': '件名',
  'contact.subject.placeholder': '選択してください',
  'contact.subject.bug': 'バグ報告',
  'contact.subject.feature': '機能要望',
  'contact.subject.account': 'アカウント関連',
  'contact.subject.billing': '課金・プラン関連',
  'contact.subject.other': 'その他',
  'contact.message': 'メッセージ',
  'contact.message.placeholder': 'お問い合わせ内容を詳しくお書きください',
  'contact.submit': '送信する',
  'contact.submitting': '送信中... ',
  'contact.info.title': '連絡先情報',
  'contact.info.general': 'サービスに関するご質問、バグ報告、機能要望などは、上記フォームからお送りください。',
  'contact.info.urgent': 'セキュリティに関する重要な問題については、できるだけ早急に対応いたします。',
  'contact.info.responseTime': '通常のお問い合わせには2-3営業日以内に回答いたします。複雑な問題については、回答までにお時間をいただく場合があります。',
  'contact.info.faq': 'よくある質問については、FAQページをご確認ください。',
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

export function t(key: TranslationKey, lang?: SupportedLanguage): string {
  const language = lang || (typeof window !== 'undefined' ? getUserLanguage() : 'en')
  const dict = dictionaries[language] || en
  return dict[key]
}

export function getDictionary(lang: SupportedLanguage): Dictionary {
  return dictionaries[lang] || en
}


