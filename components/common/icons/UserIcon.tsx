'use client'

import React from 'react'

export interface UserIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  color?: string
  strokeWidth?: number
}

export const UserIcon: React.FC<UserIconProps> = ({
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
    aria-label="User"
    className={className}
    {...rest}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

export default UserIcon

