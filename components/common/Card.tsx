'use client'

import React from 'react'

type CardPadding = 'sm' | 'md' | 'lg' | 'none'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  padding?: CardPadding
  interactive?: boolean
  divider?: boolean
}

function paddingClass(padding: CardPadding | undefined): string {
  switch (padding) {
    case 'none':
      return 'p-0'
    case 'sm':
      return 'p-3'
    case 'lg':
      return 'p-6'
    case 'md':
    default:
      return 'p-4'
  }
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  footer,
  padding = 'md',
  interactive = false,
  divider = true,
  className,
  children,
  ...rest
}) => {
  return (
    <div
      className={[
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        interactive ? 'transition hover:shadow-md' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {(title || description) && (
        <div className={[paddingClass('md'), divider ? 'border-b border-gray-200' : ''].join(' ')}>
          {typeof title !== 'undefined' && (
            <div className="text-lg font-medium text-gray-900">{title}</div>
          )}
          {typeof description !== 'undefined' && (
            <div className="mt-1 text-sm text-gray-600">{description}</div>
          )}
        </div>
      )}

      <div className={paddingClass(padding)}>
        {children}
      </div>

      {footer && (
        <div className={[paddingClass('md'), 'border-t border-gray-200'].join(' ')}>
          {footer}
        </div>
      )}
    </div>
  )}

export default Card


