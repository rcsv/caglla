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
  | 'features.s1.map.title'
  | 'features.s1.map.li1'
  | 'features.s1.map.li2'
  | 'features.s1.map.li3'
  | 'features.s1.checklist.title'
  | 'features.s1.checklist.li1'
  | 'features.s1.checklist.li2'
  | 'features.s2.share.title'
  | 'features.s2.share.li1'
  | 'features.s2.share.li2'
  | 'features.s2.pdf.title'
  | 'features.s2.pdf.li1'
  | 'features.s2.pdf.li2'
  | 'features.s3.cost.title'
  | 'features.s3.cost.li1'
  | 'features.s3.cost.li2'
  | 'features.s3.optimize.title'
  | 'features.s3.optimize.li1'
  | 'features.s3.optimize.li2'
  // Pricing page
  | 'pricing.intro'
  | 'pricing.choosePlan'
  | 'pricing.cta.title'
  | 'pricing.cta.subtitle'
  | 'pricing.cta.support'
  | 'pricing.cta.docs'
  | 'pricing.season.subtitle'
  | 'pricing.season.li1'
  | 'pricing.season.li2'
  | 'pricing.season.li3'
  | 'pricing.backpacker.subtitle'
  | 'pricing.backpacker.li1'
  | 'pricing.backpacker.li2'
  | 'pricing.backpacker.li3'
  | 'pricing.globetrotter.subtitle'
  | 'pricing.globetrotter.li1'
  | 'pricing.globetrotter.li2'
  | 'pricing.globetrotter.li3'
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
  'features.s1.map.title': 'Manage itinerary on map',
  'features.s1.map.li1': 'Edit schedules by day and time intuitively',
  'features.s1.map.li2': 'Check routes on map; auto distance and time calc',
  'features.s1.map.li3': 'Save favorite spots with notes',
  'features.s1.checklist.title': 'Checklist',
  'features.s1.checklist.li1': 'Auto packing suggestions by season and stay length',
  'features.s1.checklist.li2': 'Track progress by category (essentials/clothes/gadgets)',
  'features.s2.share.title': 'Share schedules',
  'features.s2.share.li1': 'Sync via iCal (.ics) to Google/Apple/Outlook',
  'features.s2.share.li2': 'Control permissions (public/private, link sharing)',
  'features.s2.pdf.title': 'PDF export',
  'features.s2.pdf.li1': 'Export itinerary, map links, reservations in clean layout',
  'features.s2.pdf.li2': 'Great for offline (A4/US Letter)',
  'features.s3.cost.title': 'Cost totals',
  'features.s3.cost.li1': 'Auto totals by category/day with currency conversion',
  'features.s3.cost.li2': 'Real-time update with itinerary changes',
  'features.s3.optimize.title': 'Route optimization',
  'features.s3.optimize.li1': 'Auto-optimizes visiting order for multiple waypoints',
  'features.s3.optimize.li2': 'Choose travel mode/avoid (highways/tolls/ferries)',
  // Pricing page
  'pricing.intro': 'Three simple plans. Pay only for what you need.',
  'pricing.choosePlan': 'Choose Your Plan',
  'pricing.cta.title': "Let's get started now",
  'pricing.cta.subtitle': 'Start with the free plan, upgrade anytime.',
  'pricing.cta.support': 'Go to Support',
  'pricing.cta.docs': 'View Documentation',
  'pricing.season.subtitle': 'Basic features',
  'pricing.season.li1': 'Manage Trip/Day/Itinerary',
  'pricing.season.li2': 'Google Maps display',
  'pricing.season.li3': 'Shareable links',
  'pricing.backpacker.subtitle': 'Includes route optimization',
  'pricing.backpacker.li1': 'Everything in season_traveler',
  'pricing.backpacker.li2': 'Route optimization (basic)',
  'pricing.backpacker.li3': 'Custom features',
  'pricing.globetrotter.subtitle': 'All features, no limits',
  'pricing.globetrotter.li1': 'Everything in backpacker',
  'pricing.globetrotter.li2': 'Route optimization (advanced)',
  'pricing.globetrotter.li3': 'Higher limits and priority support',
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
  'features.s1.map.title': '地図で旅程管理',
  'features.s1.map.li1': '日別・時間別のスケジュールを直感的に編集',
  'features.s1.map.li2': '地図上でルート確認、距離・所要時間の自動計算',
  'features.s1.map.li3': 'お気に入りスポットの保存とメモ',
  'features.s1.checklist.title': 'チェックリスト',
  'features.s1.checklist.li1': '季節・滞在日数に応じた持ち物の自動提案',
  'features.s1.checklist.li2': 'カテゴリ別に進捗管理（必需品/衣類/ガジェット など）',
  'features.s2.share.title': 'スケジュール共有',
  'features.s2.share.li1': 'iCal（.ics）購読でGoogle/Apple/Outlookに同期',
  'features.s2.share.li2': '公開/非公開やリンク共有の権限コントロール',
  'features.s2.pdf.title': 'PDFエクスポート',
  'features.s2.pdf.li1': '旅程・地図リンク・予約情報を見やすいレイアウトで出力',
  'features.s2.pdf.li2': 'オフライン参照向け（A4/US Letter対応）',
  'features.s3.cost.title': '費用合計の算出',
  'features.s3.cost.li1': 'カテゴリ/日別の費用を自動集計、通貨換算にも対応',
  'features.s3.cost.li2': '旅程の変更に連動してリアルタイム更新',
  'features.s3.optimize.title': 'ルート最適化',
  'features.s3.optimize.li1': '複数地点の最適訪問順序を自動計算',
  'features.s3.optimize.li2': '移動手段/回避設定（高速/有料/フェリー）を選択可能',
  // Pricing page
  'pricing.intro': 'シンプルな3プラン。必要な機能だけを、わかりやすく。',
  'pricing.choosePlan': 'プランを選ぶ',
  'pricing.cta.title': '今すぐはじめましょう',
  'pricing.cta.subtitle': '無料プランからお試し可能。必要に応じていつでもアップグレード。',
  'pricing.cta.support': 'サポートへ',
  'pricing.cta.docs': 'ドキュメントを見る',
  'pricing.season.subtitle': '基本機能',
  'pricing.season.li1': 'Trip/Day/Itinerary の管理',
  'pricing.season.li2': 'Google Maps 表示',
  'pricing.season.li3': '共有リンク',
  'pricing.backpacker.subtitle': 'ルート最適化など',
  'pricing.backpacker.li1': 'season_traveler のすべて',
  'pricing.backpacker.li2': 'ルート最適化（基本）',
  'pricing.backpacker.li3': 'カスタム機能',
  'pricing.globetrotter.subtitle': '全機能・無制限',
  'pricing.globetrotter.li1': 'backpacker のすべて',
  'pricing.globetrotter.li2': 'ルート最適化（拡張）',
  'pricing.globetrotter.li3': '上限緩和・優先サポート',
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


