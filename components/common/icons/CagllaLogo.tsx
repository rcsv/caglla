'use client'

import React from 'react'

export interface CagllaLogoProps {
  className?: string
}

/**
 * Cagllaロゴ - Cとgを使ってマップピンの形状を表現
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
      
      {/* マップピンの形状（背景） */}
      <path
        d="M16 3C11.03 3 7 7.03 7 12c0 3.87 2.51 7.14 6 8.28V28l3-3 3 3v-7.72c3.49-1.14 6-4.41 6-8.28 0-4.97-4.03-9-9-9z"
        fill="url(#caglla-gradient)"
      />
      
      {/* Cとgの文字 */}
      <text
        x="16"
        y="18"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="white"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        letterSpacing="-0.3"
      >
        Cg
      </text>
    </svg>
  )
}

export default CagllaLogo

