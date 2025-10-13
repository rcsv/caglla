'use client'

import React from 'react'

export interface CollapseIconProps {
  className?: string
  color?: string
}

export const CollapseIcon: React.FC<CollapseIconProps> = ({
  className = 'w-5 h-5',
  color = 'currentColor'
}) => (
  <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9v4.5M15 9h4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15v4.5m0-4.5h4.5m-4.5 0l5.5 5.5" />
  </svg>
)

export default CollapseIcon
