#!/usr/bin/env python3
"""
checklist-rulesファイルからlongDescriptionキーを抽出し、en.tsに追加するスクリプト

使用方法:
    python3 scripts/add-longDescription-keys.py
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Tuple

BASE_DIR = Path(__file__).parent.parent
RULES_DIR = BASE_DIR / "lib/data/checklist-rules"
EN_TS_PATH = BASE_DIR / "lib/i18n/en.ts"

def extract_longDescription_keys_from_rules() -> List[Tuple[str, str]]:
    """checklist-rulesファイルからlongDescriptionキーを抽出"""
    keys = []
    
    # 各ルールファイルを処理
    rule_files = [
        "transportation.ts",
        "accommodation.ts",
        "wellness.ts",
        "adventure.ts",
        "culture.ts",
        "dining.ts",
        "entertainment.ts",
        "exploration.ts",
        "service.ts",
        "shopping.ts",
    ]
    
    for rule_file in rule_files:
        file_path = RULES_DIR / rule_file
        if not file_path.exists():
            continue
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # longDescriptionキーを抽出
        # パターン: longDescription: "checklist.items.{rule_id}.{item_key}.longDescription"
        pattern = r'longDescription:\s*"checklist\.items\.([^"]+)\.longDescription"'
        matches = re.findall(pattern, content)
        
        for match in matches:
            full_key = f"checklist.items.{match}.longDescription"
            keys.append((full_key, rule_file))
    
    return keys

def get_existing_keys_from_en_ts() -> set:
    """en.tsから既存のlongDescriptionキーを取得"""
    existing_keys = set()
    
    with open(EN_TS_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # longDescriptionキーを抽出
    pattern = r'"checklist\.items\.[^"]+\.longDescription"'
    matches = re.findall(pattern, content)
    
    for match in matches:
        # クォートを除去
        key = match.strip('"')
        existing_keys.add(key)
    
    return existing_keys

def add_keys_to_en_ts(new_keys: List[str]):
    """en.tsに新しいlongDescriptionキーを追加"""
    with open(EN_TS_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 最後のchecklist.itemsエントリを見つける
    last_checklist_items_line = None
    for i in range(len(lines) - 1, -1, -1):
        if '"checklist.items.' in lines[i]:
            last_checklist_items_line = i
            break
    
    if last_checklist_items_line is None:
        print("❌ checklist.itemsエントリが見つかりません")
        return
    
    # 既存のキーを確認
    existing_in_file = set()
    for line in lines:
        match = re.search(r'"checklist\.items\.[^"]+\.longDescription"', line)
        if match:
            key = match.group(0).strip('"')
            existing_in_file.add(key)
    
    # 新しいキーを追加（アルファベット順にソート）
    keys_to_add = sorted([k for k in new_keys if k not in existing_in_file])
    
    if not keys_to_add:
        print("✅ 追加する新しいキーはありません")
        return
    
    # 挿入位置を決定（最後のchecklist.itemsエントリの後、閉じ括弧の前）
    insert_pos = last_checklist_items_line + 1
    
    # 次の行が閉じ括弧でない場合、適切な位置を見つける
    for i in range(last_checklist_items_line + 1, min(last_checklist_items_line + 10, len(lines))):
        if lines[i].strip() == '};' or lines[i].strip() == '};':
            insert_pos = i
            break
    
    # キーを追加
    indent = "\t"  # タブ（en.tsの形式に合わせる）
    new_lines = []
    for key in keys_to_add:
        # プレースホルダー値（ユーザーが後で編集する）
        placeholder = "TODO: Add detailed description"
        
        new_lines.append(f'{indent}"{key}": "{placeholder}",\n')
    
    # 挿入
    lines[insert_pos:insert_pos] = new_lines
    
    # ファイルに書き込み
    with open(EN_TS_PATH, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print(f"✅ {len(keys_to_add)}個のlongDescriptionキーをen.tsに追加しました")
    for key in keys_to_add:
        print(f"   - {key}")

def main():
    print("🔍 checklist-rulesファイルからlongDescriptionキーを抽出中...")
    keys_from_rules = extract_longDescription_keys_from_rules()
    
    print(f"\n📋 抽出されたキー: {len(keys_from_rules)}個")
    for key, file in keys_from_rules:
        print(f"   - {key} ({file})")
    
    print("\n🔍 en.tsから既存のキーを確認中...")
    existing_keys = get_existing_keys_from_en_ts()
    print(f"   既存のキー: {len(existing_keys)}個")
    
    # 新しいキーのみ抽出
    new_keys = [key for key, _ in keys_from_rules if key not in existing_keys]
    
    if not new_keys:
        print("\n✅ すべてのキーが既にen.tsに存在します")
        return
    
    print(f"\n➕ 追加するキー: {len(new_keys)}個")
    for key in new_keys:
        print(f"   - {key}")
    
    print("\n📝 en.tsにキーを追加中...")
    add_keys_to_en_ts(new_keys)
    
    print("\n✅ 完了しました！")

if __name__ == "__main__":
    main()

