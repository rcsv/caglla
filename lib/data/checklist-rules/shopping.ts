/**
 * Shopping（買い物）関連のチェックリストルール
 */

import { ChecklistGenerationRule } from './types'

export const SHOPPING_RULES: ChecklistGenerationRule[] = [
  {
    id: 'shopping_rule',
    secondaryCategory: 'souvenir',
    items: [
      {
        title: 'エコバッグ・折りたたみバッグ',
        description: 'お土産を入れるのに便利',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '現金（お土産予算）',
        description: '市場や小規模店舗ではカード不可の場合あり',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
]
