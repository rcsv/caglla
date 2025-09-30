/**
 * Z-Index レイヤー管理システム
 * 
 * レイヤーの階層構造を定義し、一貫したz-index管理を提供します。
 * 各レイヤーは10の倍数で定義され、必要に応じて中間値を追加できます。
 */

export const Z_INDEX_LAYERS = {
  // 最下層：地図
  MAP: 0,
  
  // メインコンテンツ層
  MAIN_CONTENT: 10,
  
  // 左ペイン・左メニュー
  LEFT_PANEL: 20,
  
  // セッティングダイアログ
  SETTINGS_DIALOG: 30,
  
  // ポップアップメニュー
  POPUP_MENU: 40,
  
  // フロートのモーダル
  FLOAT_MODAL: 50,
} as const

/**
 * Z-Index値を取得するヘルパー関数
 * @param layer レイヤー名
 * @param offset オフセット値（デフォルト: 0）
 * @returns z-index値
 */
export function getZIndex(layer: keyof typeof Z_INDEX_LAYERS, offset: number = 0): number {
  return Z_INDEX_LAYERS[layer] + offset
}

/**
 * Tailwind CSS用のz-indexクラス名を生成
 * @param layer レイヤー名
 * @param offset オフセット値（デフォルト: 0）
 * @returns Tailwind CSSクラス名
 */
export function getZIndexClass(layer: keyof typeof Z_INDEX_LAYERS, offset: number = 0): string {
  const value = getZIndex(layer, offset)
  return `z-[${value}]`
}

/**
 * レイヤーの説明
 */
export const LAYER_DESCRIPTIONS = {
  MAP: '地図（最下層）',
  MAIN_CONTENT: '左ペイン・メインコンテンツ',
  LEFT_PANEL: '左ペイン・左メニュー',
  SETTINGS_DIALOG: 'セッティングダイアログ',
  POPUP_MENU: 'ポップアップメニュー',
  FLOAT_MODAL: 'フロートのモーダル',
} as const

/**
 * 使用例:
 * 
 * // 直接値を使用
 * const mapZIndex = getZIndex('MAP') // 0
 * const menuZIndex = getZIndex('POPUP_MENU') // 40
 * 
 * // Tailwind CSSクラスを使用
 * const mapClass = getZIndexClass('MAP') // 'z-[0]'
 * const menuClass = getZIndexClass('POPUP_MENU') // 'z-[40]'
 * 
 * // オフセット付き
 * const subMenuZIndex = getZIndex('POPUP_MENU', 1) // 41
 * const subMenuClass = getZIndexClass('POPUP_MENU', 1) // 'z-[41]'
 */
