'use client'

import React from 'react'
import { Icon } from '@iconify/react'

export interface UnifiedIconProps {
  icon: string
  className?: string
  color?: string
  ariaLabel?: string
}

export const UnifiedIcon: React.FC<UnifiedIconProps> = ({
  icon,
  className = 'w-4 h-4',
  color,
  ariaLabel,
}) => {
  return (
    <Icon icon={icon} className={className} color={color} aria-label={ariaLabel} role="img" />
  )
}

export default UnifiedIcon


