'use client'

import React from 'react'

export interface CagllaLogoProps {
  className?: string
}

/**
 * Cagllaロゴ - 緑の矩形背景に角ばったCとgを配置
 */
export const CagllaLogo: React.FC<CagllaLogoProps> = ({
  className = 'w-8 h-8',
}) => {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Caglla Logo"
    >
      {/* グラデーション定義 */}
      <defs>
        <linearGradient id="caglla-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" /> {/* emerald-500 */}
          <stop offset="100%" stopColor="#059669" /> {/* emerald-600 */}
        </linearGradient>
      </defs>
      
      {/* 緑の矩形背景（少し角丸） */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="4"
        fill="url(#caglla-gradient)"
      />
      
      {/* 角ばった「C」- 太めのストロークで */}
      <path
        d="M 8 10 
           L 8 6
           L 18 6
           L 18 8
           L 10 8
           L 10 10
           L 12 10
           L 12 12
           L 16 12
           L 16 14
           L 18 14
           L 18 16
           L 12 16
           L 12 20
           L 18 20
           L 18 22
           L 10 22
           L 10 24
           L 18 24
           L 18 26
           L 8 26
           L 8 22
           L 10 22
           L 10 20
           L 14 20
           L 14 16
           L 10 16
           L 10 14
           L 12 14
           L 12 12
           L 10 12
           L 10 10
           Z"
        fill="white"
      />
      
      {/* 角ばった「g」- Cの横に配置 */}
      <path
        d="M 22 10
           L 22 6
           L 26 6
           L 26 10
           L 24 10
           L 24 14
           L 26 14
           L 26 18
           L 24 18
           L 24 20
           L 22 20
           L 22 18
           L 20 18
           L 20 14
           L 22 14
           L 22 10
           Z
           M 22 20
           L 22 22
           L 26 22
           L 26 24
           L 24 24
           L 24 26
           L 22 26
           L 22 24
           L 20 24
           L 20 22
           L 22 22
           Z"
        fill="white"
      />
    </svg>
  )
}

export default CagllaLogo

