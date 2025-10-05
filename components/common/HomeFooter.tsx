'use client'

import React from 'react'

export interface HomeFooterProps {
  children?: React.ReactNode
}

export const HomeFooter: React.FC<HomeFooterProps> = ({ children }) => {
  return (
    <footer className="border-t bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 py-6 text-sm text-gray-500 flex items-center justify-between">
        <span>© {new Date().getFullYear()} Caglla</span>
        <div className="flex items-center gap-4">
          {children}
        </div>
      </div>
    </footer>
  )
}

export default HomeFooter


