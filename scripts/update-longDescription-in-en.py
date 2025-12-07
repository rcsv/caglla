#!/usr/bin/env python3
"""
longDescription_en_extract.txt の内容を en.ts に反映するスクリプト

使用方法:
    python3 scripts/update-longDescription-in-en.py
"""

import re
import sys
from pathlib import Path

# パスの設定
BASE_DIR = Path(__file__).parent.parent
EN_TS_PATH = BASE_DIR / "lib/i18n/en.ts"
EXTRACT_FILE_PATH = BASE_DIR / "longDescription_en_extract.txt"


def parse_extract_file(file_path: Path) -> dict[str, str]:
    """longDescription_en_extract.txt からエントリを抽出"""
    entries = {}
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # --- で区切られたセクションを処理
    sections = content.split('---\n')
    
    for section in sections:
        section = section.strip()
        if not section:
            continue
        
        lines = section.split('\n')
        if not lines:
            continue
        
        # 最初の行からキーを抽出
        first_line = lines[0]
        match = re.match(r'^\s*"([^"]+\.longDescription)":\s*(.*)$', first_line)
        if not match:
            continue
        
        key = match.group(1)
        
        # 値の部分を抽出（複数行の場合も含む）
        if len(lines) == 1:
            # 1行の場合
            value_part = match.group(2)
            # 末尾のカンマを除去
            if value_part.endswith(','):
                value_part = value_part[:-1]
            entries[key] = value_part.strip()
        else:
            # 複数行の場合
            # 最初の行の値部分と残りの行を結合
            value_lines = [match.group(2)]
            for line in lines[1:]:
                value_lines.append(line)
            
            value = '\n'.join(value_lines)
            # 末尾のカンマを除去
            if value.rstrip().endswith(','):
                value = value.rstrip()[:-1]
            entries[key] = value.rstrip()
    
    return entries


def update_en_ts(entries: dict[str, str]) -> None:
    """en.ts ファイル内の longDescription エントリを更新"""
    with open(EN_TS_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # longDescription エントリの開始を検出
        if '.longDescription' in line:
            match = re.match(r'^(\s*)"([^"]+\.longDescription)":\s*(.*)$', line)
            if match:
                indent = match.group(1)
                key = match.group(2)
                value_start = match.group(3)
                
                # 更新されたエントリがあるか確認
                if key in entries:
                    new_value = entries[key]
                    
                    # バッククォート文字列の場合
                    if new_value.startswith('`') and new_value.endswith('`'):
                        # 複数行に展開
                        value_content = new_value[1:-1]  # バッククォートを除去
                        value_lines = value_content.split('\n')
                        
                        # 最初の行
                        new_lines.append(f'{indent}"{key}": `{value_lines[0]}\n')
                        
                        # 中間の行
                        for j in range(1, len(value_lines)):
                            new_lines.append(f'{value_lines[j]}\n')
                        
                        # 最後の行（閉じるバッククォート）
                        new_lines.append(f'{indent}`,\n')
                    else:
                        # 通常の文字列
                        new_lines.append(f'{indent}"{key}": {new_value},\n')
                    
                    # 元のエントリの残りの行をスキップ
                    i += 1
                    
                    # バッククォート文字列の場合、閉じるまでスキップ
                    if value_start.strip().startswith('`') and value_start.count('`') == 1:
                        while i < len(lines):
                            if '`' in lines[i] and (lines[i].strip().endswith('`') or (',' in lines[i] and '`' in lines[i])):
                                i += 1
                                break
                            i += 1
                    elif not value_start.strip().endswith(',') and not value_start.strip().endswith('`'):
                        # 1行で完結していない場合、次の行まで確認
                        if i < len(lines) and (',' in lines[i] or '`' in lines[i]):
                            i += 1
                    
                    continue
        
        # 通常の行はそのまま追加
        new_lines.append(line)
        i += 1
    
    # ファイルに書き戻し
    with open(EN_TS_PATH, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f'✅ Updated {len(entries)} longDescription entries in {EN_TS_PATH}')


def main():
    print('📖 Reading longDescription entries from extract file...')
    entries = parse_extract_file(EXTRACT_FILE_PATH)
    print(f'   Found {len(entries)} entries')
    
    if not entries:
        print('⚠️  No entries found in extract file!')
        sys.exit(1)
    
    print('📝 Updating en.ts...')
    update_en_ts(entries)
    
    print('✅ Done!')


if __name__ == '__main__':
    main()

