/**
 * Z-Index レイヤー管理システム
 * 
 * レイヤーの階層構造を定義し、一貫したz-index管理を提供します。
 * CSS変数と独自クラスを使用して、Tailwind CSSの制限を回避します。
 */

export const Z_INDEX_LAYERS = {
  // 最下層：地図
  MAP: 'map',
  
  // メインコンテンツ層
  MAIN: 'main',
  MAIN_CONTENT: 'main-content',
  
  // 左ペイン・左メニュー
  LEFT_PANEL: 'left-panel',
  LEFT_PANEL_CONTENT: 'left-panel-content',
  
  // マップ関連
  MAP_BUTTON: 'map-button',
  MAP_OVERLAY: 'map-overlay',
  
  // トップメニュー
  TOP_MENU: 'top-menu',
  TOP_MENU_CONTENT: 'top-menu-content',
  
  // ポップアップメニュー
  POPUP_MENU: 'popup-menu',
  POPUP_MENU_CONTENT: 'popup-menu-content',
  
  // フロートのモーダル
  FLOAT_MODAL: 'float-modal',
  FLOAT_MODAL_CONTENT: 'float-modal-content',
  
  // ダイアログ内要素
  DIALOG_POPUP: 'dialog-popup',
  DIALOG_OVERLAY: 'dialog-overlay',
  
  // ユーザー設定ダイアログ（最上位）
  USER_SETTINGS: 'user-settings',
  USER_SETTINGS_CONTENT: 'user-settings-content',
} as const

/**
 * Z-Index CSSクラス名を取得するヘルパー関数
 * @param layer レイヤー名
 * @returns CSSクラス名
 */
export function getZIndexClass(layer: keyof typeof Z_INDEX_LAYERS): string {
  return `zidx-${Z_INDEX_LAYERS[layer]}`
}

/**
 * レイヤーの説明
 */
export const LAYER_DESCRIPTIONS = {
  MAP: '地図（最下層）',
  MAIN: 'メインコンテンツ',
  MAIN_CONTENT: 'メインコンテンツ詳細',
  LEFT_PANEL: '左メニュー',
  LEFT_PANEL_CONTENT: '左メニュー詳細',
  MAP_BUTTON: 'マップボタン',
  MAP_OVERLAY: 'マップオーバーレイ',
  TOP_MENU: 'トップメニュー',
  TOP_MENU_CONTENT: 'トップメニュー詳細',
  POPUP_MENU: 'ポップアップメニュー',
  POPUP_MENU_CONTENT: 'ポップアップメニュー詳細',
  FLOAT_MODAL: 'モーダルダイアログ',
  FLOAT_MODAL_CONTENT: 'モーダルダイアログ詳細',
  DIALOG_POPUP: 'ダイアログ内ポップアップ',
  DIALOG_OVERLAY: 'ダイアログ内オーバーレイ',
  USER_SETTINGS: 'ユーザー設定ダイアログ',
  USER_SETTINGS_CONTENT: 'ユーザー設定ダイアログ詳細',
} as const

/**
 * 使用例:
 * 
 * // CSSクラスを使用
 * const mapClass = getZIndexClass('MAP') // 'zidx-map'
 * const menuClass = getZIndexClass('POPUP_MENU') // 'zidx-popup-menu'
 * 
 * // JSXでの使用
 * <div className={getZIndexClass('FLOAT_MODAL')}>
 *   <div className={getZIndexClass('FLOAT_MODAL_CONTENT')}>
 *     モーダルコンテンツ
 *   </div>
 * </div>
 */
