export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  tags: string[]
  content: string
}

export function getAllBlogPosts(): BlogPost[] {
  // NOTE: 必要に応じてMDX/CMSへ差し替え可能な単純データソース
  return [
    {
      slug: 'welcome-to-caglla',
      title: 'Cagllaへようこそ — 旅行計画をシンプルに',
      excerpt: 'Cagllaの目指す体験、開発の背景、今後のロードマップをご紹介します。',
      date: '2025-10-21',
      author: 'Team Caglla',
      tags: ['Product', 'Roadmap'],
      content:
        'Caglla は、旅行計画を美しく、簡単に管理できるプラットフォームです。複雑な旅程管理を誰でも使える直感的なツールに変え、旅行の楽しさを最大化します。',
    },
    {
      slug: 'support-and-faq-refresh',
      title: 'Support/FAQ/Docsを刷新しました',
      excerpt: '検索・カテゴリ・自己解決を重視したヘルプセンターを導入しました。',
      date: '2025-10-30',
      author: 'Team Caglla',
      tags: ['Updates', 'Support'],
      content:
        'サポートセンター・FAQ・ドキュメントを「検索/カテゴリ/自己解決」方針で再構築しました。より短い導線で答えにたどり着けます。',
    },
  ]
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return getAllBlogPosts().find((p) => p.slug === slug)
}

