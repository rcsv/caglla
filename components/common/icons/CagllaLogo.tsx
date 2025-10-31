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
      
      {/* 角ばった「Cg」のテキスト */}
      <text
        x="16"
        y="20"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill="white"
        fontFamily="var(--font-rajdhani), 'Rajdhani', 'Arial Black', sans-serif"
        letterSpacing="-0.3"
        style={{ fontVariant: 'normal', fontStyle: 'normal' }}
      >
        Cg
      </text>
    </svg>
  )
}

export default CagllaLogo

