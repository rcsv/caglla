'use client'

import React from 'react'
import { TrainIcon } from './TrainIcon'
import { ShoppingIcon } from './ShoppingIcon'
import { DiningIcon } from './DiningIcon'
import { HotelIcon } from './HotelIcon'
import { SearchIcon } from './SearchIcon'
import { AirplaneIcon } from './AirplaneIcon'

// アイコン名からSVGコンポーネントへのマップ
const iconMap: Record<string, React.ComponentType<any>> = {
  'train': TrainIcon,
  'shopping': ShoppingIcon,
  'dining': DiningIcon,
  'hotel': HotelIcon,
  'search': SearchIcon,
  'airplane': AirplaneIcon,
}

export interface IconRendererProps {
  iconName?: string
  fallbackEmoji?: string
  className?: string
  color?: string
}

/**
 * アイコン名または絵文字をレンダリングするコンポーネント
 * アイコン名がマップに存在する場合はSVGを、そうでなければ絵文字を表示
 */
export const IconRenderer: React.FC<IconRendererProps> = ({
  iconName,
  fallbackEmoji,
  className = 'w-4 h-4',
  color = 'currentColor',
}) => {
  if (iconName && iconMap[iconName]) {
    const IconComponent = iconMap[iconName]
    return <IconComponent className={className} color={color} />
  }
  
  if (fallbackEmoji) {
    return <span className={className}>{fallbackEmoji}</span>
  }
  
  return null
}

export default IconRenderer

