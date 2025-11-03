'use client'

import React from 'react'
import { t } from '@/lib/i18n'

type LoadingSize = 'sm' | 'md' | 'lg'

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
  size?: LoadingSize
  fullScreen?: boolean
  center?: boolean
}

function sizeClass(size: LoadingSize | undefined) {
  switch (size) {
    case 'sm':
      return 'h-6 w-6 border-2'
    case 'lg':
      return 'h-16 w-16 border-4'
    case 'md':
    default:
      return 'h-12 w-12 border-4'
  }
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  size = 'md',
  fullScreen = false,
  center = true,
  className,
  ...rest
}) => {
  // messageが指定されない場合は、i18n化されたデフォルトメッセージを使用
  const displayMessage = message || t('loading.message')
  
  const containerClass = [
    fullScreen ? 'min-h-screen' : '',
    center ? 'flex items-center justify-center' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClass} {...rest}>
      <div className="text-center">
        <div className={`animate-spin rounded-full mx-auto border-b-emerald-500 border-gray-200 ${sizeClass(size)}`}></div>
        {displayMessage && <p className="mt-4 text-gray-600">{displayMessage}</p>}
      </div>
    </div>
  )
}

export default Loading


