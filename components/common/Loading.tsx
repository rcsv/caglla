'use client'

import React from 'react'

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
  message = '読み込み中... ',
  size = 'md',
  fullScreen = false,
  center = true,
  className,
  ...rest
}) => {
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
        <div className={`animate-spin rounded-full mx-auto border-b-blue-500 border-gray-200 ${sizeClass(size)}`}></div>
        {message && <p className="mt-4 text-gray-600">{message}</p>}
      </div>
    </div>
  )
}

export default Loading


