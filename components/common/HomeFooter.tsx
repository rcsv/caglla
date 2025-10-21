'use client'

import React from 'react'
import Link from 'next/link'

/**
 * フッターコンポーネントのプロパティ
 */
export interface HomeFooterProps {
  /** フッターに追加表示する子要素（オプション） */
  children?: React.ReactNode
}

/**
 * ホームページ用フッターコンポーネント
 * 
 * サイトのフッター情報とナビゲーションリンクを表示します。
 * デスクトップとモバイルで異なるレイアウトを提供します。
 * 
 * @param {HomeFooterProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} フッターコンポーネントのJSX要素
 */
export const HomeFooter: React.FC<HomeFooterProps> = ({ children }) => {
  /** フッターに表示するナビゲーションリンクの配列 */
  const footerLinks = [
    { href: '/privacy', label: 'プライバシーポリシー' },
    { href: '/terms', label: '利用規約' },
    { href: '/contact', label: 'お問い合わせ' },
  ]

  return (
    <footer className="border-t bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 py-6">
        {/* デスクトップ表示 */}
        <div className="hidden md:flex items-center justify-between text-sm text-gray-500">
          <span>© {new Date().getFullYear()} Caglla</span>
          <div className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-gray-700 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
            {children && (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-300">
                {children}
              </div>
            )}
          </div>
        </div>

        {/* モバイル表示 */}
        <div className="md:hidden space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-gray-700 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>© {new Date().getFullYear()} Caglla</span>
            {children && (
              <div className="flex items-center gap-4">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default HomeFooter


