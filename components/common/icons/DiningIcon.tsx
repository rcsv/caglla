'use client'

import React from 'react'

export interface DiningIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  color?: string
  strokeWidth?: number
}

export const DiningIcon: React.FC<DiningIconProps> = ({
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
    aria-label="Dining"
    className={className}
    {...rest}
  >
    <path d="M3 2v7c0 1.1.9 2 2 2h4v11a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V11h4c1.1 0 2-.9 2-2V2H3z" />
    <path d="M8 7h8" />
    <path d="M12 7v4" />
  </svg>
)

export default DiningIcon

