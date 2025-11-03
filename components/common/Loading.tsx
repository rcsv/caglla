'use client'

import React from 'react'
import { t } from '@/lib/i18n'

type LoadingSize = 'sm' | 'md' | 'lg'

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
  size?: LoadingSize
  fullScreen?: boolean
  center?: boolean
  inline?: boolean // インライン表示用（テキストの横に小さなスピナーを表示）
  color?: 'emerald' | 'blue' | 'gray' // スピナーの色
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

function colorClass(color: 'emerald' | 'blue' | 'gray' | undefined) {
  switch (color) {
    case 'blue':
      return 'border-blue-500'
    case 'gray':
      return 'border-gray-400'
    case 'emerald':
    default:
      return 'border-emerald-500'
  }
}

function inlineSizeClass(size: LoadingSize | undefined) {
  switch (size) {
    case 'sm':
      return 'h-4 w-4 border-2'
    case 'lg':
      return 'h-6 w-6 border-2'
    case 'md':
    default:
      return 'h-5 w-5 border-2'
  }
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  size = 'md',
  fullScreen = false,
  center = true,
  inline = false,
  color,
  className,
  ...rest
}) => {
  // messageが指定されない場合は、i18n化されたデフォルトメッセージを使用
  const displayMessage = message || (inline ? undefined : t('loading.message'))
  
  // インライン表示の場合は、centerとfullScreenを無視
  const containerClass = inline
    ? `inline-flex items-center gap-2 ${className || ''}`
    : [
        fullScreen ? 'min-h-screen' : '',
        center ? 'flex items-center justify-center' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')

  // スピナーの色を決定（インラインの場合はblue、それ以外は指定された色またはemerald）
  const spinnerColor = color || (inline ? 'blue' : 'emerald')
  const borderColorClass = colorClass(spinnerColor)

  // インライン表示の場合
  if (inline) {
    return (
      <span className={containerClass} {...rest}>
        <div className={`animate-spin rounded-full ${borderColorClass} border-gray-200 ${inlineSizeClass(size)}`}></div>
        {displayMessage && <span className="text-sm text-gray-600">{displayMessage}</span>}
      </span>
    )
  }

  // 通常表示（フルスクリーンまたは中央配置）
  return (
    <div className={containerClass} {...rest}>
      <div className="text-center">
        <div className={`animate-spin rounded-full mx-auto ${borderColorClass} border-gray-200 ${sizeClass(size)}`}></div>
        {displayMessage && <p className="mt-4 text-gray-600">{displayMessage}</p>}
      </div>
    </div>
  )
}

export default Loading


