'use client'

import React from 'react'

export interface AirplaneIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  color?: string
  strokeWidth?: number
}

export const AirplaneIcon: React.FC<AirplaneIconProps> = ({
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 1.8,
  ...rest
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label="Airplane"
    className={className}
    {...rest}
  >
    {/* Simple airplane silhouette */}
    <path d="M3 12l8 1 3 7h1l1-6 6 1v-1l-6-3 1-6h-1l-4 5-8-1v2z" />
    <path d="M8 13l-3 3" />
  </svg>
)

export default AirplaneIcon


