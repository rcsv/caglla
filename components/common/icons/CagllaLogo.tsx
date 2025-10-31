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
      
      {/* 大きな「C」 - マップピンの上部（丸い部分）に見立てる */}
      <text
        x="16"
        y="13"
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill="white"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        letterSpacing="0"
      >
        C
      </text>
      
      {/* 小文字「g」の円形部分が中央（Cの中心付近）に来るように配置 */}
      {/* gの円形部分（上部の丸）- Cの中に配置 */}
      <circle
        cx="16"
        cy="16"
        r="3.5"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* gの円形部分の左側の縦線（Cの中から下に） */}
      <line
        x1="12.5"
        y1="19.5"
        x2="12.5"
        y2="22"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* gの下部のループ（descenderの丸い部分） */}
      <path
        d="M 12.5 22 
           Q 12.5 23.5 13.5 24 
           Q 14.5 24.5 15.5 24.5 
           Q 16.5 24.5 17.5 24 
           Q 18.5 23.5 18.5 22 
           Q 18.5 20.5 17.5 20 
           Q 16.5 19.5 15.5 19.5 
           Q 14.5 19.5 13.5 20 
           Q 12.5 20.5 12.5 22 Z"
        fill="white"
      />
      {/* gのdescender部分を伸ばしてマップピンの下部（尖った部分）に見立てる */}
      <path
        d="M 15.5 24.5 
           L 15.5 28.5 
           Q 15.5 29.5 16 30 
           Q 16.5 30.5 16 30.5 
           Q 15.5 30.5 15 30 
           Q 14.5 29.5 14.5 28.5 
           L 14.5 24.5"
        fill="white"
      />
      {/* マップピンの尖った部分 */}
      <path
        d="M 16 30.5 L 14 30.5 L 16 31.5 Z"
        fill="white"
      />
    </svg>
  )
}

export default CagllaLogo

