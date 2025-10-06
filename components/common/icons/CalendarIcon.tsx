'use client'

import React from 'react'

export interface CalendarIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  color?: string
  strokeWidth?: number
}

export const CalendarIcon: React.FC<CalendarIconProps> = ({
  className = 'w-5 h-5',
  color = 'currentColor',
  strokeWidth = 2,
  ...rest
}) => (
  <svg
    className={className}
    fill="none"
    stroke={color}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

export default CalendarIcon


