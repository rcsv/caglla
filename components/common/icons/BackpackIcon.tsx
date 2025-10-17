'use client'

import React from 'react'

export interface BackpackIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  color?: string
  strokeWidth?: number
}

export const BackpackIcon: React.FC<BackpackIconProps> = ({
  className = 'w-4 h-4',
  color = 'currentColor',
  strokeWidth = 2,
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
    aria-label="Backpack"
    className={className}
    {...rest}
  >
    <path d="M4 9l1-1h14l1 1v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9z" />
    <path d="M7 8V6a5 5 0 0 1 10 0v2" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </svg>
)

export default BackpackIcon

