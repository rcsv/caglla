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
  | 'pricing.price.season'
  | 'pricing.price.backpacker'
  | 'pricing.price.globetrotter'
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
  // About page
  | 'about.hero.line1'
  | 'about.hero.line2'
  | 'about.hero.line3'
  | 'about.intro'
  | 'about.story.title'
  | 'about.story.p1'
  | 'about.story.p2'
  | 'about.story.p3'
  | 'about.mission.title'
  | 'about.mission.simplicity.title'
  | 'about.mission.simplicity.text'
  | 'about.mission.collab.title'
  | 'about.mission.collab.text'
  | 'about.mission.security.title'
  | 'about.mission.security.text'
  | 'about.building.title'
  | 'about.building.item1.title'
  | 'about.building.item1.text'
  | 'about.building.item2.title'
  | 'about.building.item2.text'
  | 'about.building.item3.title'
  | 'about.building.item3.text'
  | 'about.stats.year'
  | 'about.stats.possibility'
  | 'about.stats.passion'
  | 'about.cta.title'
  | 'about.cta.subtitle'
  | 'about.cta.contact'
  | 'about.cta.getStarted'
  // Terms page
  | 'terms.title'
  | 'terms.updated'
  | 'terms.s1.title'
  | 'terms.s1.p1'
  | 'terms.s2.title'
  | 'terms.s2.intro'
  | 'terms.s2.li1'
  | 'terms.s2.li2'
  | 'terms.s2.li3'
  | 'terms.s2.li4'
  | 'terms.s2.li5'
  | 'terms.s3.title'
  | 'terms.s3.intro'
  | 'terms.s3.li1'
  | 'terms.s3.li2'
  | 'terms.s3.li3'
  | 'terms.s3.li4'
  | 'terms.s4.title'
  | 'terms.s4.intro'
  | 'terms.s4.li1'
  | 'terms.s4.li2'
  | 'terms.s4.li3'
  | 'terms.s4.li4'
  | 'terms.s4.li5'
  | 'terms.s5.title'
  | 'terms.s5.p1'
  | 'terms.s6.title'
  | 'terms.s6.p1'
  | 'terms.s7.title'
  | 'terms.s7.p1'
  | 'terms.s7.contact'
  // Docs page
  | 'docs.title1'
  | 'docs.title2'
  | 'docs.intro'
  | 'docs.search.title'
  | 'docs.search.placeholder'
  | 'docs.guides.title'
  | 'docs.shortcuts.title'
  | 'docs.shortcuts.support'
  | 'docs.shortcuts.support.sub'
  | 'docs.shortcuts.faq'
  | 'docs.shortcuts.faq.sub'
  | 'docs.shortcuts.releases'
  | 'docs.shortcuts.releases.sub'
  | 'docs.cta.title'
  | 'docs.cta.subtitle'
  | 'docs.cta.support'
  | 'docs.cta.faq'
  | 'docs.empty'
  // Blog list page
  | 'blog.title1'
  | 'blog.title2'
  | 'blog.intro'
  | 'blog.search.title'
  | 'blog.search.placeholder'
  | 'blog.latest'
  | 'blog.empty'
  | 'blog.cta.title'
  | 'blog.cta.subtitle'
  | 'blog.cta.support'
  | 'blog.cta.docs'
  // Blog post page
  | 'blog.post.notfound.title'
  | 'blog.post.notfound.desc'
  | 'blog.post.back'

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
  'pricing.price.season': '¥0',
  'pricing.price.backpacker': '¥480/mo',
  'pricing.price.globetrotter': '¥980/mo',
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
  // About page
  'about.hero.line1': 'Travel',
  'about.hero.line2': 'Planning',
  'about.hero.line3': 'Simplified',
  'about.intro': 'Caglla makes travel planning beautiful and simple. We turn complex itinerary management into intuitive tools anyone can use.',
  'about.story.title': 'Our Story',
  'about.story.p1': 'In 2024, we were overwhelmed by the complexity of travel planning — too many apps, scattered notes, paper maps.',
  'about.story.p2': '“If only we had a tool that makes trip planning simpler and more beautiful.”',
  'about.story.p3': 'That idea gave birth to Caglla. Seamless with Google Maps, manage daily itineraries, stays, restaurants, and sights — all in one place, shared in real time.',
  'about.mission.title': 'Our Mission & Values',
  'about.mission.simplicity.title': 'Simplicity First',
  'about.mission.simplicity.text': 'We prioritize intuitive design over complexity. Trip planning should be fun.',
  'about.mission.collab.title': 'Collaboration',
  'about.mission.collab.text': 'Travel is rarely solo. We make team planning effortless.',
  'about.mission.security.title': 'Privacy & Security',
  'about.mission.security.text': 'Your travel data matters. We protect it with top-tier security.',
  'about.building.title': "What We're Building",
  'about.building.item1.title': 'Detailed itinerary management',
  'about.building.item1.text': 'Manage schedules by day and hour, stays, restaurants, and sights, all in one place.',
  'about.building.item2.title': 'Google Maps integration',
  'about.building.item2.text': 'Plan optimal routes visually on the map with auto distances and times.',
  'about.building.item3.title': 'Real-time sharing',
  'about.building.item3.text': 'Share and co-edit with family and friends to craft the best trip together.',
  'about.stats.year': 'Founded',
  'about.stats.possibility': 'Possibilities',
  'about.stats.passion': 'Built with passion',
  'about.cta.title': 'Join Us on This Journey',
  'about.cta.subtitle': 'Let’s create the future of trip planning together.',
  'about.cta.contact': 'Contact',
  'about.cta.getStarted': 'Get Started',
  // Terms page
  'terms.title': 'Terms of Service',
  'terms.updated': 'Last updated',
  'terms.s1.title': '1. Introduction',
  'terms.s1.p1': 'These Terms govern your use of Caglla Travel Manager. Please read and agree before using the service.',
  'terms.s2.title': '2. Service Description',
  'terms.s2.intro': 'The service provides the following features:',
  'terms.s2.li1': 'Create and manage travel plans',
  'terms.s2.li2': 'Manage itineraries',
  'terms.s2.li3': 'Search and register places and stays',
  'terms.s2.li4': 'Map display and route optimization',
  'terms.s2.li5': 'Manage reservations',
  'terms.s3.title': '3. Conditions of Use',
  'terms.s3.intro': 'Users must meet the following conditions:',
  'terms.s3.li1': 'Google account authentication',
  'terms.s3.li2': 'Agreement to these Terms',
  'terms.s3.li3': 'Use for proper purposes',
  'terms.s3.li4': 'Comply with laws and public order',
  'terms.s4.title': '4. Prohibited Actions',
  'terms.s4.intro': 'The following are prohibited:',
  'terms.s4.li1': 'Posting illegal or harmful content',
  'terms.s4.li2': 'Infringing other users’ rights',
  'terms.s4.li3': 'Disrupting normal operation',
  'terms.s4.li4': 'Unauthorized access or hacking',
  'terms.s4.li5': 'Other actions deemed inappropriate',
  'terms.s5.title': '5. Disclaimer',
  'terms.s5.p1': 'We are not liable for damages arising from use, except in cases of intent or gross negligence. The same applies to interruptions or termination.',
  'terms.s6.title': '6. Changes to Terms',
  'terms.s6.p1': 'We may change these Terms as needed. Changes take effect when posted in the service.',
  'terms.s7.title': '7. Contact',
  'terms.s7.p1': 'For questions about these Terms, please contact us via the Contact page.',
  'terms.s7.contact': 'Contact Page',
  // Docs page
  'docs.title1': 'Documentation',
  'docs.title2': 'Guides & Specs',
  'docs.intro': 'Find usage, specifications, and best practices for Caglla here.',
  'docs.search.title': 'Search',
  'docs.search.placeholder': 'Search guides (e.g., Itinerary, Maps, Environment)',
  'docs.guides.title': 'Guides',
  'docs.shortcuts.title': 'Shortcuts',
  'docs.shortcuts.support': 'Support',
  'docs.shortcuts.support.sub': 'Go to Help Center',
  'docs.shortcuts.faq': 'FAQ',
  'docs.shortcuts.faq.sub': 'Frequently Asked Questions',
  'docs.shortcuts.releases': 'Release Notes',
  'docs.shortcuts.releases.sub': 'Version history',
  'docs.cta.title': 'Couldn’t find it in the guides?',
  'docs.cta.subtitle': 'Check Support or FAQ, or contact us if needed.',
  'docs.cta.support': 'Go to Support',
  'docs.cta.faq': 'View FAQ',
  'docs.empty': 'No matching guides were found.',
  // Blog list page
  'blog.title1': 'Blog',
  'blog.title2': 'News & Updates',
  'blog.intro': 'Product updates, behind-the-scenes, and usage tips.',
  'blog.search.title': 'Search',
  'blog.search.placeholder': 'Search posts (e.g., Support, Roadmap, Updates)',
  'blog.latest': 'Latest Posts',
  'blog.empty': 'No matching posts were found.',
  'blog.cta.title': "Don't miss the latest",
  'blog.cta.subtitle': 'Also check Support, Docs, and FAQ.',
  'blog.cta.support': 'Go to Support',
  'blog.cta.docs': 'View Documentation',
  // Blog post page
  'blog.post.notfound.title': 'Post not found',
  'blog.post.notfound.desc': 'Check the URL or go back to the blog list.',
  'blog.post.back': '← Back to blog list',
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
  'pricing.price.season': '¥0',
  'pricing.price.backpacker': '¥480/月',
  'pricing.price.globetrotter': '¥980/月',
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
  // About page
  'about.hero.line1': 'Travel',
  'about.hero.line2': 'Planning',
  'about.hero.line3': 'Simplified',
  'about.intro': 'Caglla は、旅行計画を美しく、簡単に管理できるプラットフォームです。複雑な旅程管理を直感的なツールに変えます。',
  'about.story.title': 'Our Story',
  'about.story.p1': '2024年、私たちは旅行計画の煩雑さに直面していました。複数のアプリ、散らばったメモ、紙の地図…。',
  'about.story.p2': '「もっと簡単に、もっと美しく、旅行を管理できるツールがあればいいのに」',
  'about.story.p3': 'そこからCagllaは生まれました。Google Mapsと連携し、旅程・宿泊・飲食・観光を一箇所で管理し、リアルタイムで共有します。',
  'about.mission.title': 'Our Mission & Values',
  'about.mission.simplicity.title': 'Simplicity First',
  'about.mission.simplicity.text': '誰でも使える直感的なデザインを優先します。旅行計画は楽しく。',
  'about.mission.collab.title': 'Collaboration',
  'about.mission.collab.text': '旅行は一人で行くものではありません。共同計画を簡単に。',
  'about.mission.security.title': 'Privacy & Security',
  'about.mission.security.text': '旅行データは大切です。最高レベルのセキュリティで保護します。',
  'about.building.title': 'What We\'re Building',
  'about.building.item1.title': '詳細な旅程管理',
  'about.building.item1.text': '日別・時間別の予定、宿泊、飲食、観光を一箇所で管理。',
  'about.building.item2.title': 'Google Maps連携',
  'about.building.item2.text': '地図上で視覚的に最適ルートを計画。距離や所要時間も自動計算。',
  'about.building.item3.title': 'リアルタイム共有',
  'about.building.item3.text': '家族や友人と共有・共同編集で、最高の旅を作り上げる。',
  'about.stats.year': '設立年',
  'about.stats.possibility': '旅行の可能性',
  'about.stats.passion': '情熱を注いで開発中',
  'about.cta.title': 'Join Us on This Journey',
  'about.cta.subtitle': '一緒に、旅行計画の未来を作りましょう',
  'about.cta.contact': 'お問い合わせ',
  'about.cta.getStarted': '始めてみる',
  // Terms page
  'terms.title': '利用規約',
  'terms.updated': '最終更新',
  'terms.s1.title': '1. はじめに',
  'terms.s1.p1': '本規約は Caglla Travel Manager の利用条件を定めるものです。ご利用前にご確認ください。',
  'terms.s2.title': '2. サービスの内容',
  'terms.s2.intro': '当サービスは以下の機能を提供します：',
  'terms.s2.li1': '旅行計画の作成・管理',
  'terms.s2.li2': '旅程のスケジュール管理',
  'terms.s2.li3': '観光地・宿泊先の検索・登録',
  'terms.s2.li4': '地図表示・ルート最適化',
  'terms.s2.li5': '予約情報の管理',
  'terms.s3.title': '3. 利用条件',
  'terms.s3.intro': 'ユーザーは以下の条件を満たす必要があります：',
  'terms.s3.li1': 'Googleアカウントによる認証',
  'terms.s3.li2': '本規約への同意',
  'terms.s3.li3': '適切な利用目的での使用',
  'terms.s3.li4': '法令・公序良俗に反しない利用',
  'terms.s4.title': '4. 禁止事項',
  'terms.s4.intro': '以下の行為を禁止します：',
  'terms.s4.li1': '違法・有害なコンテンツの投稿',
  'terms.s4.li2': '他ユーザーの権利を侵害する行為',
  'terms.s4.li3': 'サービスの正常な運営を妨げる行為',
  'terms.s4.li4': '不正アクセス・ハッキング行為',
  'terms.s4.li5': 'その他、当サービスが不適切と判断する行為',
  'terms.s5.title': '5. 免責事項',
  'terms.s5.p1': '故意または重過失を除き、当サービスの利用により生じた損害について一切の責任を負いません。中断・停止・終了による損害も同様です。',
  'terms.s6.title': '6. 規約の変更',
  'terms.s6.p1': '必要に応じて本規約を変更することがあります。変更後の規約は掲示時点で効力を生じます。',
  'terms.s7.title': '7. お問い合わせ',
  'terms.s7.p1': '本規約に関するご質問はお問い合わせページからご連絡ください。',
  'terms.s7.contact': 'お問い合わせページ',
  // Docs page
  'docs.title1': 'ドキュメント',
  'docs.title2': 'ガイド & 仕様',
  'docs.intro': 'Caglla の使い方・仕様・ベストプラクティスをここから辿れます。',
  'docs.search.title': '検索',
  'docs.search.placeholder': 'ガイドを検索（例：Itinerary、Maps、環境変数）',
  'docs.guides.title': 'ガイド',
  'docs.shortcuts.title': 'ショートカット',
  'docs.shortcuts.support': 'サポート',
  'docs.shortcuts.support.sub': 'ヘルプセンターへ',
  'docs.shortcuts.faq': 'FAQ',
  'docs.shortcuts.faq.sub': 'よくある質問',
  'docs.shortcuts.releases': 'リリースノート',
  'docs.shortcuts.releases.sub': 'バージョン履歴',
  'docs.cta.title': 'ガイドで見つからない場合',
  'docs.cta.subtitle': 'サポートまたはFAQをご確認ください。必要ならお問い合わせください。',
  'docs.cta.support': 'サポートへ',
  'docs.cta.faq': 'FAQを見る',
  'docs.empty': '該当するガイドが見つかりませんでした。',
  // Blog list page
  'blog.title1': 'ブログ',
  'blog.title2': 'ニュース & アップデート',
  'blog.intro': '最新情報、開発の裏側、使い方のヒントをお届けします。',
  'blog.search.title': '検索',
  'blog.search.placeholder': '記事を検索（例：Support、Roadmap、Updates）',
  'blog.latest': '最新記事',
  'blog.empty': '該当する記事が見つかりませんでした。',
  'blog.cta.title': '最新情報を見逃さないで',
  'blog.cta.subtitle': 'Support/Docs/FAQもあわせてご活用ください。',
  'blog.cta.support': 'サポートへ',
  'blog.cta.docs': 'ドキュメントを見る',
  // Blog post page
  'blog.post.notfound.title': '記事が見つかりませんでした',
  'blog.post.notfound.desc': 'URLをご確認いただくか、ブログ一覧に戻ってください。',
  'blog.post.back': '← ブログ一覧に戻る',
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


