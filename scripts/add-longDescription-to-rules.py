#!/usr/bin/env python3
"""
checklist-rulesファイルにlongDescriptionキーを追加するスクリプト

使用方法:
    python3 scripts/add-longDescription-to-rules.py
"""

import re
from pathlib import Path
from typing import List, Tuple

BASE_DIR = Path(__file__).parent.parent
RULES_DIR = BASE_DIR / "lib/data/checklist-rules"

def add_longDescription_to_file(file_path: Path) -> Tuple[int, List[str]]:
    """ファイルにlongDescriptionキーを追加"""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    added_count = 0
    added_keys = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)
        
        # itemKeyとtitleを見つけたら、longDescriptionをチェック
        if 'itemKey:' in line:
            # itemKeyを抽出
            item_key_match = re.search(r'itemKey:\s*"([^"]+)"', line)
            if item_key_match:
                item_key = item_key_match.group(1)
                
                # 次の数行を確認して、titleとdescriptionを見つける
                title_key = None
                rule_id = None
                has_longDescription = False
                
                # 前の行からrule_idを探す（id: "xxx_rule"）
                for j in range(max(0, i - 20), i):
                    id_match = re.search(r'id:\s*"([^"]+)"', lines[j])
                    if id_match:
                        rule_id = id_match.group(1)
                        break
                
                # 次の10行を確認
                for j in range(i, min(i + 15, len(lines))):
                    if 'title:' in lines[j]:
                        title_match = re.search(r'title:\s*"checklist\.items\.([^"]+)"', lines[j])
                        if title_match:
                            title_key = title_match.group(1)
                            # rule_idを抽出（例: checklist.items.check_in_rule.hotel_confirmation_print.title）
                            parts = title_key.split('.')
                            if len(parts) >= 2:
                                rule_id = parts[0]
                    if 'longDescription:' in lines[j]:
                        has_longDescription = True
                        break
                    if j > i and (lines[j].strip().startswith('category:') or lines[j].strip() == '},'):
                        break
                
                # longDescriptionがなく、titleキーがある場合、追加
                if not has_longDescription and title_key and rule_id:
                    # descriptionの次の行にlongDescriptionを追加
                    description_found = False
                    for j in range(i, min(i + 15, len(lines))):
                        if 'description:' in lines[j]:
                            description_found = True
                            # descriptionの行を追加
                            new_lines.append(lines[j])
                            # longDescriptionを追加
                            indent = re.match(r'^(\s*)', lines[j]).group(1)
                            long_desc_key = f'checklist.items.{title_key.replace(".title", "")}.longDescription'
                            new_lines.append(f'{indent}longDescription: "{long_desc_key}",\n')
                            added_count += 1
                            added_keys.append(long_desc_key)
                            i = j + 1
                            break
                    
                    if not description_found:
                        i += 1
                else:
                    i += 1
            else:
                i += 1
        else:
            i += 1
    
    if added_count > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
    
    return added_count, added_keys

def main():
    rule_files = [
        "adventure.ts",
        "culture.ts",
        "dining.ts",
        "entertainment.ts",
        "exploration.ts",
        "service.ts",
        "shopping.ts",
    ]
    
    total_added = 0
    all_keys = []
    
    for rule_file in rule_files:
        file_path = RULES_DIR / rule_file
        if not file_path.exists():
            print(f"⚠️  ファイルが見つかりません: {rule_file}")
            continue
        
        print(f"📝 {rule_file} を処理中...")
        added_count, added_keys = add_longDescription_to_file(file_path)
        
        if added_count > 0:
            print(f"   ✅ {added_count}個のlongDescriptionキーを追加しました")
            total_added += added_count
            all_keys.extend(added_keys)
        else:
            print(f"   ℹ️  追加するキーはありませんでした")
    
    print(f"\n✅ 完了しました！合計{total_added}個のlongDescriptionキーを追加しました")
    
    if all_keys:
        print("\n📋 追加されたキー:")
        for key in sorted(all_keys):
            print(f"   - {key}")
        
        print("\n💡 次のステップ:")
        print("   1. 各checklist-rulesファイルでlongDescriptionキーが正しく追加されたか確認")
        print("   2. scripts/add-longDescription-keys.py を実行してen.tsにキーを追加")

if __name__ == "__main__":
    main()

