'use client'

import React from 'react'

export type AccessLevel = 'public' | 'private'

export interface PublicAccessBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  accessLevel: AccessLevel
  onToggle?: () => void
  size?: 'sm' | 'md'
  isTemplate?: boolean // テンプレートモードの場合は Draft/Published 表記に変更
}

const baseClass = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border select-none'

export default function PublicAccessBadge({ accessLevel, onToggle, size = 'sm', isTemplate = false, className, ...rest }: PublicAccessBadgeProps) {
  const isPrivate = accessLevel === 'private'
  const palette = isPrivate
    ? 'bg-gray-100 text-gray-800 border-gray-200'
    : 'bg-green-50 text-green-700 border-green-200'

  // テンプレートモードの場合は Draft/Published 表記
  const label = isTemplate
    ? (isPrivate ? 'Draft' : 'Published')
    : (isPrivate ? 'Private' : 'Public')

  const content = (
    <span
      className={[baseClass, palette, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {isPrivate ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      )}
      {label}
    </span>
  )

  if (!onToggle) return content

  // aria-labelをテンプレートモードに応じて変更
  const ariaLabel = isTemplate
    ? (isPrivate ? 'Publish template' : 'Unpublish template')
    : (isPrivate ? 'Switch to public' : 'Switch to private')

  return (
    <button
      type="button"
      onClick={onToggle}
      className="focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
      aria-label={ariaLabel}
    >
      {content}
    </button>
  )
}


