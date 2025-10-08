/**
 * URL-safe スラッグ生成・正規化ユーティリティ
 * 日本語・英語・記号を含む文字列をURL-safeなスラッグに変換
 */

/**
 * 文字列をURL-safeなスラッグに変換
 * @param text 変換対象の文字列
 * @returns URL-safeなスラッグ
 */
export function generateSlug(text: string): string {
  if (!text) return ''
  
  return text
    // 日本語のひらがな・カタカナをローマ字に変換（簡易版）
    .replace(/[\u3041-\u3096]/g, (char) => hiraganaToRomaji(char))
    .replace(/[\u30A1-\u30F6]/g, (char) => katakanaToRomaji(char))
    // 英数字以外をハイフンに変換
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    // 複数のスペースを単一のハイフンに変換
    .replace(/\s+/g, '-')
    // 複数のハイフンを単一のハイフンに変換
    .replace(/-+/g, '-')
    // 先頭・末尾のハイフンを削除
    .replace(/^-+|-+$/g, '')
    // 小文字に変換
    .toLowerCase()
    // 最大長制限（50文字）
    .substring(0, 50)
}

/**
 * ひらがなをローマ字に変換（簡易版）
 */
function hiraganaToRomaji(char: string): string {
  const hiraganaMap: { [key: string]: string } = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po'
  }
  
  return hiraganaMap[char] || char
}

/**
 * カタカナをローマ字に変換（簡易版）
 */
function katakanaToRomaji(char: string): string {
  const katakanaMap: { [key: string]: string } = {
    'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
    'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
    'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
    'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
    'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
    'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
    'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
    'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
    'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
    'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
    'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
    'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
    'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
    'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
    'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po'
  }
  
  return katakanaMap[char] || char
}

/**
 * ユニークなスラッグを生成（重複時は連番を付与）
 * @param baseText ベースとなる文字列
 * @param existingSlugs 既存のスラッグ配列
 * @returns ユニークなスラッグ
 */
export function generateUniqueSlug(baseText: string, existingSlugs: string[]): string {
  const baseSlug = generateSlug(baseText)
  
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug
  }
  
  // 重複時は連番を付与
  let counter = 1
  let uniqueSlug = `${baseSlug}-${counter}`
  
  while (existingSlugs.includes(uniqueSlug)) {
    counter++
    uniqueSlug = `${baseSlug}-${counter}`
  }
  
  return uniqueSlug
}

/**
 * スラッグの妥当性を検証
 * @param slug 検証対象のスラッグ
 * @returns 妥当性の結果
 */
export function validateSlug(slug: string): { isValid: boolean; error?: string } {
  if (!slug) {
    return { isValid: false, error: 'スラッグは必須です' }
  }
  
  if (slug.length < 1) {
    return { isValid: false, error: 'スラッグは1文字以上である必要があります' }
  }
  
  if (slug.length > 50) {
    return { isValid: false, error: 'スラッグは50文字以下である必要があります' }
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { isValid: false, error: 'スラッグは小文字の英数字とハイフンのみ使用できます' }
  }
  
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { isValid: false, error: 'スラッグはハイフンで始まったり終わったりできません' }
  }
  
  if (slug.includes('--')) {
    return { isValid: false, error: 'スラッグに連続するハイフンは使用できません' }
  }
  
  return { isValid: true }
}

/**
 * スラッグから表示名を復元（完全ではない）
 * @param slug スラッグ
 * @returns 推測される表示名
 */
export function slugToDisplayName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
