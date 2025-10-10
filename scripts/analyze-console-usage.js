#!/usr/bin/env node
/**
 * console.log 使用箇所分析スクリプト
 * 各ファイルのconsole使用状況を分析し、優先度別にリスト化
 */

const fs = require('fs');
const path = require('path');

// 除外するディレクトリとファイル
const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build', 'docs'];
const EXCLUDE_FILES = ['logger.ts', 'api-error-handler.ts', 'console-migration-list.csv'];

// 優先度分類
const PRIORITY_RULES = {
  'A-最優先': [
    'app/api/debug/',
    'app/api/users/',
    'app/api/trip/',
    'app/api/trips/',
    'app/api/itineraries/',
  ],
  'B-高': [
    'lib/places-cache',
    'lib/image-upload',
    'lib/weather-api',
    'lib/slug-data-helpers',
    'lib/route-optimization',
    'lib/firebase',
    'lib/auth-context',
  ],
  'C-中': [
    'components/trip/',
    'components/ui/',
    'components/modals/',
  ],
  'D-低': [
    'app/test/',
    'components/stats/',
    'app/subscription/',
  ],
};

// ファイルの優先度を判定
function getPriority(filePath) {
  for (const [priority, patterns] of Object.entries(PRIORITY_RULES)) {
    for (const pattern of patterns) {
      if (filePath.includes(pattern)) {
        return priority;
      }
    }
  }
  
  // デフォルト優先度
  if (filePath.startsWith('app/api/')) return 'A-最優先';
  if (filePath.startsWith('lib/')) return 'B-高';
  if (filePath.startsWith('components/')) return 'C-中';
  return 'D-低';
}

// カテゴリを判定
function getCategory(filePath) {
  if (filePath.includes('/api/')) return 'API';
  if (filePath.startsWith('lib/')) return 'Library';
  if (filePath.startsWith('components/')) return 'Component';
  if (filePath.startsWith('app/')) return 'Page';
  return 'Other';
}

// ファイル内のconsole使用箇所をカウント
function countConsoleUsage(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const usages = {
      log: 0,
      error: 0,
      warn: 0,
      debug: 0,
      info: 0,
      total: 0,
      lines: []
    };
    
    lines.forEach((line, index) => {
      const match = line.match(/console\.(log|error|warn|debug|info)/);
      if (match) {
        const type = match[1];
        usages[type]++;
        usages.total++;
        usages.lines.push({
          lineNum: index + 1,
          type,
          content: line.trim().substring(0, 80)
        });
      }
    });
    
    return usages;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

// ディレクトリを再帰的に走査
function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // 除外ディレクトリをスキップ
    if (stat.isDirectory()) {
      if (EXCLUDE_DIRS.includes(file) || file.startsWith('.')) {
        continue;
      }
      scanDirectory(filePath, results);
    } else if (stat.isFile()) {
      // TypeScript/TSXファイルのみ対象
      if (!['.ts', '.tsx'].includes(path.extname(file))) {
        continue;
      }
      
      // 除外ファイルをスキップ
      if (EXCLUDE_FILES.includes(file)) {
        continue;
      }
      
      const relativePath = path.relative(process.cwd(), filePath);
      
      // docs配下を除外
      if (relativePath.startsWith('docs/')) {
        continue;
      }
      
      const usages = countConsoleUsage(filePath);
      
      if (usages && usages.total > 0) {
        results.push({
          path: relativePath,
          priority: getPriority(relativePath),
          category: getCategory(relativePath),
          ...usages
        });
      }
    }
  }
  
  return results;
}

// メイン処理
function main() {
  console.log('🔍 console.log 使用箇所を分析中...\n');
  
  const results = scanDirectory('.');
  
  // 優先度とファイル名でソート
  results.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority.localeCompare(b.priority);
    }
    return b.total - a.total;
  });
  
  // CSV出力
  const csvPath = 'console-migration-list.csv';
  const csvLines = [
    'Priority,Category,File,Total,Log,Error,Warn,Debug,Info,Status,Notes'
  ];
  
  results.forEach(result => {
    csvLines.push([
      result.priority,
      result.category,
      result.path,
      result.total,
      result.log,
      result.error,
      result.warn,
      result.debug,
      result.info,
      '未対応',
      ''
    ].join(','));
  });
  
  fs.writeFileSync(csvPath, csvLines.join('\n'));
  
  // サマリー出力
  console.log('📊 分析結果サマリー\n');
  console.log('='.repeat(80));
  
  const summary = {};
  results.forEach(result => {
    if (!summary[result.priority]) {
      summary[result.priority] = { files: 0, total: 0, log: 0, error: 0, warn: 0 };
    }
    summary[result.priority].files++;
    summary[result.priority].total += result.total;
    summary[result.priority].log += result.log;
    summary[result.priority].error += result.error;
    summary[result.priority].warn += result.warn;
  });
  
  console.log('優先度別サマリー:');
  console.log('-'.repeat(80));
  Object.entries(summary).forEach(([priority, data]) => {
    console.log(`${priority}:`);
    console.log(`  ファイル数: ${data.files}`);
    console.log(`  総箇所数: ${data.total}`);
    console.log(`  内訳: log=${data.log}, error=${data.error}, warn=${data.warn}`);
    console.log();
  });
  
  console.log('='.repeat(80));
  console.log(`\n✅ 分析完了: ${results.length}ファイル、総計 ${results.reduce((sum, r) => sum + r.total, 0)}箇所`);
  console.log(`📄 詳細は ${csvPath} を参照してください\n`);
  
  // トップ20表示
  console.log('🔝 console使用が多いファイル Top 20:\n');
  console.log('-'.repeat(80));
  console.log('優先度     | 箇所数 | ファイル');
  console.log('-'.repeat(80));
  
  results.slice(0, 20).forEach(result => {
    console.log(`${result.priority.padEnd(10)} | ${String(result.total).padStart(6)} | ${result.path}`);
  });
  console.log('-'.repeat(80));
}

// 実行
if (require.main === module) {
  main();
}

module.exports = { scanDirectory, countConsoleUsage, getPriority };

