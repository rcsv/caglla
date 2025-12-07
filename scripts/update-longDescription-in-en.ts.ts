#!/usr/bin/env ts-node
/**
 * longDescription_en_extract.txt の内容を en.ts に反映するスクリプト
 * 
 * 使用方法:
 *   ts-node scripts/update-longDescription-in-en.ts.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const EN_TS_PATH = path.join(__dirname, '../lib/i18n/en.ts');
const EXTRACT_FILE_PATH = path.join(__dirname, '../longDescription_en_extract.txt');

interface LongDescriptionEntry {
  key: string;
  value: string;
  fullText: string; // 元のテキスト全体（インデント含む）
}

/**
 * longDescription_en_extract.txt からエントリを抽出
 */
function parseExtractFile(filePath: string): LongDescriptionEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const entries: LongDescriptionEntry[] = [];
  
  // --- で区切られたセクションを処理
  const sections = content.split('---\n').filter(s => s.trim());
  
  for (const section of sections) {
    const lines = section.split('\n').filter(l => l.trim());
    if (lines.length === 0) continue;
    
    // 最初の行からキーと値を抽出
    const firstLine = lines[0];
    const match = firstLine.match(/^\s*"([^"]+\.longDescription)":\s*(.*)$/);
    if (!match) continue;
    
    const key = match[1];
    let value = match[2];
    const fullText = section.trim();
    
    // 複数行の場合、残りの行も含める
    if (lines.length > 1) {
      // 最初の行の値部分と残りの行を結合
      const remainingLines = lines.slice(1);
      value = [value, ...remainingLines].join('\n');
    }
    
    entries.push({ key, value, fullText });
  }
  
  return entries;
}

/**
 * en.ts ファイル内の longDescription エントリを更新
 */
function updateEnTs(entries: LongDescriptionEntry[]): void {
  let content = fs.readFileSync(EN_TS_PATH, 'utf-8');
  const lines = content.split('\n');
  const newLines: string[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // longDescription エントリの開始を検出
    if (line.includes('.longDescription')) {
      const match = line.match(/^\s*"([^"]+\.longDescription)":\s*(.*)$/);
      if (match) {
        const key = match[1];
        const entry = entries.find(e => e.key === key);
        
        if (entry) {
          // 更新されたエントリを使用
          // インデントを保持
          const indent = line.match(/^(\s*)/)?.[1] || '';
          
          // エントリの値を整形（元のフォーマットを保持）
          let entryValue = entry.value.trim();
          
          // バッククォート文字列の場合は複数行として扱う
          if (entryValue.startsWith('`') && entryValue.endsWith('`')) {
            // バッククォート文字列を複数行に展開
            const valueContent = entryValue.slice(1, -1); // バッククォートを除去
            const valueLines = valueContent.split('\n');
            
            newLines.push(`${indent}"${key}": \`${valueLines[0]}`);
            for (let j = 1; j < valueLines.length; j++) {
              newLines.push(`${valueLines[j]}`);
            }
            newLines.push(`${indent}\`,`);
          } else {
            // 通常の文字列
            newLines.push(`${indent}"${key}": ${entryValue},`);
          }
          
          // 元のエントリの残りの行をスキップ
          i++;
          
          // 元のファイルの構造に基づいて、バッククォートで囲まれた複数行文字列をスキップ
          // 元の行（line）にバッククォートが含まれているかチェック
          const originalLineValue = match[2].trim();
          const hasBacktickInOriginalLine = originalLineValue.includes('`');
          
          if (hasBacktickInOriginalLine) {
            // バッククォート内かどうかを追跡するフラグ
            let inBacktick = false;
            
            // 元の行内のバッククォートを数えて、開始バッククォートがあるか確認
            let backtickCount = 0;
            for (let charIdx = 0; charIdx < originalLineValue.length; charIdx++) {
              if (originalLineValue[charIdx] === '`') {
                backtickCount++;
              }
            }
            // バッククォートが奇数個なら、まだ閉じられていない（複数行にわたる）
            inBacktick = backtickCount % 2 === 1;
            
            // 終了バッククォートが見つかるまで、またはEOFまで読み進める
            while (i < lines.length && inBacktick) {
              const currentLine = lines[i];
              
              // 行内のバッククォートを数える
              for (let charIdx = 0; charIdx < currentLine.length; charIdx++) {
                if (currentLine[charIdx] === '`') {
                  backtickCount++;
                  // バッククォートが偶数個になったら、バッククォート内から脱出
                  // （開始と終了のペアが揃った）
                  if (backtickCount % 2 === 0) {
                    inBacktick = false;
                    // 終了バッククォートを含む行をスキップ
                    i++;
                    break;
                  }
                }
              }
              
              // まだバッククォート内の場合は次の行へ
              if (inBacktick) {
                i++;
              }
            }
          }
          continue;
        }
      }
    }
    
    // 通常の行はそのまま追加
    newLines.push(line);
    i++;
  }
  
  // ファイルに書き戻し
  fs.writeFileSync(EN_TS_PATH, newLines.join('\n'), 'utf-8');
  console.log(`✅ Updated ${entries.length} longDescription entries in ${EN_TS_PATH}`);
}

/**
 * メイン処理
 */
function main() {
  console.log('📖 Reading longDescription entries from extract file...');
  const entries = parseExtractFile(EXTRACT_FILE_PATH);
  console.log(`   Found ${entries.length} entries`);
  
  console.log('📝 Updating en.ts...');
  updateEnTs(entries);
  
  console.log('✅ Done!');
}

if (require.main === module) {
  main();
}

