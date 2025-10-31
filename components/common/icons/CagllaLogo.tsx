'use client'

import React from 'react'

export interface CagllaLogoProps {
  className?: string
}

/**
 * Cagllaロゴ - Cとgを使ってマップピンの形状を表現
 * - 大きな「C」がマップピンの上部（丸い部分）
 * - 小文字「g」の円形部分が中央
 * - 「g」の下に伸びる部分がマップピンの下部（尖った部分）
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
      
      {/* 緑の四角形背景（丸みを付ける） */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="6"
        fill="url(#caglla-gradient)"
      />
      
      {/* 大きな「C」 - マップピンの上部に見立てる */}
      <text
        x="16"
        y="13"
        textAnchor="middle"
        fontSize="24"
        fontWeight="700"
        fill="white"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        letterSpacing="0"
      >
        C
      </text>
      
      {/* 小文字「g」の円形部分が中央（Cの中心）に来るように配置 */}
      <text
        x="16"
        y="16"
        textAnchor="middle"
        fontSize="10"
        fontWeight="400"
        fill="white"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        letterSpacing="0"
      >
        g
      </text>
      
      {/* 「g」の下の引っかかるところを伸ばしてマップピンの下部分に見立てる */}
      <path
        d="M 13.5 19.5 Q 13.5 20.5 14 21 Q 14.5 21.5 15.5 21.5 Q 16.5 21.5 17 21 Q 17.5 20.5 17.5 19.5 L 17.5 25 Q 17.5 27 16 27.5 Q 14.5 27 14.5 25 Z"
        fill="white"
      />
    </svg>
  )
}

export default CagllaLogo

