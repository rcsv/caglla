/**
 * 単位変換ユーティリティ
 * メートル法とヤードポンド法の変換を提供
 */

import type { UnitSystem } from '@/lib/core/types'

/**
 * 温度単位変換
 * @param temp 温度（摂氏または華氏）
 * @param from 変換元の単位系
 * @param to 変換先の単位系
 * @returns 変換後の温度
 */
export function convertTemperature(
  temp: number,
  from: UnitSystem,
  to: UnitSystem
): number {
  if (from === to) return temp

  // metric (摂氏) → imperial (華氏)
  if (from === 'metric' && to === 'imperial') {
    return (temp * 9 / 5) + 32
  }

  // imperial (華氏) → metric (摂氏)
  if (from === 'imperial' && to === 'metric') {
    return (temp - 32) * 5 / 9
  }

  return temp
}

/**
 * 距離単位変換
 * @param distanceKm 距離（キロメートル）
 * @param to 変換先の単位系
 * @returns 変換後の距離情報
 */
export function convertDistance(
  distanceKm: number,
  to: UnitSystem
): { value: number; unit: string; formatted: string } {
  if (to === 'metric') {
    if (distanceKm >= 1) {
      return {
        value: distanceKm,
        unit: 'km',
        formatted: `${distanceKm.toFixed(1)} km`
      }
    } else {
      const meters = distanceKm * 1000
      return {
        value: meters,
        unit: 'm',
        formatted: `${Math.round(meters)} m`
      }
    }
  }

  // imperial (ヤードポンド法)
  const miles = distanceKm * 0.621371
  // 0.5マイル以上はマイルで表示、未満はフィートで表示
  if (miles >= 0.5) {
    return {
      value: miles,
      unit: 'mi',
      formatted: `${miles.toFixed(1)} mi`
    }
  } else {
    const feet = miles * 5280
    return {
      value: feet,
      unit: 'ft',
      formatted: `${Math.round(feet)} ft`
    }
  }
}

/**
 * 風速単位変換
 * @param kmh 風速（km/h）
 * @param to 変換先の単位系
 * @returns 変換後の風速情報
 */
export function convertWindSpeed(
  kmh: number,
  to: UnitSystem
): { value: number; unit: string; formatted: string } {
  if (to === 'metric') {
    return {
      value: kmh,
      unit: 'km/h',
      formatted: `${kmh.toFixed(1)} km/h`
    }
  }

  // imperial (mph)
  const mph = kmh * 0.621371
  return {
    value: mph,
    unit: 'mph',
    formatted: `${mph.toFixed(1)} mph`
  }
}

/**
 * 降水量単位変換
 * @param mm 降水量（mm）
 * @param to 変換先の単位系
 * @returns 変換後の降水量情報
 */
export function convertPrecipitation(
  mm: number,
  to: UnitSystem
): { value: number; unit: string; formatted: string } {
  if (to === 'metric') {
    return {
      value: mm,
      unit: 'mm',
      formatted: `${mm.toFixed(1)} mm`
    }
  }

  // imperial (inch)
  const inches = mm * 0.0393701
  return {
    value: inches,
    unit: 'in',
    formatted: `${inches.toFixed(2)} in`
  }
}

/**
 * 温度単位のシンボルを取得
 * @param unitSystem 単位系
 * @returns 温度単位のシンボル（°C または °F）
 */
export function getTemperatureSymbol(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? '°F' : '°C'
}

