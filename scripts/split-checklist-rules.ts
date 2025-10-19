/**
 * checklist-rules.ts を

カテゴリ別に分割するスクリプト
 */

import * as fs from 'fs'
import * as path from 'path'

const sourceFile = path.join(__dirname, '../lib/data/checklist-rules.ts')
const outputDir = path.join(__dirname, '../lib/data/checklist-rules')

// カテゴリの定義（開始行番号とファイル名のマッピング）
const categories = [
  { start: 39, name: 'transportation', label: 'Transportation（乗り物）' },
  { start: 146, name: 'shopping', label: 'Shopping（買い物）' },
  { start: 170, name: 'accommodation', label: 'Accommodation（宿泊）' },
  { start: 325, name: 'adventure', label: 'Adventure（探検）' },
  { start: 452, name: 'entertainment', label: 'Entertainment（遊び）' },
  { start: 497, name: 'culture', label: 'Culture（文化）' },
  { start: 548, name: 'wellness', label: 'Wellness（健康）' },
  { start: 572, name: 'service', label: 'Service（サービス）' },
  { start: 780, name: 'dining', label: 'Dining（食事）' },
  { start: 1106, name: 'exploration', label: 'Exploration（探索）' },
]

function main() {
  console.log('📂 Reading source file...')
  const content = fs.readFileSync(sourceFile, 'utf-8')
  const lines = content.split('\n')

  console.log(`📊 Total lines: ${lines.length}`)

  // 各カテゴリファイルを作成
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i]
    const nextCategory = categories[i + 1]
    
    const startLine = category.start - 1 // 0-indexed
    const endLine = nextCategory ? nextCategory.start - 3 : lines.length - 2 // セクションコメント前まで

    console.log(`\n✂️  Extracting ${category.name} (lines ${category.start}-${endLine + 1})...`)

    // ルール部分を抽出（セクションコメントは除く）
    const ruleLines = lines.slice(startLine + 2, endLine + 1) // +2 でセクションコメントをスキップ
    
    // 最初の { から最後の }, まで抽出
    let startIdx = 0
    let endIdx = ruleLines.length - 1

    // 前後の空行を削除
    while (startIdx < ruleLines.length && ruleLines[startIdx].trim() === '') {
      startIdx++
    }
    while (endIdx > 0 && ruleLines[endIdx].trim() === '') {
      endIdx--
    }

    const extractedLines = ruleLines.slice(startIdx, endIdx + 1)
    
    // ファイル作成
    const outputFile = path.join(outputDir, `${category.name}.ts`)
    const fileContent = `/**
 * ${category.label}関連のチェックリストルール
 */

import { ChecklistGenerationRule } from './types'

export const ${category.name.toUpperCase()}_RULES: ChecklistGenerationRule[] = [
${extractedLines.join('\n')}
]
`

    fs.writeFileSync(outputFile, fileContent, 'utf-8')
    console.log(`✅ Created ${category.name}.ts (${extractedLines.length} lines)`)
  }

  console.log('\n📝 Creating index.ts...')
  
  // index.ts を作成
  const indexContent = `/**
 * チェックリスト生成ルールマスターデータ
 * 
 * アクティビティタグに基づき、チェックリスト項目を自動生成するためのルール定義
 */

// 型定義のエクスポート
export type { ChecklistCondition, ChecklistRuleItem, ChecklistGenerationRule } from './types'

// 各カテゴリのルールをエクスポート
${categories.map(c => `export { ${c.name.toUpperCase()}_RULES } from './${c.name}'`).join('\n')}

// すべてのルールを統合（後方互換性のため）
${categories.map(c => `import { ${c.name.toUpperCase()}_RULES } from './${c.name}'`).join('\n')}

export const CHECKLIST_RULES = [
${categories.map(c => `  ...${c.name.toUpperCase()}_RULES,`).join('\n')}
]

/**
 * カテゴリ別にルールを取得
 */
export function getRulesByCategory(category: string): any[] {
  switch (category.toLowerCase()) {
${categories.map(c => `    case '${c.name}': return ${c.name.toUpperCase()}_RULES`).join('\n')}
    default: return []
  }
}
`

  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent, 'utf-8')
  console.log('✅ Created index.ts')

  console.log('\n🎉 Split completed!')
  console.log(`\n📊 Summary:`)
  console.log(`   - Total categories: ${categories.length}`)
  console.log(`   - Output directory: ${outputDir}`)
  console.log(`\n⚠️  Next steps:`)
  console.log(`   1. Verify the generated files`)
  console.log(`   2. Run: npm run type-check`)
  console.log(`   3. Test checklist generation`)
  console.log(`   4. Move original file: git mv lib/data/checklist-rules.ts lib/data/checklist-rules-legacy.ts`)
}

main()

