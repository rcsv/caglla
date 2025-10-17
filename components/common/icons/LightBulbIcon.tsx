'use client'

import React from 'react'

export interface LightBulbIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  color?: string
  strokeWidth?: number
}

export const LightBulbIcon: React.FC<LightBulbIconProps> = ({
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
    aria-label="Light Bulb"
    className={className}
    {...rest}
  >
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M2 11a10 10 0 0 1 20 0c0 3.38-1.88 6.31-4.67 7.86-.23.13-.33.39-.33.64V20H7v-.5c0-.25-.1-.51-.33-.64C3.88 17.31 2 14.38 2 11z" />
  </svg>
)

export default LightBulbIcon


