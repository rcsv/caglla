'use client'

import React, { useState, useEffect } from 'react'
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
  // スピナーは上部のボーダーのみに色をつけ、他は透明にする
  switch (color) {
    case 'blue':
      return 'border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent'
    case 'gray':
      return 'border-t-gray-400 border-r-transparent border-b-transparent border-l-transparent'
    case 'emerald':
    default:
      return 'border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent'
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
  // ハイドレーションエラーを防ぐため、クライアント側でのみ言語設定を取得
  const [mounted, setMounted] = useState(false)
  const [displayMessage, setDisplayMessage] = useState<string | undefined>(undefined)

  useEffect(() => {
    setMounted(true)
    // クライアント側でのみi18nメッセージを取得
    if (!message && !inline) {
      setDisplayMessage(t('loading.message'))
    } else if (message) {
      setDisplayMessage(message)
    }
  }, [message, inline])

  // サーバー側レンダリング時はメッセージを表示しない（ハイドレーションエラーを防ぐ）
  const finalMessage = mounted ? displayMessage : message
  
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
        <div className={`animate-spin rounded-full ${borderColorClass} ${inlineSizeClass(size)}`}></div>
        {finalMessage && <span className="text-sm text-gray-600">{finalMessage}</span>}
      </span>
    )
  }

  // 通常表示（フルスクリーンまたは中央配置）
  return (
    <div className={containerClass} {...rest}>
      <div className="text-center">
        <div className={`animate-spin rounded-full mx-auto ${borderColorClass} ${sizeClass(size)}`}></div>
        {finalMessage && <p className="mt-4 text-gray-600">{finalMessage}</p>}
      </div>
    </div>
  )
}

export default Loading


